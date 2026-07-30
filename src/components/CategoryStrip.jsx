import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";

const categories = [
  {
    label: "Face Serums",
    image: "/products/instant-brightening-milk-serum.jpg",
    to: "/products/instant-brightening-milk-serum",
  },
  {
    label: "Face Masks",
    image: "/products/peel-off-collagen-algine-face-mask.jpg",
    to: "/products/peel-off-collagen-algine-face-mask",
  },
  {
    label: "Lip Care",
    image: "/products/neobonn-lip-balm.jpg",
    to: "/products/neobonn-lip-balm",
  },
  {
    label: "Body Soaps",
    image: "/products/multani-mitti.jpg",
    to: "/products",
  },
  {
    label: "New Launches",
    image: "/products/vitamin-c-serum.jpg",
    to: "/products/vitamin-c-face-serum",
  },
];

// Circular category strip, sitting just under the sale hero — new section only.
export default function CategoryStrip() {
  return (
    <section id="shop-by-category" className="mx-auto max-w-[1600px] px-5 py-10 md:px-8 md:py-14">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
        Shop by Category
      </p>
      <h2 className="mt-2 text-center font-display text-2xl text-[var(--color-forest-dark)] md:text-3xl">
        Find Your Ritual
      </h2>

      <div className="mt-8 flex gap-6 overflow-x-auto px-1 pb-2 sm:justify-center sm:overflow-visible sm:px-0">
        {categories.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="group flex shrink-0 flex-col items-center gap-3 text-center"
          >
            <span className="block h-20 w-20 overflow-hidden rounded-full border-2 border-[var(--color-gold)]/60 bg-[var(--color-cream-deep)] shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:border-[var(--color-gold)] sm:h-24 sm:w-24">
              <img
                src={c.image}
                alt={c.label}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </span>
            <span className="max-w-[6rem] text-xs font-semibold text-[var(--color-charcoal)]/80 sm:text-sm">
              {c.label}
            </span>
          </Link>
        ))}

        <Link
          to="/products"
          className="group flex shrink-0 flex-col items-center gap-3 text-center"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[var(--color-forest)]/40 bg-white text-[var(--color-forest-dark)] transition-transform duration-300 group-hover:scale-105 group-hover:border-[var(--color-forest)] sm:h-24 sm:w-24">
            <LayoutGrid size={24} />
          </span>
          <span className="max-w-[6rem] text-xs font-semibold text-[var(--color-charcoal)]/80 sm:text-sm">
            Shop All
          </span>
        </Link>
      </div>
    </section>
  );
}
