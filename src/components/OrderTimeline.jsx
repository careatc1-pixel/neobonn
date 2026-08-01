import { Check, X, Package, Truck, Home, ClipboardCheck } from "lucide-react";

export const TRACKING_STAGES = ["Order Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

const STAGE_ICONS = {
  "Order Placed": ClipboardCheck,
  Confirmed: Check,
  Shipped: Package,
  "Out for Delivery": Truck,
  Delivered: Home,
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Renders the shipment progress as a horizontal stepper (Order Placed ->
// Confirmed -> Shipped -> Out for Delivery -> Delivered), plus the full
// timestamped history underneath. Handles the "Cancelled" terminal state
// separately since it isn't part of the normal forward progression.
export default function OrderTimeline({ trackingStatus, trackingHistory = [], carrier, trackingNumber }) {
  const isCancelled = trackingStatus === "Cancelled";
  const currentIndex = TRACKING_STAGES.indexOf(trackingStatus);

  return (
    <div>
      {isCancelled ? (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <X size={16} /> This order was cancelled.
        </div>
      ) : (
        <div className="flex items-start">
          {TRACKING_STAGES.map((stage, i) => {
            const Icon = STAGE_ICONS[stage];
            const done = currentIndex >= i;
            const isLast = i === TRACKING_STAGES.length - 1;
            return (
              <div key={stage} className={`flex ${isLast ? "" : "flex-1"} flex-col items-center text-center`}>
                <div className="flex w-full items-center">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                      done
                        ? "border-[var(--color-forest-dark)] bg-[var(--color-forest-dark)] text-white"
                        : "border-[var(--color-forest)]/25 text-[var(--color-forest)]/40"
                    }`}
                  >
                    <Icon size={15} />
                  </div>
                  {!isLast && (
                    <div
                      className={`h-0.5 flex-1 ${
                        currentIndex > i ? "bg-[var(--color-forest-dark)]" : "bg-[var(--color-forest)]/15"
                      }`}
                    />
                  )}
                </div>
                <p
                  className={`mt-2 text-[11px] font-medium leading-tight ${
                    done ? "text-[var(--color-forest-dark)]" : "text-[var(--color-charcoal)]/40"
                  }`}
                >
                  {stage}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {(carrier || trackingNumber) && (
        <p className="mt-4 text-xs text-[var(--color-charcoal)]/60">
          {carrier && <>Courier: <span className="font-medium">{carrier}</span></>}
          {carrier && trackingNumber && " · "}
          {trackingNumber && <>Tracking #: <span className="font-mono">{trackingNumber}</span></>}
        </p>
      )}

      {trackingHistory.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-[var(--color-forest)]/10 pt-3">
          {[...trackingHistory].reverse().map((h, i) => (
            <li key={i} className="flex items-start justify-between gap-3 text-xs">
              <div>
                <span className="font-medium text-[var(--color-charcoal)]/80">{h.status}</span>
                {h.note && <span className="text-[var(--color-charcoal)]/50"> — {h.note}</span>}
              </div>
              <span className="shrink-0 text-[var(--color-charcoal)]/40">{formatDate(h.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
