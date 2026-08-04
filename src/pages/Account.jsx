import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Package, ChevronDown, ChevronRight, ChevronLeft, RotateCcw, MessageCircle,
  Heart, Gift, UserRound, ShoppingBag, MapPinned, Star,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { SheetsAPI } from "../lib/sheets";
import { openHelpDesk } from "../lib/helpDeskBus";
import { COMPANY } from "../data/company";
import SEO from "../components/SEO";
import OrderTimeline from "../components/OrderTimeline";
import ReturnRequestModal from "../components/ReturnRequestModal";
import AddressBook from "../components/AddressBook";

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

// Scrolls to a section on this same page (used by the quick-action cards
// and the "Your Information" list, like tapping a row on a native app's
// Profile screen).
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function QuickActionCard({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-forest)]/10 bg-white py-5 text-center transition-shadow hover:shadow-md"
    >
      <Icon size={22} className="text-[var(--color-forest-dark)]" />
      <span className="text-sm font-semibold leading-tight text-[var(--color-charcoal)]">{label}</span>
    </button>
  );
}

function InfoRow({ icon: Icon, label, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex w-full items-center gap-3 border-b border-[var(--color-forest)]/8 px-4 py-3.5 text-left last:border-b-0 disabled:opacity-60"
    >
      <Icon size={18} className="text-[var(--color-forest-dark)]" />
      <span className="flex-1 text-sm font-medium text-[var(--color-charcoal)]">{label}</span>
      {badge && (
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
          {badge}
        </span>
      )}
      {onClick && <ChevronRight size={16} className="text-[var(--color-charcoal)]/30" />}
    </button>
  );
}

export default function Account() {
  const { user, logout } = useAuth();
  const { addItem } = useCart();
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlist();
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
  const [movedToBag, setMovedToBag] = useState(null);

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
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return <Navigate to="/login" replace />;

  const handleMoveToBag = (item) => {
    addItem({ id: item.id, name: item.name, price: item.price, image: item.image, stock: Infinity }, 1);
    setMovedToBag(item.id);
    setTimeout(() => setMovedToBag(null), 1500);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 md:px-8 md:py-10">
      <SEO title="My Account" path="/account" noindex />

      {/* ---- Page title bar (back + "Profile") ---- */}
      <div className="mb-5 flex items-center gap-3 md:hidden">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-forest)]/15 bg-white text-[var(--color-forest-dark)]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-display text-xl text-[var(--color-forest-dark)]">Profile</h1>
      </div>

      {/* ---- Profile header ---- */}
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-forest)]/10 bg-white p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-forest-dark)]/10">
          <UserRound size={30} className="text-[var(--color-forest-dark)]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-2xl text-[var(--color-forest-dark)]">{user.name}</h2>
          <p className="mt-0.5 text-sm text-[var(--color-charcoal)]/60">{user.phone || user.email}</p>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="shrink-0 rounded-full border border-[var(--color-forest-dark)]/30 px-5 py-2 text-xs font-semibold text-[var(--color-forest-dark)] hover:bg-[var(--color-forest-dark)]/5"
        >
          Logout
        </button>
      </div>

      {/* ---- Quick action cards ---- */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <QuickActionCard icon={ShoppingBag} label="Your Orders" onClick={() => scrollToSection("orders")} />
        <QuickActionCard icon={MessageCircle} label="Help & Support" onClick={openHelpDesk} />
        <QuickActionCard icon={Heart} label="Your Wishlist" onClick={() => scrollToSection("wishlist")} />
      </div>

      {/* ---- Gift cards banner (not wired to real money yet — see CHANGES.md) ---- */}
      <button
        onClick={() => scrollToSection("gift-cards")}
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-[var(--color-gold)]/25 bg-gradient-to-r from-[var(--color-forest-dark)]/8 to-[var(--color-gold)]/15 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Gift size={20} className="text-[var(--color-forest-dark)]" />
          <p className="text-sm font-semibold text-[var(--color-charcoal)]">neobonn Cash & Gift Card</p>
        </div>
        <ChevronRight size={18} className="text-[var(--color-charcoal)]/40" />
      </button>
      <div id="gift-cards" className="-mt-3 flex scroll-mt-6 items-center justify-between rounded-b-2xl border border-t-0 border-[var(--color-gold)]/25 bg-white px-5 py-3">
        <p className="text-sm text-[var(--color-charcoal)]/60">
          Available Balance <span className="font-semibold text-[var(--color-charcoal)]">₹0</span>
        </p>
        <button
          onClick={() => alert("Gift cards & wallet balance are coming soon!")}
          className="rounded-full border border-[var(--color-forest-dark)]/20 bg-white px-4 py-1.5 text-xs font-semibold text-[var(--color-forest-dark)]"
        >
          Add Balance
        </button>
      </div>

      {/* ---- Your Information list ---- */}
      <div className="mt-8">
        <h2 className="px-1 font-display text-lg text-[var(--color-forest-dark)]">Your Information</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--color-forest)]/10 bg-white">
          <InfoRow icon={RotateCcw} label="Your Refunds" onClick={() => scrollToSection("refunds")} />
          <InfoRow icon={Heart} label="Your Wishlist" onClick={() => scrollToSection("wishlist")} />
          <InfoRow icon={Gift} label="E-Gift Cards" badge="Soon" />
          <InfoRow icon={MapPinned} label="Saved Addresses" onClick={() => scrollToSection("addresses")} />
          <InfoRow icon={MessageCircle} label="Help & Support" onClick={openHelpDesk} />
        </div>
      </div>

      {/* ---- Orders ---- */}
      <div id="orders" className="mt-12 scroll-mt-6">
        <h2 className="font-display text-xl text-[var(--color-forest-dark)]">Your Orders</h2>

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
      </div>

      {/* ---- Saved Addresses ---- */}
      <div id="addresses" className="mt-12 scroll-mt-6">
        <h2 className="font-display text-xl text-[var(--color-forest-dark)]">Saved Addresses</h2>
        <p className="mt-1 text-xs text-[var(--color-charcoal)]/50">
          Save multiple delivery addresses and pick one at checkout — or tap "Use my current
          location" to fill one in automatically.
        </p>
        <AddressBook />
      </div>

      {/* ---- Wishlist ---- */}
      <div id="wishlist" className="mt-12 scroll-mt-6">
        <h2 className="font-display text-xl text-[var(--color-forest-dark)]">Your Wishlist</h2>
        <p className="mt-1 text-xs text-[var(--color-charcoal)]/50">
          Saved on this device — tap the heart on any product to add or remove it.
        </p>

        {wishlistItems.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-forest)]/20 py-12 text-center">
            <Heart className="text-[var(--color-forest)]/40" size={32} />
            <p className="mt-3 text-sm text-[var(--color-charcoal)]/60">Nothing saved yet.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {wishlistItems.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-[var(--color-forest)]/10 bg-white">
                <div className="aspect-square overflow-hidden bg-[var(--color-cream-deep)]">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">{item.name}</p>
                  <p className="text-sm text-[var(--color-forest-dark)]">₹{item.price}</p>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={() => handleMoveToBag(item)}
                      className="flex-1 rounded-full bg-[var(--color-forest-dark)] py-1.5 text-[11px] font-semibold text-white"
                    >
                      {movedToBag === item.id ? "Added ✓" : "Add to Bag"}
                    </button>
                    <button
                      onClick={() => removeWishlistItem(item.id)}
                      aria-label="Remove from wishlist"
                      className="rounded-full border border-[var(--color-forest)]/15 px-2.5 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Returns & Refunds ---- */}
      <div id="refunds" className="mt-12 scroll-mt-6">
        <h2 className="font-display text-xl text-[var(--color-forest-dark)]">Your Refunds</h2>

        {returnsDemoMode && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Demo mode: connect the Google Sheets backend to see refund/return
            history here.
          </div>
        )}

        {!returnsDemoMode && returnsLoaded && returns.length === 0 && (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-forest)]/20 py-12 text-center">
            <RotateCcw className="text-[var(--color-forest)]/40" size={32} />
            <p className="mt-3 text-sm text-[var(--color-charcoal)]/60">No refund or return requests yet.</p>
          </div>
        )}

        {!returnsDemoMode && returns.length > 0 && (
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
        )}
      </div>

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
