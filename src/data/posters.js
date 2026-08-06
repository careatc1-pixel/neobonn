// Content for the "Product Range" poster slider on the Products page.
// Each entry pairs a hero poster image with the ingredient story printed on it,
// so the slide is fully accessible (not just a flat image) and can link to the
// matching product in the catalogue.

export const posterSlides = [
  {
    id: "milk-serum",
    image: "/posters/poster-milk-serum.jpg",
    eyebrow: "Skin Care & Wellness",
    title: "Instant Brightening Milk Serum",
    tagline: "Discover the Power of Luminous, Even-Toned Skin",
    description:
      "Tired of dullness? Our complex deeply purifies, targets stubborn pigmentation, and restores hydration for a confident glow.",
    ingredients: [
      { name: "Hydrolyzed Milk Protein", benefit: "Hydration & Tone" },
      { name: "Glutathione & \u03b1-Arbutin", benefit: "Powerful Brightening Complex" },
      { name: "Vitamin Complex (C, E, B3, Pro-V B5)", benefit: "Radiance & Repair" },
    ],
    ctaLabel: "Know the Product",
    ctaLink: "/products/instant-brightening-milk-serum",
  },
  {
    id: "radiance-serum",
    image: "/posters/poster-radiance-serum.jpg",
    eyebrow: "Skin Care & Wellness",
    title: "Radiance Serum & Hydrating Cleanser",
    tagline: "Unveiling Neobonn: Your Complete Wellness Journey",
    description:
      "Our formulation deeply cleanses, infuses collagen, and reveals a radiant, confident glow without harshness.",
    ingredients: [
      { name: "White Water Lily Extract", benefit: "Soothing & Balancing" },
      { name: "Niacinamide", benefit: "Skin Barrier & Tone" },
      { name: "Glycerin & Betaine", benefit: "Deep Hydration" },
    ],
    ctaLabel: "Know the Product",
    ctaLink: "/products/radiance-serum",
  },
  {
    id: "peel-off-mask",
    image: "/posters/poster-peel-off-mask.jpg",
    eyebrow: "Wellness Ritual",
    title: "Peel-Off Collagen & Algine Face Mask",
    tagline: "Mind, Body, Spirit \u2014 Hydration Balance",
    description:
      "Tired of dullness? Our formulation deeply cleanses, infuses collagen, and reveals a radiant, confident glow without harshness.",
    ingredients: [
      { name: "Diatomaceous Earth & Algin", benefit: "Pore Purifying & Mineral Rich" },
      { name: "Hydrolyzed Collagen", benefit: "Firming & Hydrating" },
      { name: "Titanium Dioxide & CI 19140", benefit: "Gentle Brightening" },
    ],
    ctaLabel: "Know the Product",
    ctaLink: "/products/peel-off-collagen-algine-face-mask",
  },
  {
    id: "lip-balm",
    image: "/posters/poster-lip-balm.jpg",
    eyebrow: "Natural Ingredients. Pure Care.",
    title: "Neobonn Lip Balm",
    tagline: "Hydration \u00b7 Protection \u00b7 Natural Tint",
    description:
      "Unveiling Neobonn: Your Complete Wellness Journey \u2014 nourishing lips with nature's richest butters and botanicals.",
    ingredients: [
      { name: "Bee Wax & Shea Butter", benefit: "Deep Nourishment" },
      { name: "White Water Lily Extract", benefit: "Soothing & Balancing" },
      { name: "Niacinamide & Vitamin Complex", benefit: "C, E, B3, Pro-V B5" },
    ],
    ctaLabel: "Know the Product",
    ctaLink: "/products/neobonn-lip-balm",
  },
  {
    id: "brand-banner",
    image: "/posters/poster-brand-banner.jpg",
    eyebrow: "Skin Care & Wellness Brand",
    title: "The Complete Neobonn Wellness Journey",
    tagline: "A deliberate balance of nature and science",
    description:
      "Say goodbye to stubborn breakouts without sacrificing your skin barrier. Our formulation purifies deep and restores hydration for a confident glow. Suitable for all skin types.",
    ingredients: [],
    ctaLabel: "Explore All Products",
    ctaLink: "/products",
  },
];
