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

  const res = await fetch(API_URL, {
    method: "POST",
    // Apps Script Web Apps require text/plain to avoid CORS preflight
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) throw new Error(`Sheets API error: ${res.status}`);
  return res.json();
}

export const SheetsAPI = {
  // ---- Auth / Users sheet ----
  signup: (data) => callSheetsApi("signup", data), // {name, email, phone, password}
  login: (data) => callSheetsApi("login", data), // {email, password}
  sendOtp: (email, purpose) => callSheetsApi("sendOtp", { email, purpose }), // purpose: "login" | "reset"
  verifyOtpLogin: (email, otp) => callSheetsApi("verifyOtpLogin", { email, otp }),
  resetPasswordWithOtp: (data) => callSheetsApi("resetPasswordWithOtp", data), // {email, otp, newPassword}

  // ---- Enquiries sheet ----
  submitEnquiry: (data) => callSheetsApi("enquiry", data), // {name, email, phone, message}

  // ---- Orders sheet ----
  placeOrder: (data) => callSheetsApi("placeOrder", data), // {items, customer, amount, ...}
  verifyPayment: (data) => callSheetsApi("verifyPayment", data), // {orderId, razorpay_payment_id, razorpay_signature}
  getMyOrders: (email) => callSheetsApi("getMyOrders", { email }), // customer order history

  // ---- Products sheet (admin panel reads/writes here) ----
  listProducts: () => callSheetsApi("listProducts"),
  upsertProduct: (product) => callSheetsApi("upsertProduct", product),
  deleteProduct: (id) => callSheetsApi("deleteProduct", { id }),
  updateStock: (id, stock) => callSheetsApi("updateStock", { id, stock }), // inventory manager
  bulkUpsertProducts: (products) => callSheetsApi("bulkUpsertProducts", { products }), // CSV import
};
