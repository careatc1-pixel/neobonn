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
      case "enquiry":
        return jsonResponse(handleEnquiry(payload));
      case "placeOrder":
        return jsonResponse(handlePlaceOrder(payload));
      case "verifyPayment":
        return jsonResponse(handleVerifyPayment(payload));
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
