import { Link } from "react-router-dom";
import { Leaf, ShieldCheck, Sparkles } from "lucide-react";

// Big seasonal sale banner for the top of the homepage.
// New section only — does not touch or replace the existing brand Hero below it.
export default function SaleHeroBanner() {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-6 md:px-8 md:pt-10">
      <div className="relative overflow-hidden rounded-3xl bg-[var(--color-forest-dark)] shadow-xl shadow-black/10">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-[var(--color-gold)]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-[var(--color-forest)]/40 blur-3xl" />

        {/* Botanical line-art corner flourish */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
          viewBox="0 0 1000 500"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <g stroke="var(--color-cream)" fill="none" strokeWidth="1.2">
            <path d="M960,40 C930,90 940,140 900,190 C930,150 950,110 960,40 Z" />
            <path d="M905,60 C880,100 885,140 855,175" />
            <path d="M935,75 C910,105 915,130 890,155" />
            <path d="M40,470 C80,420 70,370 110,320 C80,360 55,405 40,470 Z" />
            <path d="M95,450 C120,410 115,375 145,340" />
            <path d="M65,435 C90,400 88,370 115,345" />
          </g>
        </svg>

        <div className="relative grid gap-10 px-6 py-12 sm:px-10 sm:py-14 md:grid-cols-2 md:items-center md:gap-8 md:py-20">
          {/* Copy */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold-light)]">
              Limited Time · This Week Only
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.08] text-white sm:text-5xl md:text-[3.2rem]">
              The Monsoon
              <br />
              Botanical <span className="text-[var(--color-gold-light)]">Sale</span>
            </h1>
            <p className="mt-5 max-w-md text-white/70">
              Flat 40% off every handcrafted soap, serum &amp; ritual — real
              botanicals, no harsh chemicals, no shortcuts.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/products"
                className="rounded-full bg-[var(--color-gold)] px-8 py-3 text-sm font-semibold text-[var(--color-forest-dark)] transition-transform hover:scale-[1.03]"
              >
                Shop the Sale
              </Link>
              <a
                href="#shop-by-category"
                className="rounded-full border border-white/25 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Browse Categories
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6">
              {[
                { icon: Leaf, label: "100% Natural" },
                { icon: ShieldCheck, label: "Dermat Approved" },
                { icon: Sparkles, label: "Small-Batch Made" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/60"
                >
                  <Icon size={14} className="text-[var(--color-gold-light)]" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Product collage + wax-seal discount badge */}
          <div className="relative mx-auto flex h-64 w-full max-w-sm items-center justify-center sm:h-80 md:h-96 md:max-w-none">
            <img
              src="/products/multani-mitti.png"
              alt="Multani Mitti Soap"
              className="absolute left-2 top-6 h-32 w-32 -rotate-6 rounded-2xl border-4 border-white object-cover shadow-2xl sm:h-40 sm:w-40 md:h-48 md:w-48"
              loading="lazy"
            />
            <img
              src="/products/radiance-serum.png"
              alt="Radiance Serum"
              className="absolute right-4 top-0 h-28 w-28 rotate-6 rounded-2xl border-4 border-white object-cover shadow-2xl sm:h-36 sm:w-36 md:h-44 md:w-44"
              loading="lazy"
            />
            <img
              src="/products/neobonn-lip-balm.png"
              alt="Neobonn Lip Balm"
              className="absolute bottom-2 left-1/2 h-24 w-24 -translate-x-1/2 rotate-3 rounded-2xl border-4 border-white object-cover shadow-2xl sm:h-32 sm:w-32 md:h-36 md:w-36"
              loading="lazy"
            />

            {/* Wax-seal style discount badge */}
            <div className="absolute -right-2 bottom-0 -rotate-[10deg] sm:right-2 md:-right-4">
              <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
                <circle
                  cx="56"
                  cy="56"
                  r="52"
                  fill="var(--color-gold)"
                  stroke="var(--color-gold-light)"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                <circle cx="56" cy="56" r="44" fill="none" stroke="var(--color-forest-dark)" strokeWidth="1" opacity="0.35" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[var(--color-forest-dark)]">
                <span className="text-[10px] font-bold uppercase tracking-widest">Flat</span>
                <span className="font-display text-2xl leading-none">40%</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">Off</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
