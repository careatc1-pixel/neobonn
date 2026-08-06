import { Link, useLocation } from "react-router-dom";
import SEO from "../components/SEO";

export default function OrderSuccess() {
  const { state } = useLocation();
  const { orderId, email, cod, codAmountDue } = state || {};

  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <SEO title="Order Placed" path="/order-success" noindex />
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-forest)]/10 text-3xl">
        🌿
      </div>
      <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">
        Order Placed!
      </h1>
      <p className="mt-3 text-[var(--color-charcoal)]/70">
        Thank you for shopping with neobonn. A confirmation has been sent
        to your email, and your bill has been recorded in our system.
      </p>
      {orderId && (
        <p className="mt-2 font-mono text-xs text-[var(--color-charcoal)]/50">{orderId}</p>
      )}
      {cod && codAmountDue > 0 && (
        <p className="mt-4 rounded-xl bg-[var(--color-forest-dark)]/5 px-4 py-3 text-sm font-medium text-[var(--color-forest-dark)]">
          Please keep ₹{codAmountDue} ready in cash for our delivery agent.
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/products" className="inline-block rounded-full bg-[var(--color-forest-dark)] px-8 py-3 text-sm font-semibold text-white">
          Continue Shopping
        </Link>
        <Link
          to={orderId && email ? `/track-order?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}` : "/track-order"}
          className="inline-block rounded-full border border-[var(--color-forest-dark)]/30 px-8 py-3 text-sm font-semibold text-[var(--color-forest-dark)]"
        >
          Track Order
        </Link>
      </div>
    </div>
  );
}
