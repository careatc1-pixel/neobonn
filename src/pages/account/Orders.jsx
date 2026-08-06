import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Package, ChevronDown, RotateCcw, MessageCircle, Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SheetsAPI } from "../../lib/sheets";
import { openHelpDesk } from "../../lib/helpDeskBus";
import { COMPANY } from "../../data/company";
import SEO from "../../components/SEO";
import OrderTimeline from "../../components/OrderTimeline";
import ReturnRequestModal from "../../components/ReturnRequestModal";

const RETURN_WINDOW_DAYS = 7;

function isReturnEligible(order) {
  if (order.trackingStatus !== "Delivered") return false;
  const deliveredAt = order.stageTimestamps?.Delivered;
  if (!deliveredAt) return false;
  const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= RETURN_WINDOW_DAYS;
}

function StatusBadge({ status }) {
  const isPaid = (status || "").toLowerCase() === "paid";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {status || "Pending"}
    </span>
  );
}

function TrackingBadge({ trackingStatus }) {
  const isDelivered = trackingStatus === "Delivered";
  const isCancelled = trackingStatus === "Cancelled";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isCancelled
          ? "bg-red-100 text-red-700"
          : isDelivered
          ? "bg-green-100 text-green-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      {trackingStatus || "Order Placed"}
    </span>
  );
}

// Its own route (/account/orders) — a real page navigation from the
// "Your Orders" quick-action card, not a same-page scroll.
export default function AccountOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      setLoading(true);
      setLoadErr("");
      try {
        const res = await SheetsAPI.getMyOrders(user.email);
        if (res.demo) {
          setDemoMode(true);
        } else if (res.ok) {
          setOrders(res.orders);
        } else {
          setLoadErr(res.message || "Couldn't load your orders.");
        }
      } catch (err) {
        setLoadErr(err.message || "Couldn't load your orders.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8">
      <SEO title="Your Orders" path="/account/orders" noindex />

      <Link
        to="/account"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-forest-dark)]"
      >
        <ArrowLeft size={16} /> Back to Account
      </Link>

      <h1 className="mt-4 font-display text-2xl text-[var(--color-forest-dark)]">Your Orders</h1>

      {demoMode && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Demo mode: connect the Google Sheets backend (see README.md) to
          see real order history here.
        </div>
      )}

      {!demoMode && loading && (
        <p className="mt-4 text-sm text-[var(--color-charcoal)]/50">Loading your orders...</p>
      )}

      {!demoMode && loadErr && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadErr}
        </div>
      )}

      {!demoMode && !loading && !loadErr && orders.length === 0 && (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-forest)]/20 py-12 text-center">
          <Package className="text-[var(--color-forest)]/40" size={32} />
          <p className="mt-3 text-sm text-[var(--color-charcoal)]/60">
            You haven't placed any orders yet.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {orders.map((order) => {
          const isOpen = expandedId === order.orderId;
          return (
            <div key={order.orderId} className="rounded-2xl border border-[var(--color-forest)]/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-[var(--color-charcoal)]/50">{order.orderId}</p>
                  <p className="text-sm text-[var(--color-charcoal)]/60">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <TrackingBadge trackingStatus={order.trackingStatus} />
                </div>
              </div>

              <ul className="mt-4 space-y-1 text-sm text-[var(--color-charcoal)]/70">
                {(order.items || []).map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.name} × {item.qty}</span>
                    {item.price && <span>₹{item.price * item.qty}</span>}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--color-forest)]/10 pt-3">
                <span className="text-sm font-medium text-[var(--color-charcoal)]/60">Total</span>
                <span className="font-display text-lg text-[var(--color-forest-dark)]">₹{order.amount}</span>
              </div>

              <button
                onClick={() => setExpandedId(isOpen ? null : order.orderId)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-forest)]/15 py-2 text-xs font-semibold text-[var(--color-forest-dark)]"
              >
                {isOpen ? "Hide tracking" : "Track shipment"}
                <ChevronDown size={14} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>

              {isReturnEligible(order) && (
                <button
                  onClick={() => setReturnModalOrder(order)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-forest)]/15 py-2 text-xs font-semibold text-[var(--color-forest-dark)]"
                >
                  <RotateCcw size={14} /> Return / Exchange
                </button>
              )}

              {order.trackingStatus === "Delivered" && (
                <a
                  href={COMPANY.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 py-2 text-xs font-semibold text-[var(--color-forest-dark)]"
                >
                  <Star size={14} /> Loved it? Rate us on Google
                </a>
              )}

              <button
                onClick={() => {
                  openHelpDesk();
                }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-forest)]/15 py-2 text-xs font-semibold text-[var(--color-forest-dark)]"
              >
                <MessageCircle size={14} /> Need help with this order?
              </button>

              {isOpen && (
                <div className="mt-4 border-t border-[var(--color-forest)]/10 pt-4">
                  <OrderTimeline
                    trackingStatus={order.trackingStatus}
                    trackingHistory={order.trackingHistory}
                    stageTimestamps={order.stageTimestamps}
                    carrier={order.carrier}
                    trackingNumber={order.trackingNumber}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {returnModalOrder && (
        <ReturnRequestModal
          order={returnModalOrder}
          user={user}
          onClose={() => setReturnModalOrder(null)}
          onSubmitted={() => {}}
        />
      )}
    </div>
  );
}
