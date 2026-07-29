import { Link } from "react-router-dom";
import { User, ShieldCheck } from "lucide-react";

export default function LoginChoice() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-5 py-16">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
          Welcome
        </p>
        <h1 className="mt-2 font-display text-3xl text-[var(--color-forest-dark)]">
          How would you like to sign in?
        </h1>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Link
          to="/login/customer"
          className="group flex flex-col items-center rounded-2xl border border-[var(--color-forest)]/15 bg-white/50 px-8 py-10 text-center transition-all hover:border-[var(--color-forest-dark)]/40 hover:shadow-lg"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-forest-dark)]/10 text-[var(--color-forest-dark)] transition-colors group-hover:bg-[var(--color-forest-dark)] group-hover:text-white">
            <User size={26} />
          </span>
          <h2 className="mt-5 font-display text-xl text-[var(--color-forest-dark)]">
            Customer Login
          </h2>
          <p className="mt-2 text-sm text-[var(--color-charcoal)]/60">
            Sign in to your account, track orders, and check out faster.
          </p>
        </Link>

        <Link
          to="/admin"
          className="group flex flex-col items-center rounded-2xl border border-[var(--color-forest)]/15 bg-white/50 px-8 py-10 text-center transition-all hover:border-[var(--color-forest-dark)]/40 hover:shadow-lg"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-forest-dark)]/10 text-[var(--color-forest-dark)] transition-colors group-hover:bg-[var(--color-forest-dark)] group-hover:text-white">
            <ShieldCheck size={26} />
          </span>
          <h2 className="mt-5 font-display text-xl text-[var(--color-forest-dark)]">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-[var(--color-charcoal)]/60">
            For the neobonn team — manage products, orders, and enquiries.
          </p>
        </Link>
      </div>
    </div>
  );
}
