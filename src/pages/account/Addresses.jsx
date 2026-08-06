import { Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import SEO from "../../components/SEO";
import AddressBook from "../../components/AddressBook";

// Its own route (/account/addresses) — a real page navigation from the
// "Addresses" quick-action card, not a same-page scroll.
export default function AccountAddresses() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8">
      <SEO title="Saved Addresses" path="/account/addresses" noindex />

      <Link
        to="/account"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-forest-dark)]"
      >
        <ArrowLeft size={16} /> Back to Account
      </Link>

      <h1 className="mt-4 font-display text-2xl text-[var(--color-forest-dark)]">Saved Addresses</h1>
      <p className="mt-1 text-xs text-[var(--color-charcoal)]/50">
        Save multiple delivery addresses and pick one at checkout — or tap "Use my current
        location" to fill one in automatically.
      </p>

      <div className="mt-6">
        <AddressBook />
      </div>
    </div>
  );
}
