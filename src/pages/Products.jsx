import { useState } from "react";
import { CATEGORIES } from "../data/products";
import { useProducts } from "../context/ProductsContext";
import ProductCard from "../components/ProductCard";
import PosterSlider from "../components/PosterSlider";
import SEO from "../components/SEO";

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-forest)]/10 bg-white/60">
      <div className="aspect-square animate-pulse bg-[var(--color-cream-deep)]" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-cream-deep)]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--color-cream-deep)]" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--color-cream-deep)]" />
      </div>
    </div>
  );
}

export default function Products() {
  const { products, loading, loadError } = useProducts();
  const [filter, setFilter] = useState("All");
  const visible =
    filter === "All" ? products : products.filter((p) => p.category === filter);

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-8">
      <SEO
        title="Shop All Products"
        description="Browse neobonn's full range — face serums, peel-off masks, natural soaps, hair oils & wellness rituals. All skin types, dermatologically approved, cruelty-free."
        path="/products"
      />
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
          The Collection
        </p>
        <h1 className="mt-2 font-display text-4xl text-[var(--color-forest-dark)]">
          All Products
        </h1>
      </div>

      {loadError && !loading && (
        <div className="mx-auto mb-8 max-w-2xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          {loadError}
        </div>
      )}

      <div className="mb-10 flex flex-wrap justify-center gap-3">
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
              filter === c
                ? "border-[var(--color-forest-dark)] bg-[var(--color-forest-dark)] text-white"
                : "border-[var(--color-forest)]/20 text-[var(--color-charcoal)]/70 hover:border-[var(--color-forest-dark)]/50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-[var(--color-charcoal)]/50">
          No products in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <PosterSlider />
    </div>
  );
}
