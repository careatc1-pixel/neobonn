import { Link } from "react-router-dom";
import { useInView } from "../hooks/useInView";

const SLIDES = [
  {
    image: "/marketing/showcase-1.jpg",
    alt: "neobonn Anti-Acne Face Wash — with salicylic acid, alpha-arbutin, and willow bark",
  },
  {
    image: "/marketing/showcase-2.jpg",
    alt: "Unveiling neobonn — Your Complete Wellness Journey across face, body, and supplements",
  },
  {
    image: "/marketing/showcase-3.jpg",
    alt: "neobonn Peel-Off Collagen & Algine Face Mask with hydrolyzed collagen",
  },
  {
    image: "/marketing/showcase-4.jpg",
    alt: "neobonn Lip Balm with shea butter, beeswax, and SPF 30",
  },
  {
    image: "/marketing/showcase-5.jpg",
    alt: "neobonn Instant Brightening Milk Serum with glutathione and alpha-arbutin",
  },
];

function ShowcaseSlide({ slide, index }) {
  const [ref, inView] = useInView(0.15);
  const fromLeft = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-2xl border border-[var(--color-forest)]/10 shadow-sm transition-all duration-700 ease-out ${
        inView
          ? "translate-x-0 translate-y-0 opacity-100"
          : `opacity-0 ${fromLeft ? "-translate-x-8" : "translate-x-8"} translate-y-4`
      }`}
    >
      <img
        src={slide.image}
        alt={slide.alt}
        loading="lazy"
        className="w-full h-auto object-cover"
      />
    </div>
  );
}

export default function ProductShowcase() {
  return (
    <section className="bg-[var(--color-cream-deep)] py-20">
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
            Discover neobonn
          </p>
          <h2 className="mt-2 font-display text-3xl text-[var(--color-forest-dark)] md:text-4xl">
            Formulated With Purpose, Made With Care
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-charcoal)]/60">
            Every neobonn formula is built around real, named ingredients —
            no filler, no guesswork. Scroll through our range below.
          </p>
        </div>

        <div className="flex flex-col gap-10 md:gap-14">
          {SLIDES.map((slide, i) => (
            <ShowcaseSlide key={slide.image} slide={slide} index={i} />
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            to="/products"
            className="inline-block rounded-full bg-[var(--color-forest-dark)] px-10 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            Explore Our Complete Collection
          </Link>
        </div>
      </div>
    </section>
  );
}
