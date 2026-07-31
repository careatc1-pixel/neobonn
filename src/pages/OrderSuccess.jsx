import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function OrderSuccess() {
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
      <Link to="/products" className="mt-8 inline-block rounded-full bg-[var(--color-forest-dark)] px-8 py-3 text-sm font-semibold text-white">
        Continue Shopping
      </Link>
    </div>
  );
}
