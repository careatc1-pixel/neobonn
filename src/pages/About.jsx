import { COMPANY } from "../data/company";
import SEO from "../components/SEO";

export default function About() {
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-20 md:px-8">
      <SEO
        title="Our Story"
        description={`Learn about ${COMPANY.brand}'s wellness philosophy — natural botanicals, pure ingredients, and a daily ritual of self-care.`}
        path="/about"
      />
      <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
        Our Story
      </p>
      <h1 className="mt-2 text-center font-display text-4xl text-[var(--color-forest-dark)]">
        Why {COMPANY.brand}?
      </h1>

      <div className="mt-10 space-y-6 text-[var(--color-charcoal)]/75">
        <p>
          {COMPANY.brand} was born from a simple belief — skincare should be
          as gentle and honest as it was meant to be, before shelves filled
          up with synthetic shortcuts. Every bar we make at {COMPANY.legalName}{" "}
          is handcrafted in small batches using real botanicals: multani
          mitti, aloe vera, activated charcoal, papaya, and more — nothing
          hidden behind an ingredient list you can't pronounce.
        </p>
        <p>
          Our name carries that promise — newborn-soft skin, at any age. We're
          currently expanding beyond soap into face care, starting with our
          upcoming Vitamin C Face Serum.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {[
          { title: "Sourced Honestly", body: "Real botanical ingredients, clearly listed." },
          { title: "Handmade Batches", body: "Small-batch crafted, never mass-produced." },
          { title: "Made in India", body: "Proudly formulated and packed in New Delhi." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-[var(--color-forest)]/10 p-6">
            <h3 className="font-display text-lg text-[var(--color-forest-dark)]">{item.title}</h3>
            <p className="mt-2 text-sm text-[var(--color-charcoal)]/60">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
