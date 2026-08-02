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
 *    Errors       | TrialId | Timestamp | Message | Stack | Context
 *                 | Url | UserAgent | Fatal
 *
 *    NOTE ON THE ERRORS SHEET: the storefront never shows customers a
 *    raw error message — instead it shows a friendly "Oops" screen with
 *    a short trial ID (e.g. "NB-8K2F41"). The real technical detail
 *    (message, stack trace, page URL, browser) is written here, keyed
 *    by that same trial ID. If a customer reports a trial ID, look it
 *    up in Admin -> Error Logs (or directly in this tab) to see exactly
 *    what went wrong.
 *
 *    Returns      | ReturnId | OrderId | Email | CustomerName | Phone
 *                 | Type | Items(JSON) | Reason | ImageLinks(JSON)
 *                 | VideoLink | Status | RequestedAt | ReviewedAt
 *                 | AdminNote | RefundAmount | RefundStatus
 *                 | RazorpayRefundId
 *
 *    NOTE ON RETURNS & EXCHANGES: customers can request a return or
 *    exchange within 7 days of delivery, and MUST attach at least one
 *    photo and one short video of the product as proof — these are
 *    uploaded to a Google Drive folder ("neobonn Returns & Exchanges")
 *    and the shareable links are stored in ImageLinks(JSON)/VideoLink.
 *    "Type" is either "Return" or "Exchange". "Status" moves
 *    Requested -> Approved/Rejected. When an admin APPROVES a "Return"
 *    request in Admin -> Returns & Refunds, a refund is triggered
 *    AUTOMATICALLY via the Razorpay Refunds API against the original
 *    payment (see processAutomaticRefund) — no manual step in the
 *    Razorpay dashboard needed. "Exchange" approvals don't move money;
 *    the admin arranges the replacement shipment separately.
 *
 *    CallbackRequests | RequestId | Name | Email | Phone | OrderId
 *                 | QueryType | Message | PreferredTime | Status
 *                 | RequestedAt | ResolvedAt | AdminNote
 *
 *    Addresses    | AddressId | Email | Label | Name | Phone | Line1
 *                 | Line2 | City | State | Pincode | Lat | Lng
 *                 | IsDefault | CreatedAt | UpdatedAt
 *
 *    Campaigns    | Id | Name | Active | DiscountPercent | HeroImage
 *                 | HeroTitle | HeroSubtitle | StripText | CtaLink
 *                 | CreatedAt | UpdatedAt
 *
 *    NOTE ON CAMPAIGNS (Admin -> Banners & Offers): lets you switch the
 *    homepage banner + sitewide discount to match whatever's happening
 *    right now (Diwali, Monsoon Sale, a new launch, nothing at all) —
 *    no code changes, no redeploy. Only ONE campaign can be Active at a
 *    time; marking one Active automatically turns the rest off
 *    (handleUpsertCampaign does this). "DiscountPercent" (0-90) is
 *    applied EVERYWHERE prices are shown (product cards, product page,
 *    cart, checkout) and — critically — is recomputed from THIS sheet
 *    on the server when an order is actually charged
 *    (computeAuthoritativeAmount), never trusted from the browser, for
 *    the same reason the order amount itself isn't trusted from the
 *    browser (see SECURITY NOTE below). "HeroImage" is optional — paste
 *    a public image URL (e.g. from Google Drive, sharing set to
 *    "Anyone with the link") to replace the default hero design with
 *    your own banner graphic; leave it blank to keep the built-in
 *    design with your Hero Title/Subtitle text overlaid instead.
 *    "StripText" is the thin announcement bar at the very top of every
 *    page (e.g. "Flat 40% OFF — Diwali Sale, this week only"); leave it
 *    blank to hide that strip. If no campaign is Active at all, both
 *    the hero banner and the top strip are hidden automatically and
 *    every price shown is the plain, undiscounted price — the site
 *    never shows a sale that isn't actually live.
 *
 *    NOTE ON SAVED ADDRESSES (multi-address "deliver here" book): one
 *    signed-in customer (matched by Email) can save several delivery
 *    addresses — e.g. Home, Work, Mom's place — and pick one at
 *    checkout instead of retyping it every time. "Lat"/"Lng" are
 *    filled in automatically when the customer taps "Use my current
 *    location" on the address form (browser geolocation, reverse-
 *    geocoded client-side to a street address via OpenStreetMap's free
 *    Nominatim API — no Google Maps billing needed) — they're stored
 *    only as a reference point for that address, not used to restrict
 *    where someone can order from. "IsDefault" marks the one address
 *    that's pre-selected at checkout; only one row per Email may have
 *    IsDefault = TRUE at a time (handled automatically whenever an
 *    address is saved or set as default).
 *
 *    NOTE ON THE HELP DESK / CALLBACK REQUESTS: the storefront's chat
 *    widget (bottom-right "Need help?" bubble) lets a customer pick an
 *    order + describe their issue, then choose either "Chat on
 *    WhatsApp" (opens a prefilled wa.me link to the business number) or
 *    "Request a callback" (writes a row here). "Status" moves
 *    Pending -> Contacted -> Resolved (or Cancelled), managed from
 *    Admin -> Help Desk. A confirmation email goes to the customer (if
 *    they gave one) and a notification email goes to the store owner
 *    the moment a new request comes in, so nothing sits unnoticed.
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
const CODE_VERSION = "2026-08-02-helpdesk-v1";

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
      case "logError":
        return jsonResponse(handleLogError(payload));
      case "listErrors":
        return jsonResponse(handleListErrors());
      case "submitReturnRequest":
        return jsonResponse(handleSubmitReturnRequest(payload));
      case "getMyReturns":
        return jsonResponse(handleGetMyReturns(payload));
      case "listReturns":
        return jsonResponse(handleListReturns());
      case "reviewReturn":
        return jsonResponse(handleReviewReturn(payload));
      case "retryRefund":
        return jsonResponse(handleRetryRefund(payload));
      case "requestCallback":
        return jsonResponse(handleRequestCallback(payload));
      case "listCallbackRequests":
        return jsonResponse(handleListCallbackRequests());
      case "updateCallbackStatus":
        return jsonResponse(handleUpdateCallbackStatus(payload));
      case "saveAddress":
        return jsonResponse(handleSaveAddress(payload));
      case "getMyAddresses":
        return jsonResponse(handleGetMyAddresses(payload));
      case "deleteAddress":
        return jsonResponse(handleDeleteAddress(payload));
      case "setDefaultAddress":
        return jsonResponse(handleSetDefaultAddress(payload));
      case "getActiveCampaign":
        return jsonResponse(handleGetActiveCampaign());
      case "listCampaigns":
        return jsonResponse(handleListCampaigns());
      case "upsertCampaign":
        return jsonResponse(handleUpsertCampaign(payload));
      case "deleteCampaign":
        return jsonResponse(handleDeleteCampaign(payload));
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
    MailApp.sendEmail(order.email, subject, body, { name: "neobonn" });
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
    MailApp.sendEmail(order.email, subject, lines.join("\n"), { name: "neobonn" });
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

  MailApp.sendEmail(email, subject, body, { name: "neobonn" });
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

// Recomputes the order total from the *server's* Products sheet prices —
// never trusts the amount the browser sends, since that request can be
// edited (devtools, replayed/modified network calls) before it reaches
// us. This is the one source of truth for what Razorpay actually charges
// and what gets saved as the order's amount. Also applies whatever
// discount the currently-Active campaign says (see getActiveDiscountPercent)
// — again, from the sheet, never from the browser.
function computeAuthoritativeAmount(items) {
  const sheet = getSheet("Products");
  const rows = sheet.getDataRange().getValues();
  const colMap = getProductColumnMap(sheet);
  const idCol = colMap["Id"];
  const priceCol = colMap["Price"];
  let total = 0;
  for (const item of items) {
    const row = rows.find((r) => String(r[idCol]) === String(item.id));
    // Unknown product id shouldn't be billable at whatever price the
    // client claims — treat it as zero rather than trusting item.price.
    const price = row ? Number(row[priceCol]) || 0 : 0;
    total += price * Number(item.qty || 0);
  }
  const discountPercent = getActiveDiscountPercent();
  if (discountPercent > 0) total = total * (1 - discountPercent / 100);
  return Math.round(total * 100) / 100; // avoid floating-point cent dust
}

function handlePlaceOrder({ items, customer }) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    // ---- Stock check: refuse the order if anything in the cart has
    // sold out or doesn't have enough units left, so we never oversell.
    const stockError = checkStockAvailability(items);
    if (stockError) return { ok: false, message: stockError };

    // ---- Price check: always charge what the Products sheet actually
    // says, never whatever amount the browser happened to send.
    const amount = computeAuthoritativeAmount(items);
    if (amount <= 0) {
      return { ok: false, message: "Could not calculate order total. Please refresh and try again." };
    }

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

// ---------------- Campaigns (Admin -> Banners & Offers) ----------------
// Header-based column lookup, same pattern as Products (see
// getProductColumnMap above) — safe against reordered/extra columns.
const CAMPAIGN_COLUMNS = [
  "Id", "Name", "Active", "DiscountPercent", "HeroImage",
  "HeroTitle", "HeroSubtitle", "StripText", "CtaLink", "CreatedAt", "UpdatedAt",
];

function getCampaignColumnMap(sheet) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const wanted = {};
  CAMPAIGN_COLUMNS.forEach((col) => { wanted[normalizeHeaderText(col)] = col; });
  const map = {};
  header.forEach((h, i) => {
    const norm = normalizeHeaderText(h);
    if (norm && wanted[norm] && !(wanted[norm] in map)) map[wanted[norm]] = i;
  });
  CAMPAIGN_COLUMNS.forEach((col, i) => { if (!(col in map)) map[col] = i; });
  return map;
}

function rowToCampaignObject(row, colMap) {
  const val = (col) => row[colMap[col]];
  return {
    id: String(val("Id") || ""),
    name: val("Name") || "",
    active: val("Active") === true || val("Active") === "TRUE",
    discountPercent: Math.max(0, Math.min(90, Number(val("DiscountPercent")) || 0)),
    heroImage: val("HeroImage") || "",
    heroTitle: val("HeroTitle") || "",
    heroSubtitle: val("HeroSubtitle") || "",
    stripText: val("StripText") || "",
    ctaLink: val("CtaLink") || "/products",
    createdAt: val("CreatedAt") || "",
    updatedAt: val("UpdatedAt") || "",
  };
}

function campaignToRowArray(c, colMap, existingRow) {
  const row = existingRow ? existingRow.slice() : new Array(CAMPAIGN_COLUMNS.length).fill("");
  const set = (col, value) => { if (col in colMap) row[colMap[col]] = value; };
  set("Id", c.id);
  set("Name", c.name);
  set("Active", !!c.active);
  set("DiscountPercent", Math.max(0, Math.min(90, Number(c.discountPercent) || 0)));
  set("HeroImage", c.heroImage || "");
  set("HeroTitle", c.heroTitle || "");
  set("HeroSubtitle", c.heroSubtitle || "");
  set("StripText", c.stripText || "");
  set("CtaLink", c.ctaLink || "/products");
  if (!existingRow) set("CreatedAt", new Date());
  set("UpdatedAt", new Date());
  return row;
}

// Public (no login needed) — read by every storefront page to decide
// whether to show a hero banner / promo strip / discounted prices.
// Never throws: if the Campaigns tab doesn't exist yet (or isn't set
// up), the site should just behave as if no campaign is live, not break.
function handleGetActiveCampaign() {
  try {
    const sheet = getSheet("Campaigns");
    if (!sheet) return { ok: true, campaign: null };
    const rows = sheet.getDataRange().getValues();
    const colMap = getCampaignColumnMap(sheet);
    const activeCol = colMap["Active"];
    const active = rows.slice(1).find((r) => r[activeCol] === true || r[activeCol] === "TRUE");
    return { ok: true, campaign: active ? rowToCampaignObject(active, colMap) : null };
  } catch (err) {
    return { ok: true, campaign: null };
  }
}

// admin: every campaign (active or not), so the admin panel can list
// past/draft occasions and let you flip which one is live.
function handleListCampaigns() {
  const sheet = getSheet("Campaigns");
  if (!sheet) {
    return {
      ok: false,
      message:
        'The "Campaigns" sheet tab doesn\'t exist yet. Add it — see the ' +
        "setup comment at the top of Code.gs for the exact header row.",
    };
  }
  const rows = sheet.getDataRange().getValues();
  const colMap = getCampaignColumnMap(sheet);
  const campaigns = rows
    .slice(1)
    .filter((r) => r.some((cell) => cell !== ""))
    .map((r) => rowToCampaignObject(r, colMap))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  return { ok: true, campaigns };
}

// admin: create or update one campaign. Marking a campaign Active
// automatically deactivates every other campaign in the same call —
// only one can ever be "live" at once, so the storefront never has to
// guess which banner/discount to show.
function handleUpsertCampaign(c) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet("Campaigns");
    if (!sheet) return { ok: false, message: 'The "Campaigns" sheet tab doesn\'t exist yet.' };
    const rows = sheet.getDataRange().getValues();
    const colMap = getCampaignColumnMap(sheet);
    const idCol = colMap["Id"];
    const activeCol = colMap["Active"];

    const id = c.id && String(c.id).trim() ? String(c.id).trim() : "CAMP" + new Date().getTime();
    const rowIndex = rows.findIndex((r, i) => i > 0 && String(r[idCol]) === id);
    const rowData = campaignToRowArray(
      { ...c, id },
      colMap,
      rowIndex > -1 ? rows[rowIndex] : null
    );

    if (rowIndex === -1) {
      sheet.appendRow(rowData);
    } else {
      sheet.getRange(rowIndex + 1, 1, 1, rowData.length).setValues([rowData]);
    }

    // If this campaign is now Active, switch every other row off.
    if (c.active) {
      const freshRows = sheet.getDataRange().getValues();
      for (let i = 1; i < freshRows.length; i++) {
        if (String(freshRows[i][idCol]) !== id && (freshRows[i][activeCol] === true || freshRows[i][activeCol] === "TRUE")) {
          sheet.getRange(i + 1, activeCol + 1).setValue(false);
        }
      }
    }

    return handleListCampaigns();
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteCampaign({ id }) {
  const sheet = getSheet("Campaigns");
  if (!sheet) return { ok: false, message: 'The "Campaigns" sheet tab doesn\'t exist yet.' };
  const rows = sheet.getDataRange().getValues();
  const colMap = getCampaignColumnMap(sheet);
  const idCol = colMap["Id"];
  const rowIndex = rows.findIndex((r, i) => i > 0 && String(r[idCol]) === String(id));
  if (rowIndex > -1) sheet.deleteRow(rowIndex + 1);
  return handleListCampaigns();
}

// The single source of truth for "what discount is live right now" —
// used by computeAuthoritativeAmount so checkout always charges
// whatever the active campaign says, regardless of what the browser
// sends. Never throws (same reasoning as handleGetActiveCampaign).
function getActiveDiscountPercent() {
  const res = handleGetActiveCampaign();
  return res.campaign ? res.campaign.discountPercent : 0;
}

function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// ---------------- Error log (trial IDs) ----------------
// The storefront never shows a customer the raw error/stack — it shows
// a friendly "Oops" screen with a short trial ID and sends the real
// technical detail here in the background. See the Errors sheet columns
// documented at the top of this file, and src/lib/errorReporting.js on
// the frontend.

function handleLogError({ trialId, message, stack, context, url, userAgent, fatal }) {
  getSheet("Errors").appendRow([
    trialId || "",
    new Date(),
    message || "",
    stack || "",
    context || "",
    url || "",
    userAgent || "",
    !!fatal,
  ]);
  return { ok: true, trialId };
}

// admin: every logged error, newest first — lets you paste in a
// customer's trial ID and instantly see what actually happened.
function handleListErrors() {
  const sheet = getSheet("Errors");
  const rows = sheet.getDataRange().getValues();
  const errors = rows
    .slice(1)
    .filter((r) => r[0]) // skip blank rows
    .map((r) => ({
      trialId: r[0],
      timestamp: r[1],
      message: r[2],
      stack: r[3],
      context: r[4],
      url: r[5],
      userAgent: r[6],
      fatal: r[7],
    }))
    .reverse();
  return { ok: true, errors };
}

// ---------------- Returns & Exchanges (with automatic refunds) ----------------
// Flow: customer submits a request with photos + a video from their
// Account page (within 7 days of delivery) -> shows up in
// Admin -> Returns & Refunds -> admin reviews the media and clicks
// Approve/Reject -> if it's a "Return" and gets approved, a refund to
// the original payment method is triggered AUTOMATICALLY via the
// Razorpay Refunds API. No manual refund step in the Razorpay
// dashboard is needed.

const RETURN_WINDOW_DAYS = 7;

function getOrCreateReturnsFolder() {
  const name = "neobonn Returns & Exchanges";
  const existing = DriveApp.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return DriveApp.createFolder(name);
}

// file: { name, mimeType, base64 } -> Drive share-link URL.
// Requires the script to be authorized for Drive (see README) — the
// first deploy/run after adding this feature will prompt for that.
function uploadBase64FileToDrive(file, folder) {
  const bytes = Utilities.base64Decode(file.base64);
  const blob = Utilities.newBlob(bytes, file.mimeType || "application/octet-stream", file.name || "upload");
  const driveFile = folder.createFile(blob);
  driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return driveFile.getUrl();
}

function rowToReturnObject(r) {
  return {
    returnId: r[0],
    orderId: r[1],
    email: r[2],
    customerName: r[3],
    phone: r[4],
    type: r[5], // "Return" | "Exchange"
    items: safeParse(r[6], []),
    reason: r[7],
    imageLinks: safeParse(r[8], []),
    videoLink: r[9],
    status: r[10], // "Requested" | "Approved" | "Rejected"
    requestedAt: r[11],
    reviewedAt: r[12],
    adminNote: r[13],
    refundAmount: r[14],
    refundStatus: r[15], // "Not Applicable" | "Pending" | "Processed" | "Failed"
    razorpayRefundId: r[16],
  };
}

// Customer-facing: submit a return or exchange request. Requires the
// order to be Delivered, within the 7-day window, and at least one
// photo + one video attached as proof.
function handleSubmitReturnRequest({ orderId, email, phone, type, items, reason, images, video }) {
  if (!orderId || !email) return { ok: false, message: "Missing order or email." };
  if (type !== "Return" && type !== "Exchange") {
    return { ok: false, message: "Please choose Return or Exchange." };
  }
  if (!reason || !reason.trim()) return { ok: false, message: "Please tell us the reason." };
  if (!images || !images.length) {
    return { ok: false, message: "Please attach at least one photo of the product." };
  }
  if (!video) {
    return { ok: false, message: "Please attach a short video of the product as proof." };
  }

  const ordersSheet = getSheet("Orders");
  const orderRows = ordersSheet.getDataRange().getValues();
  const orderRow = orderRows.find(
    (r, i) => i > 0 && String(r[0]) === String(orderId) && String(r[3]).toLowerCase() === String(email).toLowerCase()
  );
  if (!orderRow) return { ok: false, message: "We couldn't find that order under this email." };
  const order = rowToOrderObject(orderRow);

  if (order.trackingStatus !== "Delivered") {
    return { ok: false, message: "Return/exchange can only be requested once the order has been delivered." };
  }
  const deliveredAt = order.stageTimestamps["Delivered"];
  const daysSinceDelivery = deliveredAt ? (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24) : Infinity;
  if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
    return { ok: false, message: `Sorry, the ${RETURN_WINDOW_DAYS}-day return/exchange window for this order has passed.` };
  }

  // One open request per order at a time.
  const returnsSheet = getSheet("Returns");
  const alreadyOpen = returnsSheet
    .getDataRange()
    .getValues()
    .slice(1)
    .some((r) => String(r[1]) === String(orderId) && r[10] === "Requested");
  if (alreadyOpen) {
    return { ok: false, message: "A return/exchange request is already pending for this order." };
  }

  const folder = getOrCreateReturnsFolder();
  const imageLinks = images.slice(0, 4).map((img) => uploadBase64FileToDrive(img, folder));
  const videoLink = uploadBase64FileToDrive(video, folder);

  const returnId = "RET" + new Date().getTime();
  const now = new Date();

  returnsSheet.appendRow([
    returnId,
    orderId,
    email,
    order.customerName,
    phone || order.phone,
    type,
    JSON.stringify(items && items.length ? items : order.items),
    reason,
    JSON.stringify(imageLinks),
    videoLink,
    "Requested",
    now, // RequestedAt
    "", // ReviewedAt
    "", // AdminNote
    "", // RefundAmount
    type === "Return" ? "Pending" : "Not Applicable", // RefundStatus
    "", // RazorpayRefundId
  ]);

  try {
    MailApp.sendEmail(
      email,
      `We've received your ${type.toLowerCase()} request — ${returnId} | neobonn`,
      `Hi ${order.customerName || "there"},\n\n` +
        `We've received your ${type.toLowerCase()} request for order ${orderId}.\n\n` +
        `Request ID: ${returnId}\nReason: ${reason}\n\n` +
        `Our team will review the photos/video you submitted and get back to you shortly.\n\n` +
        `— Team neobonn`,
      { name: "neobonn" }
    );
  } catch (err) {
    console.error("Return request confirmation email failed: " + err.message);
  }

  // Notify the store owner (the Google account this script is deployed
  // under) so new requests don't sit unnoticed.
  try {
    MailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      `New ${type.toLowerCase()} request — ${returnId}`,
      `Order: ${orderId}\nCustomer: ${order.customerName} (${email})\nReason: ${reason}\n\n` +
        `Review the photos/video and approve or reject it from Admin -> Returns & Refunds.`
    );
  } catch (err) {
    console.error("Return request admin-notify email failed: " + err.message);
  }

  return { ok: true, returnId };
}

// Customer-facing: their own return/exchange history.
function handleGetMyReturns({ email }) {
  const rows = getSheet("Returns").getDataRange().getValues();
  const returns = rows
    .slice(1)
    .filter((r) => r[0] && String(r[2]).toLowerCase() === String(email).toLowerCase())
    .map(rowToReturnObject)
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  return { ok: true, returns };
}

// admin: every return/exchange request, newest first.
function handleListReturns() {
  const rows = getSheet("Returns").getDataRange().getValues();
  const returns = rows
    .slice(1)
    .filter((r) => r[0])
    .map(rowToReturnObject)
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  return { ok: true, returns };
}

// Refunds the value of the returned items (or the full order amount if
// items weren't itemized) straight to the customer's original payment
// method via the Razorpay Refunds API. This is what makes refunds
// "automatic" — no manual step in the Razorpay dashboard.
function processAutomaticRefund(orderId, items) {
  try {
    const ordersSheet = getSheet("Orders");
    const orderRow = ordersSheet
      .getDataRange()
      .getValues()
      .find((r, i) => i > 0 && String(r[0]) === String(orderId));
    if (!orderRow) return { ok: false, message: "Original order not found — refund not processed." };

    const paymentId = orderRow[11]; // RazorpayPaymentId column
    if (!paymentId) return { ok: false, message: "No payment ID on this order — was it actually paid?" };

    const props = PropertiesService.getScriptProperties();
    const keyId = props.getProperty("RAZORPAY_KEY_ID");
    const keySecret = props.getProperty("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return { ok: false, message: "Razorpay is not configured (RAZORPAY_KEY_ID/SECRET missing in Script Properties)." };
    }

    const itemsTotal = (items || []).reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0),
      0
    );
    const amount = itemsTotal > 0 ? itemsTotal : Number(orderRow[8]); // fallback: full order amount

    const res = UrlFetchApp.fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Basic " + Utilities.base64Encode(keyId + ":" + keySecret) },
      payload: JSON.stringify({ amount: Math.round(amount * 100) }), // paise
      muteHttpExceptions: true,
    });
    const refund = JSON.parse(res.getContentText());

    if (!refund.id) {
      const reason = (refund.error && refund.error.description) || "Unknown error from Razorpay.";
      return { ok: false, message: "Refund failed: " + reason, amount };
    }
    return { ok: true, refundId: refund.id, amount };
  } catch (err) {
    return { ok: false, message: "Refund failed: " + err.message };
  }
}

function sendReturnDecisionEmail(r) {
  try {
    if (!r || !r.email) return;
    const isApproved = r.status === "Approved";
    const subject = `Your ${r.type.toLowerCase()} request ${isApproved ? "was approved" : "was declined"} — ${r.returnId} | neobonn`;
    const lines = [
      `Hi ${r.customerName || "there"},`,
      "",
      `Your ${r.type.toLowerCase()} request (${r.returnId}) for order ${r.orderId} has been ${isApproved ? "approved" : "declined"}.`,
    ];
    if (r.adminNote) lines.push("", `Note from our team: ${r.adminNote}`);
    if (isApproved && r.type === "Return") {
      lines.push(
        "",
        r.refundStatus === "Processed"
          ? `A refund of ₹${r.refundAmount} has been initiated to your original payment method and should reflect in 5-7 business days.`
          : `We're processing your refund — you'll receive a confirmation once it's initiated.`
      );
    }
    if (isApproved && r.type === "Exchange") {
      lines.push("", "We'll be in touch shortly with details of your replacement shipment.");
    }
    lines.push("", "— Team neobonn");
    MailApp.sendEmail(r.email, subject, lines.join("\n"), { name: "neobonn" });
  } catch (err) {
    console.error("sendReturnDecisionEmail failed: " + err.message);
  }
}

// admin: approve or reject a request. Approving a "Return" AUTOMATICALLY
// triggers the Razorpay refund above — that's the whole point of this
// handler. Idempotent: a request already Approved/Rejected can't be
// reviewed again (prevents a double-refund from a retried click).
function handleReviewReturn({ returnId, decision, adminNote }) {
  if (decision !== "approved" && decision !== "rejected") {
    return { ok: false, message: "Invalid decision." };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let refundOutcome = null;
  let earlyExit = null;
  try {
    const sheet = getSheet("Returns");
    const rows = sheet.getDataRange().getValues();
    const rowIndex = rows.findIndex((r, i) => i > 0 && String(r[0]) === String(returnId));
    if (rowIndex === -1) {
      earlyExit = { ok: false, message: "Return request not found." };
      return;
    }
    const row = rows[rowIndex];
    if (row[10] !== "Requested") {
      earlyExit = { ok: false, message: `This request was already ${String(row[10]).toLowerCase()}.` };
      return;
    }

    const now = new Date();
    const type = row[5];
    const orderId = row[1];

    if (decision === "rejected") {
      sheet.getRange(rowIndex + 1, 11).setValue("Rejected"); // Status
      sheet.getRange(rowIndex + 1, 13).setValue(now); // ReviewedAt
      sheet.getRange(rowIndex + 1, 14).setValue(adminNote || ""); // AdminNote
      sheet.getRange(rowIndex + 1, 16).setValue("Not Applicable"); // RefundStatus
    } else {
      sheet.getRange(rowIndex + 1, 11).setValue("Approved");
      sheet.getRange(rowIndex + 1, 13).setValue(now);
      sheet.getRange(rowIndex + 1, 14).setValue(adminNote || "");

      if (type === "Return") {
        refundOutcome = processAutomaticRefund(orderId, safeParse(row[6], []));
        sheet.getRange(rowIndex + 1, 15).setValue(refundOutcome.amount || ""); // RefundAmount
        sheet.getRange(rowIndex + 1, 16).setValue(refundOutcome.ok ? "Processed" : "Failed"); // RefundStatus
        sheet.getRange(rowIndex + 1, 17).setValue(refundOutcome.refundId || ""); // RazorpayRefundId
      } else {
        sheet.getRange(rowIndex + 1, 16).setValue("Not Applicable");
      }
    }
  } finally {
    lock.releaseLock();
  }

  if (earlyExit) return earlyExit;

  const updatedRow = getSheet("Returns")
    .getDataRange()
    .getValues()
    .find((r) => String(r[0]) === String(returnId));
  const returnRequest = updatedRow ? rowToReturnObject(updatedRow) : null;
  if (returnRequest) sendReturnDecisionEmail(returnRequest);

  return {
    ok: true,
    returnRequest,
    refundError: refundOutcome && !refundOutcome.ok ? refundOutcome.message : undefined,
  };
}

// admin: manually retry a refund that failed the first time (e.g. a
// transient Razorpay API error) without re-reviewing the whole request.
function handleRetryRefund({ returnId }) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet("Returns");
    const rows = sheet.getDataRange().getValues();
    const rowIndex = rows.findIndex((r, i) => i > 0 && String(r[0]) === String(returnId));
    if (rowIndex === -1) return { ok: false, message: "Return request not found." };
    const row = rows[rowIndex];
    if (row[5] !== "Return") return { ok: false, message: "Only Return requests have refunds." };
    if (row[10] !== "Approved") return { ok: false, message: "This request must be approved first." };
    if (row[15] === "Processed") return { ok: false, message: "This refund was already processed." };

    const refundOutcome = processAutomaticRefund(row[1], safeParse(row[6], []));
    sheet.getRange(rowIndex + 1, 15).setValue(refundOutcome.amount || "");
    sheet.getRange(rowIndex + 1, 16).setValue(refundOutcome.ok ? "Processed" : "Failed");
    sheet.getRange(rowIndex + 1, 17).setValue(refundOutcome.refundId || "");

    return { ok: refundOutcome.ok, refund: refundOutcome, message: refundOutcome.ok ? undefined : refundOutcome.message };
  } finally {
    lock.releaseLock();
  }
}

// ---------------- Help Desk / callback requests ----------------
// Powers the storefront's "Need help?" chat widget: customer picks an
// order + a query type, then either opens a prefilled WhatsApp chat to
// the business number, or asks for a callback (which lands here).

const HELPDESK_WHATSAPP_NUMBER = "919310035064"; // company WhatsApp Business number, with country code

function rowToCallbackObject(r) {
  return {
    requestId: r[0],
    name: r[1],
    email: r[2],
    phone: r[3],
    orderId: r[4],
    queryType: r[5],
    message: r[6],
    preferredTime: r[7],
    status: r[8] || "Pending",
    requestedAt: r[9],
    resolvedAt: r[10],
    adminNote: r[11],
  };
}

// Customer-facing: submitted from the help desk widget's "Request a
// callback" step.
function handleRequestCallback({ name, phone, email, orderId, queryType, message, preferredTime }) {
  if (!phone || !phone.trim()) return { ok: false, message: "Please share a phone number so we can call you back." };
  if (!queryType) return { ok: false, message: "Please tell us what this is about." };

  const sheet = getSheet("CallbackRequests");
  const requestId = "CB" + new Date().getTime();
  const now = new Date();

  sheet.appendRow([
    requestId,
    name || "",
    email || "",
    phone.trim(),
    orderId || "",
    queryType,
    message || "",
    preferredTime || "",
    "Pending",
    now,
    "", // ResolvedAt
    "", // AdminNote
  ]);

  // Confirmation to the customer (best-effort — only if they gave an email).
  if (email) {
    try {
      MailApp.sendEmail(
        email,
        `We've got your request — ${requestId} | neobonn`,
        `Hi ${name || "there"},\n\n` +
          `Thanks for reaching out! Our support team will call you back shortly on ${phone}.\n\n` +
          `Request ID: ${requestId}\n` +
          `About: ${queryType}${orderId ? ` (Order ${orderId})` : ""}\n` +
          (message ? `Your message: ${message}\n\n` : "\n") +
          `— Team neobonn`,
        { name: "neobonn" }
      );
    } catch (err) {
      console.error("Callback confirmation email failed: " + err.message);
    }
  }

  // Notify the store owner so new requests don't sit unnoticed.
  try {
    MailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      `New help desk request — ${requestId}`,
      `Name: ${name || "(not given)"}\nPhone: ${phone}\nEmail: ${email || "(not given)"}\n` +
        `Order: ${orderId || "(none specified)"}\nAbout: ${queryType}\n` +
        (message ? `Message: ${message}\n\n` : "\n") +
        `Reply from Admin -> Help Desk, or call/WhatsApp them directly.`
    );
  } catch (err) {
    console.error("Callback admin-notify email failed: " + err.message);
  }

  return { ok: true, requestId, whatsappNumber: HELPDESK_WHATSAPP_NUMBER };
}

// admin: every help desk request, newest first.
function handleListCallbackRequests() {
  const rows = getSheet("CallbackRequests").getDataRange().getValues();
  const requests = rows
    .slice(1)
    .filter((r) => r[0])
    .map(rowToCallbackObject)
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  return { ok: true, requests, whatsappNumber: HELPDESK_WHATSAPP_NUMBER };
}

// admin: move a request through Pending -> Contacted -> Resolved (or
// Cancelled), with an optional internal note.
function handleUpdateCallbackStatus({ requestId, status, adminNote }) {
  const VALID_STATUSES = ["Pending", "Contacted", "Resolved", "Cancelled"];
  if (!requestId || !status) return { ok: false, message: "requestId and status are required." };
  if (VALID_STATUSES.indexOf(status) === -1) return { ok: false, message: "Unknown status: " + status };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet("CallbackRequests");
    const rows = sheet.getDataRange().getValues();
    const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === requestId);
    if (rowIndex === -1) return { ok: false, message: "Request not found." };

    sheet.getRange(rowIndex + 1, 9).setValue(status); // Status
    if (status === "Resolved" || status === "Cancelled") {
      sheet.getRange(rowIndex + 1, 11).setValue(new Date()); // ResolvedAt
    }
    if (adminNote !== undefined) sheet.getRange(rowIndex + 1, 12).setValue(adminNote); // AdminNote

    const updated = rowToCallbackObject(sheet.getRange(rowIndex + 1, 1, 1, 12).getValues()[0]);
    return { ok: true, request: updated };
  } finally {
    lock.releaseLock();
  }
}

// ---------------- Saved Addresses (multi-address delivery book) ----------------
// One signed-in customer (matched by Email) can save several delivery
// addresses and pick one at checkout instead of retyping it every
// time. Lat/Lng come from the browser's geolocation + free reverse-
// geocoding on the frontend (see src/lib/geolocation.js) when the
// customer taps "Use my current location" — they're just a reference
// point stored alongside the typed-out address, nothing more.

const ADDRESS_COLUMNS = [
  "AddressId", "Email", "Label", "Name", "Phone", "Line1", "Line2",
  "City", "State", "Pincode", "Lat", "Lng", "IsDefault", "CreatedAt", "UpdatedAt",
];

function rowToAddressObject(r) {
  return {
    addressId: r[0],
    email: r[1],
    label: r[2],
    name: r[3],
    phone: r[4],
    line1: r[5],
    line2: r[6],
    city: r[7],
    state: r[8],
    pincode: r[9],
    lat: r[10] === "" ? null : Number(r[10]),
    lng: r[11] === "" ? null : Number(r[11]),
    isDefault: r[12] === true || r[12] === "TRUE",
    createdAt: r[13],
    updatedAt: r[14],
  };
}

function addressToRowArray(a) {
  return [
    a.addressId,
    a.email,
    a.label || "Home",
    a.name || "",
    a.phone || "",
    a.line1 || "",
    a.line2 || "",
    a.city || "",
    a.state || "",
    a.pincode || "",
    a.lat === null || a.lat === undefined ? "" : a.lat,
    a.lng === null || a.lng === undefined ? "" : a.lng,
    !!a.isDefault,
    a.createdAt,
    a.updatedAt,
  ];
}

// Creates a new saved address, or updates an existing one (when
// payload.addressId is given and belongs to that email). If the
// address is marked default — or it's the customer's very first saved
// address — every other address for that same email is un-defaulted
// so exactly one row stays the default at any time.
function handleSaveAddress(payload) {
  const { addressId, email, label, name, phone, line1, city, pincode } = payload || {};
  if (!email) return { ok: false, message: "Please sign in to save an address." };
  if (!name || !phone || !line1 || !city || !pincode) {
    return { ok: false, message: "Name, phone, address line, city and pincode are required." };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet("Addresses");
    const rows = sheet.getDataRange().getValues();
    const emailRows = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r, i }) => i > 0 && String(r[1]).toLowerCase() === String(email).toLowerCase());

    const isFirstAddress = emailRows.length === 0;
    const wantsDefault = !!payload.isDefault || isFirstAddress;
    const now = new Date();

    let targetRowIndex = -1;
    if (addressId) {
      targetRowIndex = emailRows.findIndex(({ r }) => String(r[0]) === String(addressId));
    }

    // Un-default every other address for this customer first, if this
    // one is becoming the default.
    if (wantsDefault) {
      emailRows.forEach(({ i }) => {
        if (rows[i][0] !== addressId) sheet.getRange(i + 1, 13).setValue(false); // IsDefault column
      });
    }

    if (addressId && targetRowIndex !== -1) {
      // Update in place — keep original AddressId/CreatedAt.
      const existing = rows[emailRows[targetRowIndex].i];
      const updated = {
        addressId: existing[0],
        email,
        label: label || existing[2],
        name,
        phone,
        line1,
        line2: payload.line2 !== undefined ? payload.line2 : existing[6],
        city,
        state: payload.state !== undefined ? payload.state : existing[8],
        pincode,
        lat: payload.lat !== undefined ? payload.lat : existing[10],
        lng: payload.lng !== undefined ? payload.lng : existing[11],
        isDefault: wantsDefault,
        createdAt: existing[13],
        updatedAt: now,
      };
      sheet.getRange(emailRows[targetRowIndex].i + 1, 1, 1, ADDRESS_COLUMNS.length).setValues([addressToRowArray(updated)]);
      return { ok: true, address: rowToAddressObject(addressToRowArray(updated)) };
    }

    // Otherwise, create a brand-new saved address.
    const newAddress = {
      addressId: "ADDR" + now.getTime(),
      email,
      label: label || "Home",
      name,
      phone,
      line1,
      line2: payload.line2 || "",
      city,
      state: payload.state || "",
      pincode,
      lat: payload.lat ?? "",
      lng: payload.lng ?? "",
      isDefault: wantsDefault,
      createdAt: now,
      updatedAt: now,
    };
    sheet.appendRow(addressToRowArray(newAddress));
    return { ok: true, address: rowToAddressObject(addressToRowArray(newAddress)) };
  } finally {
    lock.releaseLock();
  }
}

// Every saved address for one customer, most-recently-updated first,
// with the default address (if any) pinned to the top.
function handleGetMyAddresses({ email }) {
  if (!email) return { ok: false, message: "Email is required." };
  const rows = getSheet("Addresses").getDataRange().getValues();
  const addresses = rows
    .slice(1)
    .filter((r) => r[0] && String(r[1]).toLowerCase() === String(email).toLowerCase())
    .map(rowToAddressObject)
    .sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  return { ok: true, addresses };
}

// Deletes one saved address. Requires the owning email as a basic
// ownership check (this is a public web app endpoint, so we don't
// trust addressId alone). If the deleted address was the default and
// other addresses remain, the most recently updated one is promoted
// to default so checkout always has a sensible pre-selection.
function handleDeleteAddress({ addressId, email }) {
  if (!addressId || !email) return { ok: false, message: "addressId and email are required." };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet("Addresses");
    const rows = sheet.getDataRange().getValues();
    const rowIndex = rows.findIndex(
      (r, i) => i > 0 && String(r[0]) === String(addressId) && String(r[1]).toLowerCase() === String(email).toLowerCase()
    );
    if (rowIndex === -1) return { ok: false, message: "Address not found." };

    const wasDefault = rows[rowIndex][12] === true || rows[rowIndex][12] === "TRUE";
    sheet.deleteRow(rowIndex + 1);

    if (wasDefault) {
      const remaining = sheet
        .getDataRange()
        .getValues()
        .map((r, i) => ({ r, i }))
        .filter(({ r, i }) => i > 0 && String(r[1]).toLowerCase() === String(email).toLowerCase())
        .sort((a, b) => new Date(b.r[14]) - new Date(a.r[14]));
      if (remaining.length) sheet.getRange(remaining[0].i + 1, 13).setValue(true);
    }

    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// Marks one address as the default for a customer and un-defaults
// every other address they have saved.
function handleSetDefaultAddress({ addressId, email }) {
  if (!addressId || !email) return { ok: false, message: "addressId and email are required." };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet("Addresses");
    const rows = sheet.getDataRange().getValues();
    let found = false;
    rows.forEach((r, i) => {
      if (i === 0) return;
      if (String(r[1]).toLowerCase() !== String(email).toLowerCase()) return;
      const isTarget = String(r[0]) === String(addressId);
      if (isTarget) found = true;
      sheet.getRange(i + 1, 13).setValue(isTarget);
      if (isTarget) sheet.getRange(i + 1, 15).setValue(new Date()); // UpdatedAt
    });
    if (!found) return { ok: false, message: "Address not found." };
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}
