// -----------------------------------------------------------------------
// Central place for turning a raw JS/network error into:
//   1. a short "trial ID" the CUSTOMER sees on screen (never the real
//      error text/stack — that would be confusing and looks broken)
//   2. a full technical log entry (message, stack, page, browser)
//      keyed by that same trial ID, sent to the Google Sheets backend
//      so the developer can look it up later in Admin -> Error Logs.
//
// If a user reports "I got error NB-8K2F41", search that ID in
// Admin -> Error Logs to see exactly what happened.
// -----------------------------------------------------------------------

const LOCAL_LOG_KEY = "neobonn_error_log_local";
const LOCAL_LOG_MAX = 30;

// Short, easy to read aloud/type: NB-XXXXXX (6 base36 chars, uppercase).
export function generateTrialId() {
  const stamp = Date.now().toString(36).slice(-4);
  const rand = Math.random().toString(36).slice(2, 6);
  return `NB-${(stamp + rand).toUpperCase()}`;
}

function saveLocalCopy(entry) {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_LOG_KEY) || "[]");
    existing.unshift(entry);
    localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(existing.slice(0, LOCAL_LOG_MAX)));
  } catch {
    // localStorage unavailable/full — nothing more we can do locally
  }
}

// Fire-and-forget: builds a trial ID immediately (so the UI never has to
// wait on the network to show it), logs the real detail to the console
// for local dev, keeps a small local backup copy, and best-effort ships
// it to the Sheets backend. Never throws — reporting a failure must
// never cause a second failure.
export function reportError({ message, stack, context, fatal = false }) {
  const trialId = generateTrialId();
  const entry = {
    trialId,
    message: String(message || "Unknown error").slice(0, 2000),
    stack: String(stack || "").slice(0, 4000),
    context: context || "",
    url: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    fatal,
    timestamp: new Date().toISOString(),
  };

  console.error(`[neobonn] Trial ID ${trialId} —`, message, stack || "");
  saveLocalCopy(entry);

  // Best-effort backend log — imported lazily to avoid a circular import
  // with sheets.js (which itself calls reportError on network failures).
  import("./sheets.js")
    .then(({ SheetsAPI }) => SheetsAPI.logError(entry))
    .catch(() => {
      // Backend unreachable too (e.g. we're offline) — the local copy
      // above is the fallback; nothing else to do here.
    });

  return trialId;
}

export function getLocalErrorLog() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}
