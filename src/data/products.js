// Central product catalog.
// The Admin Panel edits this same shape of data (persisted to Google Sheets
// in production — see /google-apps-script/Code.gs and src/lib/sheets.js).

export const CATEGORIES = ["Face", "Body", "Coming Soon"];

export const products = [
  {
    id: "instant-brightening-milk-serum",
    name: "Instant Brightening Milk Serum",
    tagline: "Discover the Power of Luminous, Even-Toned Skin",
    category: "Face",
    price: 599,
    comingSoon: false,
    dermatologicallyApproved: true,
    image: "/products/instant-brightening-milk-serum.png",
    shortDescription:
      "A brightening serum that deeply purifies, targets stubborn pigmentation, and restores hydration for a confident glow.",
    description:
      "Tired of dullness? Neobonn's Instant Brightening Milk Serum is built around a powerful glutathione & alpha-arbutin brightening complex, paired with hydrolyzed milk protein for hydration and tone. Used daily, it deeply purifies, targets stubborn pigmentation, and restores hydration — revealing luminous, even-toned skin. Suitable for all skin types.",
    ingredients: [
      "Hydrolyzed Milk Protein (Hydration & Tone)",
      "Glutathione & \u03b1-Arbutin (Powerful Brightening Complex)",
      "Vitamin Complex — C, E, B3, Pro-V B5 (Radiance & Repair)",
    ],
    specifications: {
      "Skin Type": "All skin types",
      "Volume": "30ml",
      "Shelf Life": "12 months",
      "Dermatologically Approved": "Yes",
    },
  },
  {
    id: "hydrating-cleanser",
    name: "Hydrating Cleanser",
    tagline: "Gentle daily cleanse, without stripping moisture",
    category: "Face",
    price: 399,
    comingSoon: false,
    dermatologicallyApproved: true,
    image: "/products/hydrating-cleanser.png",
    shortDescription:
      "A soothing, balancing daily cleanser built on White Water Lily Extract and Niacinamide.",
    description:
      "Part of the Neobonn Wellness Journey, this Hydrating Cleanser deeply cleanses without harshness. White Water Lily Extract soothes and balances the skin barrier while Niacinamide supports skin tone, leaving your face clean, calm, and ready for the rest of your routine — no tightness, no stripping.",
    ingredients: [
      "White Water Lily Extract (Soothing & Balancing)",
      "Niacinamide (Skin Barrier & Tone)",
      "Glycerin & Betaine (Deep Hydration)",
    ],
    specifications: {
      "Skin Type": "All skin types",
      "Volume": "100ml",
      "Shelf Life": "18 months",
      "Dermatologically Approved": "Yes",
    },
  },
  {
    id: "radiance-serum",
    name: "Radiance Serum",
    tagline: "Unveiling Neobonn: Your Complete Wellness Journey",
    category: "Face",
    price: 649,
    comingSoon: false,
    dermatologicallyApproved: true,
    image: "/products/radiance-serum.png",
    shortDescription:
      "Infuses collagen and deep hydration for a radiant, confident glow without harshness.",
    description:
      "Our Radiance Serum infuses collagen and deep hydration to say goodbye to stubborn breakouts without sacrificing your skin barrier. Formulated with Niacinamide for barrier support and tone, plus Glycerin & Betaine for lasting hydration — purifies deep and restores a confident, radiant glow.",
    ingredients: [
      "Niacinamide (Skin Barrier & Tone)",
      "White Water Lily Extract (Soothing & Balancing)",
      "Glycerin & Betaine (Deep Hydration)",
    ],
    specifications: {
      "Skin Type": "All skin types",
      "Volume": "30ml",
      "Shelf Life": "12 months",
      "Dermatologically Approved": "Yes",
    },
  },
  {
    id: "peel-off-collagen-algine-face-mask",
    name: "Peel-Off Collagen & Algine Face Mask",
    tagline: "Mind, Body, Spirit — Hydration Balance",
    category: "Face",
    price: 549,
    comingSoon: false,
    dermatologicallyApproved: true,
    image: "/products/peel-off-collagen-algine-face-mask.png",
    shortDescription:
      "A peel-off ritual mask that firms, purifies pores, and gently brightens.",
    description:
      "Tired of dullness? This Peel-Off Collagen & Algine Face Mask deeply cleanses, infuses collagen, and reveals a radiant, confident glow without harshness. Diatomaceous Earth & Algin purify pores and deliver minerals, Hydrolyzed Collagen firms and hydrates, while Titanium Dioxide & CI 19140 offer gentle brightening — a daily ritual of self-care built on pure, natural botanicals.",
    ingredients: [
      "Diatomaceous Earth & Algin (Pore Purifying & Mineral Rich)",
      "Hydrolyzed Collagen (Firming & Hydrating)",
      "Titanium Dioxide & CI 19140 (Gentle Brightening)",
      "Algine & Collagen Complex",
    ],
    specifications: {
      "Skin Type": "All skin types",
      "Weight": "50g",
      "Shelf Life": "18 months",
      "Dermatologically Approved": "Yes",
    },
  },
  {
    id: "neobonn-lip-balm",
    name: "Neobonn Lip Balm",
    tagline: "Hydration · Protection · Natural Tint",
    category: "Face",
    price: 249,
    comingSoon: false,
    dermatologicallyApproved: true,
    image: "/products/neobonn-lip-balm.png",
    shortDescription:
      "Bee wax and shea butter nourishment with a soft, natural tint.",
    description:
      "Reveal the glow of Neobonn on your lips too. This balm blends Bee Wax and Shea Butter for deep nourishment, White Water Lily Extract to soothe, and a Niacinamide & Vitamin Complex (C, E, B3, Pro-V B5) to protect — all wrapped in a soft, natural tint. Natural ingredients, pure care.",
    ingredients: [
      "Bee Wax & Shea Butter (Deep Nourishment)",
      "White Water Lily Extract (Soothing & Balancing)",
      "Niacinamide & Vitamin Complex — C, E, B3, Pro-V B5",
    ],
    specifications: {
      "Skin Type": "All skin types",
      "Weight": "10g",
      "Shelf Life": "18 months",
      "Dermatologically Approved": "Yes",
    },
  },
  {
    id: "vitamin-c-face-serum",
    name: "Vitamin C Face Serum",
    tagline: "Brightening. Coming soon.",
    category: "Coming Soon",
    price: null,
    comingSoon: true,
    dermatologicallyApproved: true,
    image: "/products/vitamin-c-serum.png",
    shortDescription:
      "A lightweight, cold-pressed vitamin C serum to even tone and add glow. Launching soon.",
    description:
      "Our Vitamin C Face Serum is currently in final formulation. Made with cold-pressed botanicals and stabilised vitamin C, it is designed to brighten dull skin, soften fine lines, and even out tone — without synthetic fragrance. Join the waitlist to be notified the moment it launches.",
    ingredients: ["Vitamin C (stabilised)", "Aloe vera", "Vitamin E", "Hyaluronic acid"],
    specifications: {
      "Skin Type": "All skin types",
      "Volume": "30ml (planned)",
      "Shelf Life": "12 months",
      "Dermatologically Approved": "Yes",
    },
  },
  {
    id: "multani-mitti-soap",
    name: "Multani Mitti Soap",
    tagline: "Natural face & body soap",
    category: "Body",
    price: 249,
    comingSoon: false,
    dermatologicallyApproved: true,
    image: "/products/multani-mitti.png",
    shortDescription:
      "Fuller's earth soap that draws out oil and impurities for a matte, clean finish.",
    description:
      "Handcrafted with pure Multani Mitti (Fuller's Earth), this soap gently absorbs excess oil, tightens pores, and leaves skin feeling clean without stripping natural moisture. Ideal for oily and combination skin, face and body both.",
    ingredients: ["Multani Mitti", "Coconut oil base", "Rose water", "Glycerin"],
    specifications: {
      "Skin Type": "Oily / Combination",
      "Weight": "100g",
      "Shelf Life": "18 months",
      "Dermatologically Approved": "Yes",
    },
  },
  {
    id: "aloevera-lemongrass-soap",
    name: "Aloevera & Lemongrass Soap",
    tagline: "Natural face & body soap",
    category: "Body",
    price: 249,
    comingSoon: false,
    dermatologicallyApproved: true,
    image: "/products/aloevera-lemongrass.png",
    shortDescription:
      "Cooling aloe vera paired with fresh lemongrass to soothe and refresh skin daily.",
    description:
      "A calming blend of pure aloe vera gel and lemongrass essential oil. Soothes irritation, hydrates, and leaves behind a fresh citrus-herbal scent. Suits sensitive and normal skin types, for daily face and body use.",
    ingredients: ["Aloe vera gel", "Lemongrass oil", "Coconut oil base", "Vitamin E"],
    specifications: {
      "Skin Type": "Sensitive / Normal",
      "Weight": "100g",
      "Shelf Life": "18 months",
      "Dermatologically Approved": "Yes",
    },
  },
  {
    id: "charcoal-black-oud-soap",
    name: "Charcoal & Black Oud Soap",
    tagline: "Natural face & body soap",
    category: "Body",
    price: 279,
    comingSoon: false,
    dermatologicallyApproved: true,
    image: "/products/charcoal-black-oud.png",
    shortDescription:
      "Activated charcoal detox with a rich, smoky oud fragrance.",
    description:
      "Activated charcoal draws out deep-set impurities and excess oil, while black oud lends a warm, luxurious scent that lingers. A detoxifying bar for city-tired skin, face and body both.",
    ingredients: ["Activated charcoal", "Black oud oil", "Coconut oil base", "Shea butter"],
    specifications: {
      "Skin Type": "Oily / Normal",
      "Weight": "100g",
      "Shelf Life": "18 months",
      "Dermatologically Approved": "Yes",
    },
  },
  {
    id: "papaya-way-soap",
    name: "Papaya Way Soap",
    tagline: "Natural face & body soap",
    category: "Body",
    price: 249,
    comingSoon: false,
    dermatologicallyApproved: true,
    image: "/products/papaya-way.png",
    shortDescription:
      "Papaya-enzyme soap that gently exfoliates for brighter, even-toned skin.",
    description:
      "Natural papaya enzymes gently exfoliate dead skin cells, helping reveal brighter, more even-toned skin over time. A gentle everyday bar for face and body.",
    ingredients: ["Papaya extract", "Coconut oil base", "Honey", "Vitamin E"],
    specifications: {
      "Skin Type": "All skin types",
      "Weight": "100g",
      "Shelf Life": "18 months",
      "Dermatologically Approved": "Yes",
    },
  },
];

export const getProductById = (id) => products.find((p) => p.id === id);
