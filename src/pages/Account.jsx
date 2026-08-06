import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ChevronDown, ChevronRight, RotateCcw, MessageCircle,
  Heart, Gift, UserRound, ShoppingBag, MapPinned,
  Wallet, ArrowDownLeft, ArrowUpRight, Plus, X, Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SheetsAPI } from "../lib/sheets";
import { loadRazorpayScript } from "../lib/razorpay";
import { openHelpDesk } from "../lib/helpDeskBus";
import SEO from "../components/SEO";

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

// Scrolls to a section still on this same page (used for Refunds and the
// Wallet card, which stay inline). Orders / Addresses / Wishlist now live
// on their own routes — see the "Your Information" list and quick-action
// cards below, which use navigate() instead.
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

function WalletTxnRow({ txn }) {
  const isCredit = txn.type === "Credit";
  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-forest)]/8 px-4 py-3 last:border-b-0">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isCredit ? "bg-green-100" : "bg-[var(--color-forest)]/10"
        }`}
      >
        {isCredit ? (
          <ArrowDownLeft size={16} className="text-green-700" />
        ) : (
          <ArrowUpRight size={16} className="text-[var(--color-forest-dark)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">
          {txn.source || (isCredit ? "Wallet credit" : "Wallet debit")}
        </p>
        <p className="text-xs text-[var(--color-charcoal)]/50">
          {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
          {txn.referenceId ? ` · ${txn.referenceId}` : ""}
        </p>
      </div>
      <span className={`shrink-0 text-sm font-semibold ${isCredit ? "text-green-700" : "text-[var(--color-charcoal)]"}`}>
        {isCredit ? "+" : "−"}₹{txn.amount}
      </span>
    </div>
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

const TOPUP_PRESETS = [200, 500, 1000, 2000];

// "Add Money" — lets the customer top up their own wallet via Razorpay.
// Mirrors Checkout's create-order -> open Razorpay -> verify-payment flow,
// just against the wallet top-up endpoints instead of an order.
function AddMoneyModal({ user, onClose, onCredited }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (amt > 50000) {
      setError("Max ₹50,000 per top-up.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const orderRes = await SheetsAPI.createWalletTopup({ email: user.email, amount: amt });
      if (!orderRes.ok) {
        setError(orderRes.message || "Could not start payment. Please try again.");
        setBusy(false);
        return;
      }

      // Backend said "ok" but didn't actually hand back a usable Razorpay
      // order — happens if Razorpay keys aren't set in Script Properties,
      // or the Apps Script backend hasn't been redeployed with the wallet
      // top-up endpoints yet. Catch this here with a clear message instead
      // of letting Razorpay's own checkout.js throw a raw "No key passed".
      if (!orderRes.razorpayOrderId || !orderRes.razorpayKeyId) {
        setError("Payment gateway is not configured yet. Please contact support.");
        setBusy(false);
        return;
      }

      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) throw new Error("Could not load payment gateway. Check your connection.");

      const rzp = new window.Razorpay({
        key: orderRes.razorpayKeyId,
        amount: orderRes.amount * 100,
        currency: "INR",
        name: "neobonn",
        description: "Wallet top-up",
        order_id: orderRes.razorpayOrderId,
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: "#33503f" },
        handler: async (response) => {
          const verify = await SheetsAPI.verifyWalletTopup({
            email: user.email,
            amount: orderRes.amount,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (verify.ok) {
            onCredited();
            onClose();
          } else {
            setError("Payment could not be verified. Please contact support.");
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });

      rzp.on("payment.failed", (response) => {
        setError(response?.error?.description || "Payment failed. Please try again.");
        setBusy(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-[var(--color-forest-dark)]">Add Money</h3>
          <button onClick={onClose} aria-label="Close" className="text-[var(--color-charcoal)]/50">
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--color-charcoal)]/50">
          Money added here can be used at checkout on any future order.
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-[var(--color-forest)]/15 px-4 py-3">
          <span className="text-lg font-semibold text-[var(--color-charcoal)]/60">₹</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(""); }}
            placeholder="Enter amount"
            className="w-full bg-transparent text-lg font-semibold text-[var(--color-charcoal)] outline-none"
            autoFocus
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {TOPUP_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { setAmount(String(p)); setError(""); }}
              className="rounded-full border border-[var(--color-forest)]/15 px-4 py-1.5 text-xs font-semibold text-[var(--color-forest-dark)] hover:bg-[var(--color-forest)]/5"
            >
              ₹{p}
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleAdd}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          {busy ? "Processing..." : "Proceed to pay"}
        </button>
      </div>
    </div>
  );
}

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [returns, setReturns] = useState([]);
  const [returnsLoaded, setReturnsLoaded] = useState(false);
  const [returnsDemoMode, setReturnsDemoMode] = useState(false);

  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTxns, setWalletTxns] = useState([]);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const [walletDemoMode, setWalletDemoMode] = useState(false);
  const [walletExpanded, setWalletExpanded] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);

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

  const loadWallet = async () => {
    if (!user?.email) return;
    try {
      const res = await SheetsAPI.getWallet(user.email);
      if (res.demo) {
        setWalletDemoMode(true);
      } else if (res.ok) {
        setWalletBalance(res.balance || 0);
        setWalletTxns(res.transactions || []);
      }
    } catch {
      // non-fatal — the wallet card just stays at ₹0
    } finally {
      setWalletLoaded(true);
    }
  };

  useEffect(() => {
    if (!user?.email) return;
    loadReturns();
    loadWallet();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8">
      <SEO title="My Account" path="/account" noindex />

      {/* ---- Profile header ---- */}
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-forest)]/10 bg-white p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-forest)]/10">
          <UserRound size={30} className="text-[var(--color-forest-dark)]" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg text-[var(--color-forest-dark)]">{user.name}</h1>
          <p className="mt-0.5 text-sm text-[var(--color-charcoal)]/60">{user.phone || user.email}</p>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="shrink-0 rounded-full border border-[var(--color-forest-dark)]/30 px-5 py-2 text-xs font-semibold text-[var(--color-forest-dark)] hover:bg-[var(--color-forest-dark)]/5"
        >
          Logout
        </button>
      </div>

      {/* ---- Quick action cards — each is a real page navigation ---- */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickActionCard icon={ShoppingBag} label="Your Orders" onClick={() => navigate("/account/orders")} />
        <QuickActionCard icon={MapPinned} label="Addresses" onClick={() => navigate("/account/addresses")} />
        <QuickActionCard icon={MessageCircle} label="Help & Support" onClick={openHelpDesk} />
        <QuickActionCard icon={Heart} label="Your Wishlist" onClick={() => navigate("/account/wishlist")} />
      </div>

      {/* ---- Gift cards banner (not wired to real money yet — see CHANGES.md) ---- */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--color-gold)]/25 bg-gradient-to-r from-[var(--color-forest-dark)]/5 to-[var(--color-gold)]/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <Gift size={20} className="text-[var(--color-forest-dark)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-charcoal)]">neobonn Gift Cards</p>
            <p className="text-xs text-[var(--color-charcoal)]/50">Coming soon</p>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/50">
          Coming Soon
        </span>
      </div>

      {/* ---- neobonn Cash Wallet — real balance, backed by the Wallet sheet ---- */}
      <div id="wallet" className="mt-4 scroll-mt-6 overflow-hidden rounded-2xl border border-[var(--color-forest)]/10 bg-white">
        <button
          onClick={() => setWalletExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-forest-dark)]/10">
              <Wallet size={18} className="text-[var(--color-forest-dark)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-charcoal)]">neobonn Cash Wallet</p>
              <p className="text-xs text-[var(--color-charcoal)]/50">
                {walletDemoMode
                  ? "Connect the backend to activate"
                  : "Refunds land here instantly · usable at checkout"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-[var(--color-forest-dark)]">
              ₹{walletLoaded ? walletBalance : "..."}
            </span>
            {!walletDemoMode && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); setShowAddMoney(true); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setShowAddMoney(true); } }}
                aria-label="Add money to wallet"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-forest-dark)]/10 text-[var(--color-forest-dark)] hover:bg-[var(--color-forest-dark)]/20"
              >
                <Plus size={15} />
              </span>
            )}
            <ChevronDown size={16} className={`text-[var(--color-charcoal)]/40 transition-transform ${walletExpanded ? "rotate-180" : ""}`} />
          </div>
        </button>

        {walletExpanded && (
          <div className="border-t border-[var(--color-forest)]/10">
            {!walletDemoMode && (
              <div className="px-5 pt-4">
                <button
                  onClick={() => setShowAddMoney(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-forest-dark)]/25 py-2.5 text-sm font-semibold text-[var(--color-forest-dark)] hover:bg-[var(--color-forest-dark)]/5"
                >
                  <Plus size={16} /> Add Money
                </button>
              </div>
            )}
            {walletDemoMode && (
              <p className="px-5 py-4 text-sm text-amber-800">
                Demo mode: connect the Google Sheets backend to see your real wallet balance and history here.
              </p>
            )}
            {!walletDemoMode && walletLoaded && walletTxns.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-[var(--color-charcoal)]/50">
                No wallet activity yet — approved return refunds can be credited here instead of your
                original payment method.
              </p>
            )}
            {!walletDemoMode && walletTxns.length > 0 && (
              <div>
                {walletTxns.map((txn) => (
                  <WalletTxnRow key={txn.txnId} txn={txn} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- Your Information list ---- */}
      <div className="mt-8">
        <h2 className="px-1 font-display text-lg text-[var(--color-forest-dark)]">Your Information</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--color-forest)]/10 bg-white">
          <InfoRow icon={RotateCcw} label="Your Refunds" onClick={() => scrollToSection("refunds")} />
          <InfoRow icon={Wallet} label="neobonn Cash Wallet" onClick={() => { setWalletExpanded(true); scrollToSection("wallet"); }} />
          <InfoRow icon={MapPinned} label="Saved Addresses" onClick={() => navigate("/account/addresses")} />
          <InfoRow icon={Heart} label="Your Wishlist" onClick={() => navigate("/account/wishlist")} />
          <InfoRow icon={Gift} label="E-Gift Cards" badge="Soon" />
          <InfoRow icon={MessageCircle} label="Help & Support" onClick={openHelpDesk} />
        </div>
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

      {showAddMoney && (
        <AddMoneyModal
          user={user}
          onClose={() => setShowAddMoney(false)}
          onCredited={loadWallet}
        />
      )}
    </div>
  );
}
