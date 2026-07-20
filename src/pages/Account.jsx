import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Leaf, Package, LogOut, MapPin, Phone, Mail, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SheetsAPI } from "../lib/sheets";

const STATUS_STYLES = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
};

function statusStyle(status) {
  return STATUS_STYLES[status] || "bg-[var(--color-forest)]/5 text-[var(--color-forest-dark)] border-[var(--color-forest)]/15";
}

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      setLoading(true);
      const res = await SheetsAPI.getMyOrders(user.email);
      if (res.demo) {
        setDemo(true);
        setOrders([]);
      } else if (res.ok) {
        setOrders(res.orders || []);
      }
      setLoading(false);
    })();
  }, [user?.email]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="relative overflow-hidden px-5 py-14 md:py-20">
      <div className="pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full bg-[var(--color-forest)]/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-[var(--color-gold)]/8 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        {/* Profile card */}
        <div className="rounded-3xl border border-[var(--color-forest)]/10 bg-white p-7 shadow-[0_20px_50px_-24px_rgba(34,54,42,0.18)] md:p-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-forest-dark)] font-display text-xl text-white">
                {user.name?.[0]?.toUpperCase() || "N"}
              </span>
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">
                  <Leaf size={11} /> neobonn member
                </p>
                <h1 className="font-display text-2xl text-[var(--color-forest-dark)]">
                  Hi, {user.name} 👋
                </h1>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="flex items-center gap-1.5 self-stretch rounded-full border border-[var(--color-forest-dark)]/20 px-5 py-2.5 text-sm font-semibold text-[var(--color-forest-dark)] transition-colors hover:bg-[var(--color-forest-dark)]/5 sm:self-auto"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>

          <div className="mt-6 grid gap-3 border-t border-[var(--color-forest)]/10 pt-6 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-[var(--color-charcoal)]/70">
              <Mail size={15} className="text-[var(--color-forest)]/50" /> {user.email}
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-charcoal)]/70">
                <Phone size={15} className="text-[var(--color-forest)]/50" /> {user.phone}
              </div>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-xl text-[var(--color-forest-dark)]">
            <Package size={19} /> My Orders
          </h2>

          {loading && (
            <div className="mt-5 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--color-forest)]/5" />
              ))}
            </div>
          )}

          {!loading && demo && (
            <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-forest)]/20 bg-white/60 px-6 py-8 text-center text-sm text-[var(--color-charcoal)]/60">
              Order history will appear here once the store's Google Sheets
              backend is connected. Right now you're browsing in demo mode.
            </div>
          )}

          {!loading && !demo && orders.length === 0 && (
            <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-forest)]/20 bg-white/60 px-6 py-10 text-center">
              <p className="text-sm text-[var(--color-charcoal)]/60">
                You haven't placed any orders yet.
              </p>
              <button
                onClick={() => navigate("/products")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-forest-dark)] px-6 py-2.5 text-sm font-semibold text-white"
              >
                Start Shopping <ChevronRight size={15} />
              </button>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="mt-5 space-y-4">
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className="rounded-2xl border border-[var(--color-forest)]/10 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(34,54,42,0.25)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-forest)]/10 pb-3">
                    <div>
                      <p className="text-xs text-[var(--color-charcoal)]/50">Order ID</p>
                      <p className="font-mono text-sm text-[var(--color-forest-dark)]">{order.orderId}</p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(order.status)}`}
                    >
                      {order.status || "Placed"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-11 w-11 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-[var(--color-charcoal)]">{item.name}</p>
                          <p className="text-xs text-[var(--color-charcoal)]/50">Qty {item.qty}</p>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-forest-dark)]">
                          ₹{(item.price || 0) * item.qty}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-forest)]/10 pt-3">
                    <div className="flex items-start gap-1.5 text-xs text-[var(--color-charcoal)]/55">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      <span>{order.address}, {order.city} - {order.pincode}</span>
                    </div>
                    <p className="font-display text-lg text-[var(--color-forest-dark)]">
                      ₹{order.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
