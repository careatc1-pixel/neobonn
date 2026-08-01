/**
 * neobonn — Google Sheets Backend
 * ------------------------------------------------------------------
 * This single Apps Script file replaces a traditional paid backend
 * server. It reads/writes a Google Sheet used as a database, and
 * verifies Razorpay payment signatures — so you don't need to rent a
 * server or manage an IP/domain for backend logic.
 *
 * SETUP:
 * 1. Create a Google Sheet named "Neobonn Database" with these tabs
 *    (exact names, header row as shown):
 *
 *    Users        | Name | Email | Phone | Password | CreatedAt
 *    Enquiries    | Name | Email | Phone | Message | CreatedAt
 *    Orders       | OrderId | Items(JSON) | CustomerName | Email | Phone
 *                 | Address | City | Pincode | Amount | Status
 *                 | RazorpayOrderId | RazorpayPaymentId | CreatedAt
 *                 | TrackingStatus | Carrier | TrackingNumber
 *                 | TrackingHistory(JSON)
 *                 | OrderPlacedAt | ConfirmedAt | ShippedAt
 *                 | OutForDeliveryAt | DeliveredAt | CancelledAt
 *
 *    NOTE ON SHIPMENT TRACKING (Amazon-style, one column per stage):
 *    "Status" (column J) is the PAYMENT status (Pending/Paid).
 *    "TrackingStatus" (column N) is just the CURRENT shipment stage name,
 *    for a quick glance. The actual source of truth is the 6 dedicated
 *    date columns at the end (OrderPlacedAt ... CancelledAt) — each one
 *    gets a timestamp exactly ONCE, the first time an order reaches that
 *    stage. Re-saving the same stage again in the admin panel is a no-op
 *    (idempotent): it will NOT overwrite that column's timestamp and
 *    will NOT send a duplicate email. "TrackingHistory(JSON)" is kept
 *    only as a lightweight internal note log for the customer-facing
 *    timeline UI — you never need to read or edit it by hand; everything
 *    you'd want to see is in the plain date columns.
 *    If you're adding these columns to an existing sheet, add them in
 *    this exact order after CreatedAt — existing rows are read by fixed
 *    column position (see handlePlaceOrder/handleGetMyOrders) so append,
 *    don't insert, these columns.
 *    Products     | Id | Name | SeoTitle | Tagline | Category | Price | ComingSoon
 *                 | Image | ShortDescription | Description
 *                 | Ingredients(JSON) | Specifications(JSON) | Stock
 *
 *    IMPORTANT: these Products headers must be spelled EXACTLY as above
 *    (case-sensitive) in row 1 of the Products tab — the script looks
 *    up each column BY NAME, not by position, so you can safely
 *    reorder or add extra columns of your own without breaking
 *    anything. Just don't rename/remove the headers above.
 *
 *    NOTE ON INVENTORY: The "Stock" column holds how many units of
 *    that product are currently available. The admin panel's "Manage
 *    Inventory" controls read/write this column directly. When a
 *    payment is verified (handleVerifyPayment), stock is automatically
 *    decremented by the quantity purchased. Once a product's Stock
 *    reaches 0, the storefront automatically shows it as "Out of Stock"
 *    and disables Add to Bag for it — no manual step needed.
 *
 * 2. Extensions > Apps Script, paste this file's contents as Code.gs.
 * 3. Project Settings > Script Properties, add:
 *      RAZORPAY_KEY_ID       = rzp_live_xxxxx (or rzp_test_xxxxx)
 *      RAZORPAY_KEY_SECRET   = your_secret_key
 *      GOOGLE_CLIENT_ID      = your OAuth Web client ID
 *                              (same value as VITE_GOOGLE_CLIENT_ID in the
 *                              frontend .env — needed for "Continue with
 *                              Google" login to work)
 * 4. Deploy > New deployment > type "Web app".
 *      Execute as:  Me
 *      Who has access: Anyone
 * 5. Copy the deployment URL into your frontend .env as
 *      VITE_SHEETS_API_URL=<deployment url>
 *
 * SECURITY NOTE: Passwords here are stored in plain text for
 * simplicity. Before going live, hash passwords (e.g. with a salted
 * SHA-256 via Utilities.computeDigest) before writing to the sheet,
 * and compare hashes on login instead of raw text.
 * ------------------------------------------------------------------
 */

const SHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";

// Bump this whenever you redeploy — lets you confirm from the browser
// that the LIVE deployment is actually running this file, by visiting
// your deployment URL (as a GET) or checking the "ping" action's
// response. Prevents "did my redeploy actually take effect?" confusion.
const CODE_VERSION = "2026-08-01-order-emails-v2-idempotent";

function getSheet(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

// Visit your deployment URL directly in a browser (a plain GET request)
// to instantly confirm which code version is actually live, and to see
// exactly how the Products sheet's headers are being matched right now
// — invaluable when stock updates seem to "go missing."
function doGet() {
  let schema = null;
  try {
    const sheet = getSheet("Products");
    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    schema = { headerRow: header, resolvedColumns: getProductColumnMap(sheet) };
  } catch (err) {
    schema = { error: String(err) };
  }
  return jsonResponse({ ok: true, version: CODE_VERSION, productsSheetSchema: schema });
}

// ---- Header-based column lookup for the Products sheet ----
// Reads columns by their header NAME instead of a hardcoded position, so
// the sheet stays correct even if someone inserts/reorders/renames-back
// a column by hand, or a CSV import ever shifts things. This is what
// prevents "wrong column read as Stock" / "row silently dropped" bugs.
const PRODUCT_COLUMNS = [
  "Id", "Name", "SeoTitle", "Tagline", "Category", "Price", "ComingSoon", "Image",
  "ShortDescription", "Description", "Ingredients(JSON)", "Specifications(JSON)", "Stock",
];

function normalizeHeaderText(s) {
  return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getProductColumnMap(sheet) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const wanted = {}; // normalized header text -> canonical column name
  PRODUCT_COLUMNS.forEach((col) => {
    wanted[normalizeHeaderText(col)] = col;
  });

  const map = {};
  header.forEach((h, i) => {
    const norm = normalizeHeaderText(h);
    if (norm && wanted[norm] && !(wanted[norm] in map)) {
      map[wanted[norm]] = i; // 0-based index within a row
    }
  });
  // Guard: if a column's header is genuinely missing (not just
  // differently-cased/spaced), fall back to the documented default
  // position rather than silently losing data.
  PRODUCT_COLUMNS.forEach((col, i) => {
    if (!(col in map)) map[col] = i;
  });
  return map;
}

function rowToProductObject(row, colMap) {
  const val = (col) => row[colMap[col]];
  const id = String(val("Id") || "").trim() || slugifyForSheet(val("Name"));
  return {
    id,
    name: val("Name"),
    seoTitle: val("SeoTitle"),
    tagline: val("Tagline"),
    category: val("Category"),
    price: val("Price") || null,
    comingSoon: val("ComingSoon") === true || val("ComingSoon") === "TRUE",
    image: val("Image"),
    shortDescription: val("ShortDescription"),
    description: val("Description"),
    ingredients: safeParse(val("Ingredients(JSON)"), []),
    specifications: safeParse(val("Specifications(JSON)"), {}),
    stock: Number(val("Stock")) || 0,
  };
}

function productToRowArray(p, colMap) {
  const row = new Array(PRODUCT_COLUMNS.length).fill("");
  const set = (col, value) => {
    if (col in colMap) row[colMap[col]] = value;
  };
  set("Id", p.id);
  set("Name", p.name);
  set("SeoTitle", p.seoTitle);
  set("Tagline", p.tagline);
  set("Category", p.category);
  set("Price", p.price);
  set("ComingSoon", !!p.comingSoon);
  set("Image", p.image);
  set("ShortDescription", p.shortDescription);
  set("Description", p.description);
  set("Ingredients(JSON)", JSON.stringify(p.ingredients || []));
  set("Specifications(JSON)", JSON.stringify(p.specifications || {}));
  set("Stock", Number(p.stock) || 0);
  return row;
}

function slugifyForSheet(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || ("product-" + new Date().getTime());
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const { action, payload } = body;

  try {
    switch (action) {
      case "signup":
        return jsonResponse(handleSignup(payload));
      case "login":
        return jsonResponse(handleLogin(payload));
      case "sendOtp":
        return jsonResponse(handleSendOtp(payload));
      case "verifyOtpLogin":
        return jsonResponse(handleVerifyOtpLogin(payload));
      case "googleLogin":
        return jsonResponse(handleGoogleLogin(payload));
      case "resetPasswordWithOtp":
        return jsonResponse(handleResetPasswordWithOtp(payload));
      case "enquiry":
        return jsonResponse(handleEnquiry(payload));
      case "placeOrder":
        return jsonResponse(handlePlaceOrder(payload));
      case "verifyPayment":
        return jsonResponse(handleVerifyPayment(payload));
      case "getMyOrders":
        return jsonResponse(handleGetMyOrders(payload));
      case "trackOrder":
        return jsonResponse(handleTrackOrder(payload));
      case "listAllOrders":
        return jsonResponse(handleListAllOrders());
      case "updateOrderStatus":
        return jsonResponse(handleUpdateOrderStatus(payload));
      case "listProducts":
        return jsonResponse(handleListProducts());
      case "upsertProduct":
        return jsonResponse(handleUpsertProduct(payload));
      case "deleteProduct":
        return jsonResponse(handleDeleteProduct(payload));
      case "updateStock":
        return jsonResponse(handleUpdateStock(payload));
      case "bulkUpsertProducts":
        return jsonResponse(handleBulkUpsertProducts(payload));
      default:
        return jsonResponse({ ok: false, message: "Unknown action" });
    }
  } catch (err) {
    return jsonResponse({ ok: false, message: err.message });
  }
}

// ---------------- Users ----------------

// ---------------- Order & shipment notification emails ----------------
// Uses the same FREE MailApp mechanism as the OTP emails above — no
// third-party service, no per-message cost, just your Google account's
// own daily email quota (~100/day on a plain Gmail account, much higher
// on Google Workspace). Every email send is wrapped in try/catch so a
// mail failure (e.g. daily quota hit) never breaks the order/status
// update itself — the sheet is always the source of truth.

function formatOrderItemsPlain(items) {
  return (items || [])
    .map((it) => `  • ${it.name} × ${it.qty}${it.price ? ` — ₹${it.price * it.qty}` : ""}`)
    .join("\n");
}

// Sent once, right after payment is confirmed.
function sendOrderConfirmationEmail(order) {
  try {
    if (!order || !order.email) return { ok: false, error: "No email on order." };
    const subject = `Order confirmed — ${order.orderId} | neobonn`;
    const body =
      `Hi ${order.customerName || "there"},\n\n` +
      `Thanks for shopping with neobonn! Your order has been confirmed.\n\n` +
      `Order ID: ${order.orderId}\n` +
      `Items:\n${formatOrderItemsPlain(order.items)}\n\n` +
      `Total: ₹${order.amount}\n\n` +
      `Deliver to: ${order.address}, ${order.city} - ${order.pincode}\n\n` +
      `Track your order anytime at: https://www.neobonn.com/track-order?orderId=${encodeURIComponent(order.orderId)}&email=${encodeURIComponent(order.email)}\n\n` +
      `— Team neobonn`;
    MailApp.sendEmail(order.email, subject, body);
    return { ok: true };
  } catch (err) {
    console.error("sendOrderConfirmationEmail failed: " + err.message);
    return { ok: false, error: err.message };
  }
}

// Sent every time an admin moves an order to a new shipment stage.
function sendOrderStatusEmail(order, status, note, carrier, trackingNumber) {
  try {
    if (!order || !order.email) return { ok: false, error: "No email on order." };
    const subject = `Order ${order.orderId} — ${status} | neobonn`;
    const lines = [
      `Hi ${order.customerName || "there"},`,
      "",
      `Your order ${order.orderId} is now: ${status}${note ? ` — ${note}` : ""}`,
      "",
      `Items:`,
      formatOrderItemsPlain(order.items),
      "",
      `Total: ₹${order.amount}`,
    ];
    if (carrier) lines.push(`Courier: ${carrier}`);
    if (trackingNumber) lines.push(`Tracking number: ${trackingNumber}`);
    lines.push(
      "",
      `Track your order anytime at: https://www.neobonn.com/track-order?orderId=${encodeURIComponent(order.orderId)}&email=${encodeURIComponent(order.email)}`,
      "",
      `— Team neobonn`
    );
    MailApp.sendEmail(order.email, subject, lines.join("\n"));
    return { ok: true };
  } catch (err) {
    console.error("sendOrderStatusEmail failed: " + err.message);
    return { ok: false, error: err.message };
  }
}

// ---- One-time setup helper — RUN THIS MANUALLY ONCE FROM THE EDITOR ----
// The #1 reason order emails silently never arrive: MailApp has never
// been authorized for this script. Apps Script only asks for that
// permission the first time a function using MailApp actually *runs*
// inside the editor (not via the deployed Web App — Web App calls fail
// silently if authorization was never granted).
//
// HOW TO USE: Apps Script editor → function dropdown (top, next to Debug)
// → select "testEmailSetup" → click Run (▶). The first time, Google will
// show a permission screen — click "Advanced" → "Go to (project name),
// unsafe" → "Allow". Then check the inbox of your OWN Google account
// (the one that owns this Apps Script project / deployment) for a test
// email. Once that arrives, order emails will start working too.
function testEmailSetup() {
  const to = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(
    to,
    "neobonn: email setup test ✅",
    "If you're reading this, MailApp is authorized on this script and order confirmation / shipment status emails will now work."
  );
  return "Test email sent to: " + to;
}

function handleSignup({ name, email, phone, password }) {
  const sheet = getSheet("Users");
  const rows = sheet.getDataRange().getValues();
  const exists = rows.some((r) => r[1] === email);
  if (exists) return { ok: false, message: "Email already registered." };

  sheet.appendRow([name, email, phone, password, new Date()]);
  return { ok: true, user: { name, email, phone } };
}

function handleLogin({ email, password }) {
  const sheet = getSheet("Users");
  const rows = sheet.getDataRange().getValues();
  const match = rows.find((r) => r[1] === email && r[3] === password);
  if (!match) return { ok: false, message: "Invalid email or password." };
  return { ok: true, user: { name: match[0], email: match[1], phone: match[2] } };
}

// ---------------- OTP: Email-based login & password reset ----------------
// Uses Apps Script's built-in MailApp to send OTP emails — this is FREE
// (uses your Google account's own daily email sending quota; ~100
// emails/day on a plain Gmail account, much higher on Google Workspace).
// No third-party SMS/email service or per-message cost is involved.
// OTPs are stored in CacheService (auto-expires — nothing to clean up).

const OTP_TTL_SECONDS = 300; // 5 minutes

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

function handleSendOtp({ email, purpose }) {
  // purpose is "login" or "reset"
  const usersSheet = getSheet("Users");
  const rows = usersSheet.getDataRange().getValues();
  const match = rows.find((r) => r[1] === email);

  if (!match) {
    return { ok: false, message: "No account found with this email." };
  }

  const otp = generateOtp();
  CacheService.getScriptCache().put(`otp_${purpose}_${email}`, otp, OTP_TTL_SECONDS);

  const subject =
    purpose === "reset" ? "Reset your neobonn password" : "Your neobonn login code";
  const body =
    `Hi ${match[0]},\n\n` +
    `Your one-time code is: ${otp}\n\n` +
    `This code is valid for 5 minutes. If you didn't request this, you can safely ignore this email.\n\n` +
    `— neobonn`;

  MailApp.sendEmail(email, subject, body);
  return { ok: true };
}

function handleVerifyOtpLogin({ email, otp }) {
  const cache = CacheService.getScriptCache();
  const stored = cache.get(`otp_login_${email}`);

  if (!stored || stored !== otp) {
    return { ok: false, message: "Invalid or expired code. Please request a new one." };
  }
  cache.remove(`otp_login_${email}`);

  const sheet = getSheet("Users");
  const rows = sheet.getDataRange().getValues();
  const match = rows.find((r) => r[1] === email);
  if (!match) return { ok: false, message: "No account found with this email." };

  return { ok: true, user: { name: match[0], email: match[1], phone: match[2] } };
}

// ---------------- Google Sign-In ----------------
// Verifies the ID token (JWT) sent from the frontend's Google button by
// asking Google's own tokeninfo endpoint to validate its signature and
// return the decoded payload. This confirms the token is genuine and was
// issued for OUR client ID (not spoofed), without needing any JWT
// library. Requires a Script Property:
//   GOOGLE_CLIENT_ID = <your OAuth Web client ID>.apps.googleusercontent.com
// (same value as VITE_GOOGLE_CLIENT_ID in the frontend .env)

function handleGoogleLogin({ credential }) {
  if (!credential) return { ok: false, message: "Missing Google credential." };

  const clientId = PropertiesService.getScriptProperties().getProperty("GOOGLE_CLIENT_ID");
  if (!clientId) {
    return { ok: false, message: "Google Sign-In is not configured yet. Add GOOGLE_CLIENT_ID in Script Properties." };
  }

  let payload;
  try {
    const res = UrlFetchApp.fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential),
      { muteHttpExceptions: true }
    );
    payload = JSON.parse(res.getContentText());
  } catch (err) {
    return { ok: false, message: "Could not verify Google credential." };
  }

  if (!payload || payload.aud !== clientId) {
    return { ok: false, message: "Google credential is invalid or was issued for a different app." };
  }
  if (payload.email_verified !== "true" && payload.email_verified !== true) {
    return { ok: false, message: "This Google account's email is not verified." };
  }

  const email = payload.email;
  const name = payload.name || email.split("@")[0];

  const sheet = getSheet("Users");
  const rows = sheet.getDataRange().getValues();
  const match = rows.find((r) => r[1] === email);

  if (match) {
    return { ok: true, user: { name: match[0], email: match[1], phone: match[2] } };
  }

  // First time signing in with Google — create an account automatically.
  // Password column is left blank; this user can only sign in via Google
  // or OTP unless they later set a password from "Forgot password".
  sheet.appendRow([name, email, "", "", new Date()]);
  return { ok: true, user: { name, email, phone: "" } };
}

function handleResetPasswordWithOtp({ email, otp, newPassword }) {
  const cache = CacheService.getScriptCache();
  const stored = cache.get(`otp_reset_${email}`);

  if (!stored || stored !== otp) {
    return { ok: false, message: "Invalid or expired code. Please request a new one." };
  }
  cache.remove(`otp_reset_${email}`);

  const sheet = getSheet("Users");
  const rows = sheet.getDataRange().getValues();
  const rowIndex = rows.findIndex((r) => r[1] === email);
  if (rowIndex === -1) return { ok: false, message: "No account found with this email." };

  sheet.getRange(rowIndex + 1, 4).setValue(newPassword); // column D = Password
  return { ok: true };
}

// ---------------- Enquiries ----------------

function handleEnquiry({ name, email, phone, message }) {
  getSheet("Enquiries").appendRow([name, email, phone, message, new Date()]);
  return { ok: true };
}

// ---------------- Orders ----------------

function handlePlaceOrder({ items, customer, amount }) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    // ---- Stock check: refuse the order if anything in the cart has
    // sold out or doesn't have enough units left, so we never oversell.
    const stockError = checkStockAvailability(items);
    if (stockError) return { ok: false, message: stockError };

    const orderId = "ORD" + new Date().getTime();

    // Create a Razorpay Order via their API (requires Key Id/Secret in
    // Script Properties) so the frontend gets a valid order_id to open
    // the Razorpay Checkout with.
    const props = PropertiesService.getScriptProperties();
    const keyId = props.getProperty("RAZORPAY_KEY_ID");
    const keySecret = props.getProperty("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      return {
        ok: false,
        message: "Razorpay is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Script Properties.",
      };
    }

    const rzpRes = UrlFetchApp.fetch("https://api.razorpay.com/v1/orders", {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization:
          "Basic " + Utilities.base64Encode(keyId + ":" + keySecret),
      },
      payload: JSON.stringify({
        amount: amount * 100,
        currency: "INR",
        receipt: orderId,
      }),
      muteHttpExceptions: true,
    });
    const rzpOrder = JSON.parse(rzpRes.getContentText());

    if (!rzpOrder.id) {
      // Razorpay rejected the request — usually bad/missing API keys, or
      // Razorpay account not yet activated. Surface a clear error instead
      // of silently saving a broken order.
      const reason = (rzpOrder.error && rzpOrder.error.description) || "Unknown error";
      return { ok: false, message: "Could not create payment order: " + reason };
    }

    const initialHistory = [
      { status: "Order Placed", note: "We've received your order.", at: new Date().toISOString() },
    ];
    const now = new Date();

    getSheet("Orders").appendRow([
      orderId,
      JSON.stringify(items),
      customer.name,
      customer.email,
      customer.phone,
      customer.line1,
      customer.city,
      customer.pincode,
      amount,
      "Pending",
      rzpOrder.id || "",
      "",
      now, // CreatedAt
      "Order Placed", // TrackingStatus
      "", // Carrier
      "", // TrackingNumber
      JSON.stringify(initialHistory), // TrackingHistory(JSON) — internal note log only
      now, // OrderPlacedAt
      "", // ConfirmedAt
      "", // ShippedAt
      "", // OutForDeliveryAt
      "", // DeliveredAt
      "", // CancelledAt
    ]);

    return { ok: true, orderId, razorpayOrderId: rzpOrder.id, razorpayKeyId: keyId };
  } finally {
    lock.releaseLock();
  }
}

// Checks the Products sheet's Stock column against the quantities being
// ordered. Returns a human-readable error message string if something
// is unavailable, or null if the whole cart can be fulfilled.
function checkStockAvailability(items) {
  const sheet = getSheet("Products");
  const rows = sheet.getDataRange().getValues();
  const colMap = getProductColumnMap(sheet);
  const idCol = colMap["Id"];
  const nameCol = colMap["Name"];
  const stockCol = colMap["Stock"];
  for (const item of items) {
    const row = rows.find((r) => String(r[idCol]) === String(item.id));
    if (!row) continue; // unknown product id — let it through, nothing to check
    const available = Number(row[stockCol]) || 0;
    if (available <= 0) {
      return `Sorry, "${row[nameCol]}" just sold out. Please remove it from your bag.`;
    }
    if (available < Number(item.qty || 0)) {
      return `Sorry, only ${available} left of "${row[nameCol]}". Please lower the quantity in your bag.`;
    }
  }
  return null;
}

// Subtracts purchased quantities from the Products sheet's Stock column.
// Never goes below 0.
function deductStock(items) {
  const sheet = getSheet("Products");
  const rows = sheet.getDataRange().getValues();
  const colMap = getProductColumnMap(sheet);
  const idCol = colMap["Id"];
  const stockCol = colMap["Stock"];
  items.forEach((item) => {
    const rowIndex = rows.findIndex((r, i) => i > 0 && String(r[idCol]) === String(item.id));
    if (rowIndex === -1) return;
    const current = Number(rows[rowIndex][stockCol]) || 0;
    const next = Math.max(0, current - Number(item.qty || 0));
    sheet.getRange(rowIndex + 1, stockCol + 1).setValue(next);
  });
}

function handleVerifyPayment({ orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature }) {
  const props = PropertiesService.getScriptProperties();
  const keySecret = props.getProperty("RAZORPAY_KEY_SECRET");

  // Razorpay's official verification: HMAC-SHA256 of "order_id|payment_id"
  const expectedSig = Utilities.computeHmacSha256Signature(
    razorpay_order_id + "|" + razorpay_payment_id,
    keySecret
  )
    .map((b) => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0"))
    .join("");

  if (expectedSig !== razorpay_signature) {
    return { ok: false, message: "Signature mismatch." };
  }

  // Mark order as Paid in the sheet, and deduct stock — guarded by a
  // lock + an "already Paid" check so a retried/duplicate verification
  // call never deducts stock twice for the same order.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let confirmedOrder = null;
  try {
    const sheet = getSheet("Orders");
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === orderId) {
        const alreadyPaid = rows[i][9] === "Paid";
        sheet.getRange(i + 1, 10).setValue("Paid"); // Status column
        sheet.getRange(i + 1, 12).setValue(razorpay_payment_id); // RazorpayPaymentId column
        if (!alreadyPaid) {
          const items = safeParse(rows[i][1], []); // Items(JSON) column
          deductStock(items);
          confirmedOrder = rowToOrderObject(sheet.getRange(i + 1, 1, 1, 23).getValues()[0]);
        }
        break;
      }
    }
  } finally {
    lock.releaseLock();
  }

  // Send the confirmation email outside the lock (and only on the first
  // successful verification) so a slow/failed email send never holds up
  // the lock for other orders.
  if (confirmedOrder) sendOrderConfirmationEmail(confirmedOrder);

  return { ok: true };
}

// Maps a shipment status name to which column holds its "reached at"
// timestamp. This is the single source of truth for stage progression —
// each column is written exactly once (see handleUpdateOrderStatus).
const STAGE_COLUMNS = {
  "Order Placed": 18, // R
  Confirmed: 19, // S
  Shipped: 20, // T
  "Out for Delivery": 21, // U
  Delivered: 22, // V
  Cancelled: 23, // W
};
const TRACKING_STAGES = ["Order Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

// Shared: turns one Orders sheet row into the object the frontend uses.
function rowToOrderObject(r) {
  const stageTimestamps = {};
  Object.keys(STAGE_COLUMNS).forEach((stage) => {
    const val = r[STAGE_COLUMNS[stage] - 1]; // convert 1-based column -> 0-based array index
    if (val) stageTimestamps[stage] = val;
  });

  return {
    orderId: r[0],
    items: safeParse(r[1], []),
    customerName: r[2],
    email: r[3],
    phone: r[4],
    address: r[5],
    city: r[6],
    pincode: r[7],
    amount: r[8],
    status: r[9], // payment status: Pending | Paid
    createdAt: r[12],
    trackingStatus: r[13] || "Order Placed",
    carrier: r[14] || "",
    trackingNumber: r[15] || "",
    trackingHistory: safeParse(r[16], []), // internal note log, for the timeline UI only
    // Clean, Amazon-style per-stage timestamps — e.g. stageTimestamps.Shipped
    // is either an ISO date string or absent if not reached yet.
    stageTimestamps,
  };
}

function handleGetMyOrders({ email }) {
  const sheet = getSheet("Orders");
  const rows = sheet.getDataRange().getValues();
  const [, ...data] = rows;
  const orders = data
    .filter((r) => r[0] && r[3] === email) // column D = Email
    .map(rowToOrderObject)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return { ok: true, orders };
}

// ---------------- Shipment tracking ----------------

// Public "Track your order" lookup — no login required, but still scoped
// so a random orderId alone can't pull up someone else's order: the
// requester must also know the email (or phone) on the order.
function handleTrackOrder({ orderId, email, phone }) {
  if (!orderId || (!email && !phone)) {
    return { ok: false, message: "Please provide your Order ID and the email or phone used to order." };
  }
  const sheet = getSheet("Orders");
  const rows = sheet.getDataRange().getValues();
  const [, ...data] = rows;
  const match = data.find(
    (r) =>
      String(r[0]).trim().toLowerCase() === String(orderId).trim().toLowerCase() &&
      ((email && String(r[3]).trim().toLowerCase() === String(email).trim().toLowerCase()) ||
        (phone && String(r[4]).trim() === String(phone).trim()))
  );
  if (!match) {
    return { ok: false, message: "No order found with that Order ID and email/phone combination." };
  }
  return { ok: true, order: rowToOrderObject(match) };
}

// Admin: full order list (across all customers), newest first, for the
// admin dashboard's Orders tab. Mirrors the existing admin panel's
// security model (client-side gate only, like listProducts/upsertProduct)
// rather than introducing a new auth layer inconsistent with the rest of
// this file.
function handleListAllOrders() {
  const sheet = getSheet("Orders");
  const rows = sheet.getDataRange().getValues();
  const [, ...data] = rows;
  const orders = data
    .filter((r) => r[0])
    .map(rowToOrderObject)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { ok: true, orders };
}

// Admin: moves an order to a new shipment stage (or "Cancelled").
//
// PROFESSIONAL / AMAZON-STYLE BEHAVIOUR:
// - Each stage (Order Placed, Confirmed, Shipped, Out for Delivery,
//   Delivered, Cancelled) has its own dedicated date column. That column
//   is written EXACTLY ONCE — the first time the order reaches that
//   stage. Saving the same stage again is a safe no-op: nothing is
//   overwritten, no duplicate email is sent, no duplicate log entry is
//   added.
// - Once an order is Cancelled, no further status changes are allowed.
// - Carrier / tracking number can still be added or corrected on top of
//   an already-reached stage (e.g. tracking number arrives a day after
//   "Shipped" was set) — that alone still counts as a real update and
//   still notifies the customer, without touching the stage timestamp.
function handleUpdateOrderStatus({ orderId, status, note, carrier, trackingNumber }) {
  if (!orderId || !status) return { ok: false, message: "orderId and status are required." };
  if (!STAGE_COLUMNS[status]) {
    return { ok: false, message: "Unknown status: " + status };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let updatedOrder = null;
  let isMeaningfulChange = false;
  try {
    const sheet = getSheet("Orders");
    const rows = sheet.getDataRange().getValues();
    const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === orderId);
    if (rowIndex === -1) return { ok: false, message: "Order not found." };

    const row = rows[rowIndex];
    if (row[STAGE_COLUMNS["Cancelled"] - 1]) {
      return { ok: false, message: "This order is already cancelled — no further status changes are allowed." };
    }

    const stageCol = STAGE_COLUMNS[status];
    const stageAlreadyReached = !!row[stageCol - 1];
    const currentCarrier = row[14] || "";
    const currentTrackingNumber = row[15] || "";
    const carrierChanged = carrier !== undefined && carrier !== currentCarrier;
    const trackingNumberChanged = trackingNumber !== undefined && trackingNumber !== currentTrackingNumber;

    isMeaningfulChange = !stageAlreadyReached || carrierChanged || trackingNumberChanged;

    if (!isMeaningfulChange) {
      // Nothing actually changed — same status re-saved with the same
      // carrier/tracking number. Return the order as-is, no writes at all.
      return {
        ok: true,
        order: rowToOrderObject(row),
        skipped: true,
        message: `Order is already marked "${status}" — no changes made.`,
      };
    }

    if (!stageAlreadyReached) {
      sheet.getRange(rowIndex + 1, stageCol).setValue(new Date()); // e.g. ShippedAt
      sheet.getRange(rowIndex + 1, 14).setValue(status); // TrackingStatus — current stage
    }
    if (carrier !== undefined) sheet.getRange(rowIndex + 1, 15).setValue(carrier);
    if (trackingNumber !== undefined) sheet.getRange(rowIndex + 1, 16).setValue(trackingNumber);

    // Internal note log (for the customer-facing timeline UI only — not
    // something you need to read directly in the sheet).
    const history = safeParse(row[16], []);
    history.push({ status, note: note || "", at: new Date().toISOString() });
    sheet.getRange(rowIndex + 1, 17).setValue(JSON.stringify(history));

    updatedOrder = rowToOrderObject(sheet.getRange(rowIndex + 1, 1, 1, 23).getValues()[0]);
  } finally {
    lock.releaseLock();
  }

  // Email the customer outside the lock, so a slow/failed send never
  // blocks other admin actions. Only for a real change (see above).
  let emailResult = { ok: true, skipped: true };
  if (isMeaningfulChange) {
    emailResult = sendOrderStatusEmail(updatedOrder, status, note, carrier, trackingNumber);
  }

  return {
    ok: true,
    order: updatedOrder,
    emailSent: !!emailResult.ok && !emailResult.skipped,
    emailError: emailResult.ok ? null : emailResult.error,
  };
}

// ---------------- Products (Admin Panel) ----------------

function handleListProducts() {
  const sheet = getSheet("Products");
  const rows = sheet.getDataRange().getValues();
  const colMap = getProductColumnMap(sheet);
  const [, ...data] = rows;
  const products = data
    .filter((r) => r.some((cell) => cell !== "")) // skip fully blank rows only
    .map((r) => rowToProductObject(r, colMap));
  return { ok: true, products };
}

function handleUpsertProduct(p) {
  const sheet = getSheet("Products");
  const rows = sheet.getDataRange().getValues();
  const colMap = getProductColumnMap(sheet);
  const idCol = colMap["Id"];
  const rowIndex = rows.findIndex((r, i) => i > 0 && String(r[idCol]) === String(p.id));
  const rowData = productToRowArray(p, colMap);
  if (rowIndex === -1) {
    sheet.appendRow(rowData);
  } else {
    sheet.getRange(rowIndex + 1, 1, 1, rowData.length).setValues([rowData]);
  }
  return handleListProducts();
}

// Bulk import: upserts an entire batch of products in one call — used by
// the admin panel's "Import CSV" tool so someone can add/update their
// whole catalog in one shot instead of one product at a time. Rows with
// a matching Id are updated in place; unmatched Ids are appended.
function handleBulkUpsertProducts({ products }) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet("Products");
    const data = sheet.getDataRange().getValues();
    const colMap = getProductColumnMap(sheet);
    const idCol = colMap["Id"];
    const idRowIndex = {}; // productId -> 1-based sheet row number
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol]) idRowIndex[String(data[i][idCol])] = i + 1;
    }

    const newRows = [];
    (products || []).forEach((p) => {
      const rowData = productToRowArray(p, colMap);
      if (idRowIndex.hasOwnProperty(String(p.id))) {
        sheet.getRange(idRowIndex[String(p.id)], 1, 1, rowData.length).setValues([rowData]);
      } else {
        newRows.push(rowData);
      }
    });

    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }

    return handleListProducts();
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteProduct({ id }) {
  const sheet = getSheet("Products");
  const rows = sheet.getDataRange().getValues();
  const colMap = getProductColumnMap(sheet);
  const idCol = colMap["Id"];
  const rowIndex = rows.findIndex((r, i) => i > 0 && String(r[idCol]) === String(id));
  if (rowIndex > -1) sheet.deleteRow(rowIndex + 1);
  return handleListProducts();
}

// Quick inventory-only update (used by the admin panel's "Manage
// Inventory" stepper) — only touches the Stock column, so it can't
// accidentally clobber other fields someone else may be editing.
function handleUpdateStock({ id, stock }) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet("Products");
    const rows = sheet.getDataRange().getValues();
    const colMap = getProductColumnMap(sheet);
    const idCol = colMap["Id"];
    const stockCol = colMap["Stock"];
    const rowIndex = rows.findIndex((r, i) => i > 0 && String(r[idCol]) === String(id));
    if (rowIndex === -1) return { ok: false, message: "Product not found." };
    sheet.getRange(rowIndex + 1, stockCol + 1).setValue(Math.max(0, Number(stock) || 0));
    return handleListProducts();
  } finally {
    lock.releaseLock();
  }
}

function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
