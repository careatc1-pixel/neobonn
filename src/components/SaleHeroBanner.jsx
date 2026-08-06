import { Link } from "react-router-dom";
import { Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { useCampaign } from "../context/CampaignContext";

// Big seasonal banner for the top of the homepage — fully driven by
// whichever campaign is Active in Admin -> Banners & Offers. Renders
// nothing at all if no campaign is live, so the homepage never
// advertises a sale that isn't real.
export default function SaleHeroBanner() {
  const { campaign } = useCampaign();
  if (!campaign) return null;

  const { heroImage, heroTitle, heroSubtitle, discountPercent, ctaLink, name } = campaign;

  // A custom banner graphic (pasted by the admin) fully replaces the
  // built-in design — simplest path for someone who already designs
  // their own promo graphics (Canva, Photoshop, etc.).
  if (heroImage) {
    return (
      <section className="mx-auto max-w-[1600px] px-5 pt-6 md:px-8 md:pt-10">
        <Link
          to={ctaLink || "/products"}
          className="block overflow-hidden rounded-3xl shadow-xl shadow-black/10 transition-transform hover:scale-[1.005]"
        >
          <img
            src={heroImage}
            alt={heroTitle || name || "Current offer"}
            className="h-auto w-full object-cover"
            loading="eager"
          />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1600px] px-5 pt-6 md:px-8 md:pt-10">
      <div className="relative overflow-hidden rounded-3xl bg-[var(--color-forest-dark)] shadow-xl shadow-black/10">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-[var(--color-gold)]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-[var(--color-forest)]/40 blur-3xl" />

        {/* Botanical branch flourish — a quiet, premium signature motif
            (soft gilded leaves) rather than a busy line-scribble */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1000 500"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="neobonnLeafGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-gold-light)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id="neobonnLeafCream" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-cream)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-cream)" stopOpacity="0.06" />
            </linearGradient>
            <path id="neobonnLeaf" d="M0,0 C9,-16 27,-16 36,0 C27,16 9,16 0,0 Z" />
            <g id="neobonnLeafVein">
              <use href="#neobonnLeaf" />
              <path d="M2,0 L34,0" stroke="var(--color-forest-dark)" strokeOpacity="0.25" strokeWidth="1" fill="none" />
            </g>
          </defs>

          {/* top-right sprig */}
          <g>
            <path
              d="M 1000,4 C 945,32 902,82 862,146"
              stroke="var(--color-cream)"
              strokeOpacity="0.22"
              fill="none"
              strokeWidth="1.5"
            />
            <use href="#neobonnLeafVein" fill="url(#neobonnLeafGold)" transform="translate(953,20) rotate(112)" />
            <use href="#neobonnLeafVein" fill="url(#neobonnLeafCream)" transform="translate(921,52) rotate(98) scale(0.85)" />
            <use href="#neobonnLeafVein" fill="url(#neobonnLeafGold)" transform="translate(892,88) rotate(120) scale(0.7)" />
            <use href="#neobonnLeafVein" fill="url(#neobonnLeafCream)" transform="translate(869,128) rotate(104) scale(0.55)" />
          </g>

          {/* bottom-left sprig, smaller — echoes the top-right one */}
          <g>
            <path
              d="M 0,500 C 52,472 88,432 122,384"
              stroke="var(--color-cream)"
              strokeOpacity="0.18"
              fill="none"
              strokeWidth="1.3"
            />
            <use href="#neobonnLeafVein" fill="url(#neobonnLeafCream)" transform="translate(38,480) rotate(-66) scale(0.6)" />
            <use href="#neobonnLeafVein" fill="url(#neobonnLeafGold)" transform="translate(68,452) rotate(-82) scale(0.48)" />
            <use href="#neobonnLeafVein" fill="url(#neobonnLeafCream)" transform="translate(98,417) rotate(-70) scale(0.38)" />
          </g>
        </svg>

        <div className="relative grid gap-10 px-6 py-12 sm:px-10 sm:py-14 md:grid-cols-2 md:items-center md:gap-8 md:py-20">
          {/* Copy */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold-light)]">
              {name || "Limited Time"}
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.08] text-white sm:text-5xl md:text-[3.2rem]">
              {heroTitle || name || "A special offer, just for you"}
            </h1>
            {heroSubtitle && (
              <p className="mt-5 max-w-md text-white/70">{heroSubtitle}</p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={ctaLink || "/products"}
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
              src="/products/multani-mitti.jpg"
              alt="Multani Mitti Soap"
              className="absolute left-2 top-6 h-32 w-32 -rotate-6 rounded-2xl border-4 border-white object-cover shadow-2xl sm:h-40 sm:w-40 md:h-48 md:w-48"
              loading="lazy"
            />
            <img
              src="/products/radiance-serum.jpg"
              alt="Radiance Serum"
              className="absolute right-4 top-0 h-28 w-28 rotate-6 rounded-2xl border-4 border-white object-cover shadow-2xl sm:h-36 sm:w-36 md:h-44 md:w-44"
              loading="lazy"
            />
            <img
              src="/products/neobonn-lip-balm.jpg"
              alt="Neobonn Lip Balm"
              className="absolute bottom-2 left-1/2 h-24 w-24 -translate-x-1/2 rotate-3 rounded-2xl border-4 border-white object-cover shadow-2xl sm:h-32 sm:w-32 md:h-36 md:w-36"
              loading="lazy"
            />

            {/* Wax-seal style discount badge — only shown when this
                campaign actually carries a discount; a campaign can
                also just be an announcement (0% off) */}
            {discountPercent > 0 && (
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
                  <span className="font-display text-2xl leading-none">{discountPercent}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest">Off</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
