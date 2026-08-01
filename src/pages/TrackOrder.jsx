import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { SheetsAPI } from "../lib/sheets";
import SEO from "../components/SEO";
import OrderTimeline from "../components/OrderTimeline";

export default function TrackOrder() {
  const [params] = useSearchParams();
  const [orderId, setOrderId] = useState(params.get("orderId") || "");
  const [email, setEmail] = useState(params.get("email") || "");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const runLookup = async (e) => {
    e?.preventDefault();
    if (!orderId.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await SheetsAPI.trackOrder({ orderId: orderId.trim(), email: email.trim() });
      if (res.demo) {
        setDemoMode(true);
      } else if (res.ok) {
        setOrder(res.order);
      } else {
        setError(res.message || "Couldn't find that order.");
      }
    } catch (err) {
      setError(err.message || "Couldn't find that order.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-run the lookup if both fields arrived pre-filled via the URL
  // (e.g. a "Track Order" link from the order-success page or an email).
  useEffect(() => {
    if (params.get("orderId") && params.get("email")) runLookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 md:px-8">
      <SEO title="Track Your Order" path="/track-order" noindex />
      <h1 className="text-center font-display text-3xl text-[var(--color-forest-dark)]">
        Track Your Order
      </h1>
      <p className="mt-2 text-center text-[var(--color-charcoal)]/70">
        Enter your Order ID and the email you used at checkout.
      </p>

      <form onSubmit={runLookup} className="mt-8 space-y-3">
        <input
          required
          placeholder="Order ID (e.g. ORD1732012345678)"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm"
        />
        <input
          required
          type="email"
          placeholder="Email used at checkout"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm"
        />
        <button
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Search size={16} />
          {loading ? "Searching..." : "Track Order"}
        </button>
      </form>

      {demoMode && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Demo mode: connect the Google Sheets backend (see README.md) to enable real order tracking.
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {order && (
        <div className="mt-8 rounded-2xl border border-[var(--color-forest)]/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs text-[var(--color-charcoal)]/50">{order.orderId}</p>
            <p className="text-sm text-[var(--color-charcoal)]/60">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : ""}
            </p>
          </div>

          <ul className="mt-4 space-y-1 text-sm text-[var(--color-charcoal)]/70">
            {(order.items || []).map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>{item.name} × {item.qty}</span>
                {item.price && <span>₹{item.price * item.qty}</span>}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <OrderTimeline
              trackingStatus={order.trackingStatus}
              trackingHistory={order.trackingHistory}
              carrier={order.carrier}
              trackingNumber={order.trackingNumber}
            />
          </div>
        </div>
      )}
    </div>
  );
}
