import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Package, ChevronDown, RotateCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SheetsAPI } from "../lib/sheets";
import SEO from "../components/SEO";
import OrderTimeline from "../components/OrderTimeline";
import ReturnRequestModal from "../components/ReturnRequestModal";

const RETURN_WINDOW_DAYS = 7;

function isReturnEligible(order) {
  if (order.trackingStatus !== "Delivered") return false;
  const deliveredAt = order.stageTimestamps?.Delivered;
  if (!deliveredAt) return false;
  const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= RETURN_WINDOW_DAYS;
}

function ReturnStatusBadge({ status }) {
  const styles = {
    Requested: "bg-amber-100 text-amber-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

function StatusBadge({ status }) {
  const isPaid = (status || "").toLowerCase() === "paid";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isPaid
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700"
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

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [returns, setReturns] = useState([]);
  const [returnsLoaded, setReturnsLoaded] = useState(false);
  const [returnsDemoMode, setReturnsDemoMode] = useState(false);
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  const loadReturns = async () => {
    if (!user?.email) return;
    try {
      const res = await SheetsAPI.getMyReturns(user.email);
      if (res.demo) {
        setReturnsDemoMode(true);
      } else if (res.ok) {
        setReturns(res.returns || []);
      }
    } catch {
      // non-fatal — the returns section just stays empty
    } finally {
      setReturnsLoaded(true);
    }
  };

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
    loadReturns();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      <SEO title="My Account" path="/account" noindex />
      <div className="text-center">
        <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">
          Hi, {user.name} 👋
        </h1>
        <p className="mt-2 text-[var(--color-charcoal)]/70">{user.email}</p>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="mt-6 rounded-full border border-[var(--color-forest-dark)]/30 px-8 py-2.5 text-sm font-semibold text-[var(--color-forest-dark)] hover:bg-[var(--color-forest-dark)]/5"
        >
          Logout
        </button>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-xl text-[var(--color-forest-dark)]">
          My Orders
        </h2>

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
      </div>

      {!returnsDemoMode && returnsLoaded && returns.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl text-[var(--color-forest-dark)]">
            My Returns &amp; Exchanges
          </h2>
          <div className="mt-4 space-y-3">
            {returns.map((r) => (
              <div key={r.returnId} className="rounded-2xl border border-[var(--color-forest)]/10 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-[var(--color-charcoal)]/50">{r.returnId}</p>
                    <p className="text-sm text-[var(--color-charcoal)]/60">
                      {r.type} · Order {r.orderId}
                    </p>
                  </div>
                  <ReturnStatusBadge status={r.status} />
                </div>
                <p className="mt-2 text-sm text-[var(--color-charcoal)]/70">{r.reason}</p>
                {r.status === "Approved" && r.type === "Return" && (
                  <p className="mt-2 text-xs text-[var(--color-forest-dark)]">
                    {r.refundStatus === "Processed"
                      ? `Refund of ₹${r.refundAmount} initiated to your original payment method.`
                      : "Your refund is being processed."}
                  </p>
                )}
                {r.status === "Rejected" && r.adminNote && (
                  <p className="mt-2 text-xs text-[var(--color-charcoal)]/60">Note: {r.adminNote}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {returnModalOrder && (
        <ReturnRequestModal
          order={returnModalOrder}
          user={user}
          onClose={() => setReturnModalOrder(null)}
          onSubmitted={loadReturns}
        />
      )}
    </div>
  );
}
