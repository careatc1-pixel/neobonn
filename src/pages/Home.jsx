import { Link } from "react-router-dom";
import { Leaf, Sparkles, ShieldCheck } from "lucide-react";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-20 pt-16 md:px-8 md:pt-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
              Atharv Luxe Co. presents
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] text-[var(--color-forest-dark)] md:text-6xl">
              Beauty, the way
              <br /> nature intended.
            </h1>
            <p className="mt-6 max-w-md text-[var(--color-charcoal)]/70">
              Handcrafted face &amp; body soaps made with real botanicals — no
              harsh chemicals, no shortcuts. Just clean, honest ingredients
              for newborn-soft skin.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="rounded-full bg-[var(--color-forest-dark)] px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
              >
                Shop Now
              </Link>
              <Link
                to="/about"
                className="rounded-full border border-[var(--color-forest-dark)]/30 px-8 py-3 text-sm font-semibold text-[var(--color-forest-dark)] transition-colors hover:bg-[var(--color-forest-dark)]/5"
              >
                Our Story
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute h-72 w-72 rounded-full bg-[var(--color-gold-light)]/30 blur-3xl md:h-96 md:w-96" />
            <video
              className="relative w-full max-w-md rounded-2xl md:max-w-lg"
              src="/videos/hero-logo.mp4"
              autoPlay
              loop
              muted
              playsInline
              aria-label="neobonn brand animation"
            />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[var(--color-forest)]/10 bg-[var(--color-cream-deep)] px-5 py-8 md:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 text-center sm:grid-cols-3">
          {[
            { icon: Leaf, label: "100% Natural Ingredients" },
            { icon: ShieldCheck, label: "Dermatologically Mindful" },
            { icon: Sparkles, label: "Handcrafted in Small Batches" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="text-[var(--color-forest)]" size={26} />
              <span className="text-sm font-medium text-[var(--color-charcoal)]/80">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
              Bestsellers
            </p>
            <h2 className="mt-2 font-display text-3xl text-[var(--color-forest-dark)]">
              Shop the Collection
            </h2>
          </div>
          <Link to="/products" className="hidden text-sm font-semibold text-[var(--color-forest-dark)] sm:block">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
