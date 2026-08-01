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

import { reportError } from "./errorReporting";

const API_URL = import.meta.env.VITE_SHEETS_API_URL || "";

// Customer-facing message only — never the technical detail. The real
// detail is logged under the returned trial ID (see errorReporting.js)
// for lookup later in Admin -> Error Logs.
function friendlyNetworkError(technicalMessage, action) {
  // "logError" itself must never recurse into more error reporting.
  const trialId =
    action === "logError" ? null : reportError({ message: technicalMessage, context: `Sheets API: ${action}` });
  const err = new Error(
    trialId
      ? `Something went wrong on our end. Please try again — if it keeps happening, share this reference ID with support: ${trialId}`
      : "Something went wrong on our end. Please try again in a moment."
  );
  err.trialId = trialId;
  return err;
}

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
    // Full detail goes to the error log; the customer only sees a
    // friendly message + trial ID.
    throw friendlyNetworkError(
      `Could not reach the order backend for "${action}" (network error: ${err.message}).`,
      action
    );
  }

  if (!res.ok) {
    // The real diagnostic detail (status, URL, response snippet) is
    // logged under a trial ID rather than shown on screen — it's a
    // developer-facing clue, not something a customer needs to see.
    let bodySnippet = "";
    try {
      bodySnippet = (await res.text()).replace(/\s+/g, " ").trim().slice(0, 200);
    } catch {
      // ignore — body may not be readable
    }
    throw friendlyNetworkError(
      `Sheets API error: ${res.status} ${res.statusText} while calling "${action}". ` +
        `URL used: ${API_URL}.` +
        (bodySnippet ? ` Server said: "${bodySnippet}"` : ""),
      action
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

  // ---- Error log (trial IDs shown to customers on the Oops screen) ----
  // Fire-and-forget from errorReporting.js — must never throw back into
  // the caller, since a logging failure shouldn't cause a second error.
  logError: async (entry) => {
    if (!API_URL) return { ok: false, demo: true };
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "logError", payload: entry }),
      });
      return res.ok ? res.json() : { ok: false };
    } catch {
      return { ok: false };
    }
  },
  // admin: every logged error, newest first — used by Admin -> Error Logs
  // to look up what a customer's trial ID actually means.
  listErrors: () => callSheetsApi("listErrors"),

  // ---- Products sheet (admin panel reads/writes here) ----
  listProducts: () => callSheetsApi("listProducts"),
  upsertProduct: (product) => callSheetsApi("upsertProduct", product),
  deleteProduct: (id) => callSheetsApi("deleteProduct", { id }),
  updateStock: (id, stock) => callSheetsApi("updateStock", { id, stock }), // inventory manager
  bulkUpsertProducts: (products) => callSheetsApi("bulkUpsertProducts", { products }), // CSV import
};
