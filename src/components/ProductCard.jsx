import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-[var(--color-forest)]/10 bg-white/60 transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-[var(--color-cream-deep)]">
        <img
          src={product.image}
          alt={product.name}
          onError={(e) => (e.currentTarget.style.opacity = 0)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.comingSoon && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-forest-dark)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            Coming Soon
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg text-[var(--color-forest-dark)]">{product.name}</h3>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/60">{product.tagline}</p>

        {product.dermatologicallyApproved && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-forest)]">
            <ShieldCheck size={13} className="text-[var(--color-gold)]" />
            Dermatologically Approved
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold text-[var(--color-charcoal)]">
            {product.comingSoon ? "Notify Me" : `₹${product.price}`}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-gold)] opacity-0 transition-opacity group-hover:opacity-100">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
