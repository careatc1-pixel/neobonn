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
 *    Products     | Id | Name | Tagline | Category | Price | ComingSoon
 *                 | Image | ShortDescription | Description
 *                 | Ingredients(JSON) | Specifications(JSON)
 *
 * 2. Extensions > Apps Script, paste this file's contents as Code.gs.
 * 3. Project Settings > Script Properties, add:
 *      RAZORPAY_KEY_ID       = rzp_live_xxxxx (or rzp_test_xxxxx)
 *      RAZORPAY_KEY_SECRET   = your_secret_key
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

function getSheet(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
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
      case "listProducts":
        return jsonResponse(handleListProducts());
      case "upsertProduct":
        return jsonResponse(handleUpsertProduct(payload));
      case "deleteProduct":
        return jsonResponse(handleDeleteProduct(payload));
      default:
        return jsonResponse({ ok: false, message: "Unknown action" });
    }
  } catch (err) {
    return jsonResponse({ ok: false, message: err.message });
  }
}

// ---------------- Users ----------------

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
    new Date(),
  ]);

  return { ok: true, orderId, razorpayOrderId: rzpOrder.id, razorpayKeyId: keyId };
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

  // Mark order as Paid in the sheet
  const sheet = getSheet("Orders");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === orderId) {
      sheet.getRange(i + 1, 10).setValue("Paid"); // Status column
      sheet.getRange(i + 1, 12).setValue(razorpay_payment_id); // RazorpayPaymentId column
      break;
    }
  }

  return { ok: true };
}

function handleGetMyOrders({ email }) {
  const sheet = getSheet("Orders");
  const rows = sheet.getDataRange().getValues();
  const [, ...data] = rows;
  const orders = data
    .filter((r) => r[0] && r[3] === email) // column D = Email
    .map((r) => ({
      orderId: r[0],
      items: safeParse(r[1], []),
      customerName: r[2],
      email: r[3],
      phone: r[4],
      address: r[5],
      city: r[6],
      pincode: r[7],
      amount: r[8],
      status: r[9],
      createdAt: r[12],
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return { ok: true, orders };
}

// ---------------- Products (Admin Panel) ----------------

function handleListProducts() {
  const sheet = getSheet("Products");
  const rows = sheet.getDataRange().getValues();
  const [, ...data] = rows;
  const products = data
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0], name: r[1], tagline: r[2], category: r[3], price: r[4] || null,
      comingSoon: r[5] === true || r[5] === "TRUE", image: r[6],
      shortDescription: r[7], description: r[8],
      ingredients: safeParse(r[9], []), specifications: safeParse(r[10], {}),
    }));
  return { ok: true, products };
}

function handleUpsertProduct(p) {
  const sheet = getSheet("Products");
  const rows = sheet.getDataRange().getValues();
  const rowIndex = rows.findIndex((r) => r[0] === p.id);
  const rowData = [
    p.id, p.name, p.tagline, p.category, p.price, p.comingSoon, p.image,
    p.shortDescription, p.description, JSON.stringify(p.ingredients || []),
    JSON.stringify(p.specifications || {}),
  ];
  if (rowIndex === -1) {
    sheet.appendRow(rowData);
  } else {
    sheet.getRange(rowIndex + 1, 1, 1, rowData.length).setValues([rowData]);
  }
  return handleListProducts();
}

function handleDeleteProduct({ id }) {
  const sheet = getSheet("Products");
  const rows = sheet.getDataRange().getValues();
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex > -1) sheet.deleteRow(rowIndex + 1);
  return handleListProducts();
}

function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
