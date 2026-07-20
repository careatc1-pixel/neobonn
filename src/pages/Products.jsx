import { useState } from "react";
import { products, CATEGORIES } from "../data/products";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [filter, setFilter] = useState("All");
  const visible =
    filter === "All" ? products : products.filter((p) => p.category === filter);

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
          The Collection
        </p>
        <h1 className="mt-2 font-display text-4xl text-[var(--color-forest-dark)]">
          All Products
        </h1>
      </div>

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

      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
