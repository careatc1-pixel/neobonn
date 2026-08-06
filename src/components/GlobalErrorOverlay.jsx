import { useEffect, useState } from "react";
import OopsScreen from "./OopsScreen";
import { reportError } from "../lib/errorReporting";

// Catches the things a React error boundary CAN'T catch: truly uncaught
// runtime errors (window "error") and unhandled promise rejections
// (window "unhandledrejection") — e.g. a stray failed fetch nobody
// awaited/caught. Same rule as everywhere else: customer sees the
// cartoon + a trial ID, never the raw error.
export default function GlobalErrorOverlay() {
  const [trialId, setTrialId] = useState(null);

  useEffect(() => {
    const handle = (context) => (event) => {
      const error = event.reason || event.error;
      const message = error?.message || event.message || "Unknown error";
      // Ignore noisy, harmless browser quirks that aren't real bugs.
      if (/ResizeObserver loop/.test(message)) return;

      const id = reportError({
        message,
        stack: error?.stack,
        context,
        fatal: true,
      });
      setTrialId(id);
    };

    const onError = handle("window.onerror (uncaught runtime error)");
    const onRejection = handle("window.onunhandledrejection (network/async failure)");

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!trialId) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--color-cream)]">
      <OopsScreen trialId={trialId} onRetry={() => window.location.reload()} />
    </div>
  );
}
