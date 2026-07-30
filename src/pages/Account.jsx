import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SheetsAPI } from "../lib/sheets";
import SEO from "../components/SEO";

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

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const res = await SheetsAPI.getMyOrders(user.email);
      if (res.demo) {
        setDemoMode(true);
      } else if (res.ok) {
        setOrders(res.orders);
      }
      setLoading(false);
    })();
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

        {!demoMode && !loading && orders.length === 0 && (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-forest)]/20 py-12 text-center">
            <Package className="text-[var(--color-forest)]/40" size={32} />
            <p className="mt-3 text-sm text-[var(--color-charcoal)]/60">
              You haven't placed any orders yet.
            </p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div key={order.orderId} className="rounded-2xl border border-[var(--color-forest)]/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-[var(--color-charcoal)]/50">{order.orderId}</p>
                  <p className="text-sm text-[var(--color-charcoal)]/60">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </p>
                </div>
                <StatusBadge status={order.status} />
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
