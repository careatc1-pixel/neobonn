// -----------------------------------------------------------------------
// Talks to the Google Apps Script "Web App" deployed from
// /google-apps-script/Code.gs — that script reads/writes a Google Sheet
// which acts as our free database (Users, Orders, Enquiries, Products).
//
// Setup:
// 1. Open your Google Sheet, Extensions > Apps Script.
// 2. Paste Code.gs contents, deploy as Web App (execute as "Me",
//    access "Anyone").
// 3. Copy the deployment URL into VITE_SHEETS_API_URL in your .env file.
// -----------------------------------------------------------------------

const API_URL = import.meta.env.VITE_SHEETS_API_URL || "";

async function callSheetsApi(action, payload = {}) {
  if (!API_URL) {
    console.warn(
      `[sheets] VITE_SHEETS_API_URL not set — "${action}" call skipped (demo mode).`
    );
    return { ok: false, demo: true };
  }

  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      // Apps Script Web Apps require text/plain to avoid CORS preflight
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, payload }),
    });
  } catch (err) {
    // Network-level failure (DNS, CORS block, offline, wrong domain) —
    // never even reached the server, so there's no status code at all.
    throw new Error(
      `Could not reach the order backend for "${action}" (network error: ${err.message}). ` +
        `Check that VITE_SHEETS_API_URL is set correctly and the Apps Script deployment is live.`
    );
  }

  if (!res.ok) {
    // Include a snippet of the actual response body — this is usually
    // the single most useful clue (e.g. Google's own "Page not found"
    // HTML for a bad/expired deployment URL, vs. a real error from our
    // Code.gs). Shown right in the on-screen error, no DevTools needed.
    let bodySnippet = "";
    try {
      bodySnippet = (await res.text()).replace(/\s+/g, " ").trim().slice(0, 200);
    } catch {
      // ignore — body may not be readable
    }
    throw new Error(
      `Sheets API error: ${res.status} ${res.statusText} while calling "${action}". ` +
        `URL used: ${API_URL} — ` +
        `this usually means VITE_SHEETS_API_URL points to an old/invalid Apps Script deployment, ` +
        `or the env var wasn't applied to this build.` +
        (bodySnippet ? ` Server said: "${bodySnippet}"` : "")
    );
  }
  return res.json();
}

export const SheetsAPI = {
  // ---- Auth / Users sheet ----
  signup: (data) => callSheetsApi("signup", data), // {name, email, phone, password}
  login: (data) => callSheetsApi("login", data), // {email, password}
  sendOtp: (email, purpose) => callSheetsApi("sendOtp", { email, purpose }), // purpose: "login" | "reset"
  verifyOtpLogin: (email, otp) => callSheetsApi("verifyOtpLogin", { email, otp }),
  resetPasswordWithOtp: (data) => callSheetsApi("resetPasswordWithOtp", data), // {email, otp, newPassword}
  loginWithGoogle: (credential) => callSheetsApi("googleLogin", { credential }), // credential = Google ID token (JWT)

  // ---- Enquiries sheet ----
  submitEnquiry: (data) => callSheetsApi("enquiry", data), // {name, email, phone, message}

  // ---- Orders sheet ----
  placeOrder: (data) => callSheetsApi("placeOrder", data), // {items, customer, amount, ...}
  verifyPayment: (data) => callSheetsApi("verifyPayment", data), // {orderId, razorpay_payment_id, razorpay_signature}
  getMyOrders: (email) => callSheetsApi("getMyOrders", { email }), // customer order history

  // ---- Shipment tracking ----
  trackOrder: (data) => callSheetsApi("trackOrder", data), // {orderId, email} -> public lookup, no login needed
  listAllOrders: () => callSheetsApi("listAllOrders"), // admin: every order, newest first
  updateOrderStatus: (data) => callSheetsApi("updateOrderStatus", data), // admin: {orderId, status, note?, carrier?, trackingNumber?}

  // ---- Products sheet (admin panel reads/writes here) ----
  listProducts: () => callSheetsApi("listProducts"),
  upsertProduct: (product) => callSheetsApi("upsertProduct", product),
  deleteProduct: (id) => callSheetsApi("deleteProduct", { id }),
  updateStock: (id, stock) => callSheetsApi("updateStock", { id, stock }), // inventory manager
  bulkUpsertProducts: (products) => callSheetsApi("bulkUpsertProducts", { products }), // CSV import
};
