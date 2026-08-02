import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { LocateFixed, Loader2, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useAddresses } from "../context/AddressContext";
import { useCampaign } from "../context/CampaignContext";
import { discountedPrice } from "../lib/pricing";
import { SheetsAPI } from "../lib/sheets";
import { detectCurrentAddress } from "../lib/geolocation";
import SEO from "../components/SEO";
import AddressCard from "../components/AddressCard";

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
  const { addresses, defaultAddress, saveAddress } = useAddresses();
  const { discountPercent } = useCampaign();
  const navigate = useNavigate();
  const total = discountedPrice(subtotal, discountPercent); // display only — the backend recalculates the real charge from its own Products + Campaigns sheets

  // Which saved address (if any) is currently chosen for delivery.
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.addressId || null);
  // Shows the "add a new address" form instead of the saved-address list.
  const [addingNew, setAddingNew] = useState(addresses.length === 0);
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  // Manual entry fields — used directly for guests, or for the "add
  // new address" form when a signed-in customer isn't picking a saved one.
  const [address, setAddress] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    lat: null,
    lng: null,
  });
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) return <Navigate to="/products" replace />;

  const selectedSavedAddress = addresses.find((a) => a.addressId === selectedAddressId) || null;

  // The address actually used to place the order — either the picked
  // saved address, or whatever's in the manual form right now.
  const activeAddress =
    !addingNew && selectedSavedAddress
      ? {
          name: selectedSavedAddress.name,
          email: user?.email || address.email,
          phone: selectedSavedAddress.phone,
          line1: [selectedSavedAddress.line1, selectedSavedAddress.line2].filter(Boolean).join(", "),
          city: selectedSavedAddress.city,
          pincode: selectedSavedAddress.pincode,
        }
      : address;

  const handleUseLocation = async () => {
    setLocateError("");
    setLocating(true);
    try {
      const detected = await detectCurrentAddress();
      setAddress((prev) => ({
        ...prev,
        line1: detected.line1 || prev.line1,
        city: detected.city || prev.city,
        state: detected.state || prev.state,
        pincode: detected.pincode || prev.pincode,
        lat: detected.lat,
        lng: detected.lng,
      }));
    } catch (err) {
      setLocateError(err.message || "Couldn't get your current location.");
    } finally {
      setLocating(false);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");

    if (!addingNew && !selectedSavedAddress) {
      setError("Please choose a delivery address, or add a new one.");
      return;
    }

    setPlacing(true);

    try {
      // If checking out with a freshly typed address, offer to save it
      // to the account so it's a one-tap pick next time.
      if (addingNew && user?.email && saveNewAddress) {
        await saveAddress({
          label: "Home",
          name: address.name,
          phone: address.phone,
          line1: address.line1,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          lat: address.lat,
          lng: address.lng,
        });
      }

      // 1. Create a pending order record in the "Orders" sheet.
      const orderRes = await SheetsAPI.placeOrder({
        items,
        customer: activeAddress,
        amount: total, // display hint only — Code.gs recomputes the real charge from Products + Campaigns, never trusts this
      });

      if (orderRes.demo) {
        // No backend wired up yet — simulate success so the UI flow is testable.
        clearCart();
        navigate("/order-success", { state: { email: activeAddress.email } });
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
        amount: total * 100,
        currency: "INR",
        name: "neobonn",
        description: "Order payment",
        order_id: razorpayOrderId,
        prefill: { name: activeAddress.name, email: activeAddress.email, contact: activeAddress.phone },
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
            navigate("/order-success", { state: { orderId, email: activeAddress.email } });
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
      <SEO title="Checkout" path="/checkout" noindex />
      <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">Checkout</h1>

      <h2 className="mt-8 font-display text-lg text-[var(--color-forest-dark)]">Deliver to</h2>

      {/* ---- Saved-address picker (signed-in customers with saved addresses) ---- */}
      {user && addresses.length > 0 && !addingNew && (
        <div className="mt-4 space-y-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.addressId}
              address={addr}
              selectable
              selected={selectedAddressId === addr.addressId}
              onSelect={() => setSelectedAddressId(addr.addressId)}
            />
          ))}
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-[var(--color-forest-dark)]/30 py-3 text-sm font-semibold text-[var(--color-forest-dark)]"
          >
            <Plus size={16} /> Deliver to a different address
          </button>
        </div>
      )}

      {/* ---- Manual address entry (guests, or "add a new address") ---- */}
      {(addingNew || addresses.length === 0 || !user) && (
        <form onSubmit={handlePay} className="mt-4 space-y-4">
          {user && addresses.length > 0 && (
            <button
              type="button"
              onClick={() => setAddingNew(false)}
              className="text-xs font-semibold text-[var(--color-forest-dark)] underline"
            >
              ← Choose a saved address instead
            </button>
          )}

          <button
            type="button"
            onClick={handleUseLocation}
            disabled={locating}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-forest-dark)]/30 bg-[var(--color-forest-dark)]/5 py-3 text-sm font-semibold text-[var(--color-forest-dark)] disabled:opacity-60"
          >
            {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
            {locating ? "Finding your location..." : "Use my current location"}
          </button>
          {locateError && <p className="text-xs text-red-600">{locateError}</p>}

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
          <div className="grid gap-4 sm:grid-cols-3">
            <input required placeholder="City" value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
            <input placeholder="State" value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
              className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
            <input required placeholder="Pincode" value={address.pincode}
              onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
              className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
          </div>

          {user && (
            <label className="flex items-center gap-2 text-sm text-[var(--color-charcoal)]/70">
              <input
                type="checkbox"
                checked={saveNewAddress}
                onChange={(e) => setSaveNewAddress(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-forest)]/30"
              />
              Save this address to my account
            </label>
          )}

          <div className="border-t border-[var(--color-forest)]/10 pt-4">
            {discountPercent > 0 && (
              <>
                <div className="flex items-center justify-between text-sm text-[var(--color-charcoal)]/60">
                  <span>Bag total</span>
                  <span className="line-through">₹{subtotal}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm font-semibold text-[var(--color-forest)]">
                  <span>Discount ({discountPercent}% off)</span>
                  <span>− ₹{subtotal - total}</span>
                </div>
              </>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="font-display text-xl">Total</span>
              <span className="font-display text-xl">₹{total}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            disabled={placing}
            className="w-full rounded-full bg-[var(--color-forest-dark)] py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {placing ? "Processing..." : `Pay ₹${total}`}
          </button>
        </form>
      )}

      {/* ---- Pay button when a saved address is selected (form above is hidden) ---- */}
      {user && addresses.length > 0 && !addingNew && (
        <div className="mt-6 space-y-4">
          <div className="border-t border-[var(--color-forest)]/10 pt-4">
            {discountPercent > 0 && (
              <>
                <div className="flex items-center justify-between text-sm text-[var(--color-charcoal)]/60">
                  <span>Bag total</span>
                  <span className="line-through">₹{subtotal}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm font-semibold text-[var(--color-forest)]">
                  <span>Discount ({discountPercent}% off)</span>
                  <span>− ₹{subtotal - total}</span>
                </div>
              </>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="font-display text-xl">Total</span>
              <span className="font-display text-xl">₹{total}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handlePay}
            disabled={placing}
            className="w-full rounded-full bg-[var(--color-forest-dark)] py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {placing ? "Processing..." : `Pay ₹${total}`}
          </button>
        </div>
      )}
    </div>
  );
}
