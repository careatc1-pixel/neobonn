import { useState, useEffect } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useAddresses } from "../context/AddressContext";
import { SheetsAPI } from "../lib/sheets";
import SEO from "../components/SEO";
import AddressCard from "../components/AddressCard";
import AddressForm from "../components/AddressForm";

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
  const { addresses, loading: addressesLoading, defaultAddress, saveAddress } = useAddresses();
  const navigate = useNavigate();

  // Which saved address (if any) the signed-in customer has picked.
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Guest checkout fallback — used when nobody is signed in, so there's
  // no address book to pick from.
  const [guestAddress, setGuestAddress] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    line1: "",
    city: "",
    pincode: "",
  });

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  // Once the saved addresses load, pre-select the customer's default one.
  useEffect(() => {
    if (!selectedAddressId && defaultAddress) {
      setSelectedAddressId(defaultAddress.addressId);
    }
  }, [defaultAddress, selectedAddressId]);

  // A signed-in customer with no saved addresses yet should land
  // straight on the "add new address" form instead of an empty list.
  useEffect(() => {
    if (user && !addressesLoading && addresses.length === 0) {
      setShowAddressForm(true);
    }
  }, [user, addressesLoading, addresses.length]);

  if (items.length === 0) return <Navigate to="/products" replace />;

  const selectedAddress = addresses.find((a) => a.addressId === selectedAddressId) || null;

  const handleSaveNewAddress = async (form) => {
    const res = await saveAddress(form);
    if (res.ok) {
      setShowAddressForm(false);
      setSelectedAddressId(res.address?.addressId || res.addressId || null);
    }
    return res;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");

    // Resolve the delivery address to send with the order: the saved
    // address the customer picked, or the guest form below.
    let address;
    if (user) {
      if (!selectedAddress) {
        setError("Please choose a delivery address to continue.");
        return;
      }
      address = {
        name: selectedAddress.name,
        email: user.email,
        phone: selectedAddress.phone,
        line1: [selectedAddress.line1, selectedAddress.line2].filter(Boolean).join(", "),
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
      };
    } else {
      address = guestAddress;
    }

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
        navigate("/order-success", { state: { email: address.email } });
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
            navigate("/order-success", { state: { orderId, email: address.email } });
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

      <form onSubmit={handlePay} className="mt-8 space-y-6">
        <div>
          <h2 className="font-display text-lg text-[var(--color-forest-dark)]">Delivery Address</h2>

          {user ? (
            <div className="mt-4">
              {addressesLoading && addresses.length === 0 ? (
                <p className="text-sm text-[var(--color-charcoal)]/50">Loading your saved addresses...</p>
              ) : (
                <>
                  {addresses.length > 0 && !showAddressForm && (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <AddressCard
                          key={addr.addressId}
                          address={addr}
                          selectable
                          selected={selectedAddressId === addr.addressId}
                          onSelect={() => setSelectedAddressId(addr.addressId)}
                        />
                      ))}
                    </div>
                  )}

                  {showAddressForm ? (
                    <div className="mt-4 rounded-2xl border border-[var(--color-forest)]/10 bg-white p-5">
                      <h3 className="font-display text-base text-[var(--color-forest-dark)]">
                        Add a new address
                      </h3>
                      <div className="mt-4">
                        <AddressForm
                          onSave={handleSaveNewAddress}
                          onCancel={addresses.length > 0 ? () => setShowAddressForm(false) : undefined}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-[var(--color-forest-dark)]/30 py-3 text-sm font-semibold text-[var(--color-forest-dark)]"
                    >
                      <Plus size={16} /> Add new address
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-[var(--color-charcoal)]/60">
                <Link to="/login" className="font-semibold text-[var(--color-forest-dark)] underline">
                  Sign in
                </Link>{" "}
                to checkout faster with a saved address, or fill in your details below.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <input required placeholder="Full name" value={guestAddress.name}
                  onChange={(e) => setGuestAddress({ ...guestAddress, name: e.target.value })}
                  className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
                <input required type="email" placeholder="Email" value={guestAddress.email}
                  onChange={(e) => setGuestAddress({ ...guestAddress, email: e.target.value })}
                  className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
              </div>
              <input required placeholder="Phone number" value={guestAddress.phone}
                onChange={(e) => setGuestAddress({ ...guestAddress, phone: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
              <input required placeholder="Address" value={guestAddress.line1}
                onChange={(e) => setGuestAddress({ ...guestAddress, line1: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
              <div className="grid gap-4 sm:grid-cols-2">
                <input required placeholder="City" value={guestAddress.city}
                  onChange={(e) => setGuestAddress({ ...guestAddress, city: e.target.value })}
                  className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
                <input required placeholder="Pincode" value={guestAddress.pincode}
                  onChange={(e) => setGuestAddress({ ...guestAddress, pincode: e.target.value })}
                  className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm" />
              </div>
            </div>
          )}
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
