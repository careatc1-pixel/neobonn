import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { SheetsAPI } from "../lib/sheets";

// Loads the Razorpay Checkout script once.
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    line1: "",
    city: "",
    pincode: "",
  });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) return <Navigate to="/products" replace />;

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");
    setPlacing(true);

    try {
      // 1. Create a pending order record in the "Orders" sheet.
      const orderRes = await SheetsAPI.placeOrder({
        items,
        customer: address,
        amount: subtotal,
      });

      if (orderRes.demo) {
        // No backend wired up yet — simulate success so the UI flow is testable.
        clearCart();
        navigate("/order-success");
        return;
      }

      if (!orderRes.ok) {
        setError(orderRes.message || "Could not start payment. Please try again.");
        setPlacing(false);
        return;
      }

      const { orderId, razorpayOrderId, razorpayKeyId } = orderRes;
      if (!razorpayOrderId || !razorpayKeyId) {
        setError("Payment gateway is not configured yet. Please contact support.");
        setPlacing(false);
        return;
      }

      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) throw new Error("Could not load payment gateway. Check your connection.");

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: subtotal * 100,
        currency: "INR",
        name: "neobonn",
        description: "Order payment",
        order_id: razorpayOrderId,
        prefill: { name: address.name, email: address.email, contact: address.phone },
        theme: { color: "#33503f" },
        handler: async (response) => {
          // 2. Send Razorpay's response to our Apps Script backend,
          //    which verifies the HMAC signature server-side before
          //    marking the order as Paid in the Sheet.
          const verify = await SheetsAPI.verifyPayment({
            orderId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (verify.ok) {
            clearCart();
            navigate("/order-success");
          } else {
            setError("Payment could not be verified. Please contact support.");
          }
        },
        modal: { ondismiss: () => setPlacing(false) },
      });

      rzp.on("payment.failed", (response) => {
        setError(
          response?.error?.description || "Payment failed. Please try again."
        );
        setPlacing(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">Checkout</h1>

      <form onSubmit={handlePay} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input required placeholder="Full name" value={address.name}
            onChange={(e) => setAddress({ ...address, name: e.target.value })}
            className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
          <input required type="email" placeholder="Email" value={address.email}
            onChange={(e) => setAddress({ ...address, email: e.target.value })}
            className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
        </div>
        <input required placeholder="Phone number" value={address.phone}
          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
          className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
        <input required placeholder="Address" value={address.line1}
          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
          className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
        <div className="grid gap-4 sm:grid-cols-2">
          <input required placeholder="City" value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
          <input required placeholder="Pincode" value={address.pincode}
            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
            className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-forest)]/10 pt-4">
          <span className="font-display text-xl">Total</span>
          <span className="font-display text-xl">₹{subtotal}</span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={placing}
          className="w-full rounded-full bg-[var(--color-forest-dark)] py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {placing ? "Processing..." : `Pay ₹${subtotal}`}
        </button>
      </form>
    </div>
  );
}
