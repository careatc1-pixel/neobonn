// Central product catalog.
// The Admin Panel edits this same shape of data (persisted to Google Sheets
// in production — see /google-apps-script/Code.gs and src/lib/sheets.js).

export const CATEGORIES = ["Face", "Body", "Coming Soon"];

export const products = [
  {
    id: "vitamin-c-face-serum",
    name: "Vitamin C Face Serum",
    tagline: "Brightening. Coming soon.",
    category: "Coming Soon",
    price: null,
    comingSoon: true,
    image: "/products/vitamin-c-serum.jpg",
    shortDescription:
      "A lightweight, cold-pressed vitamin C serum to even tone and add glow. Launching soon.",
    description:
      "Our Vitamin C Face Serum is currently in final formulation. Made with cold-pressed botanicals and stabilised vitamin C, it is designed to brighten dull skin, soften fine lines, and even out tone — without synthetic fragrance. Join the waitlist to be notified the moment it launches.",
    ingredients: ["Vitamin C (stabilised)", "Aloe vera", "Vitamin E", "Hyaluronic acid"],
    specifications: {
      "Skin Type": "All skin types",
      "Volume": "30ml (planned)",
      "Shelf Life": "12 months",
    },
  },
  {
    id: "multani-mitti-soap",
    name: "Multani Mitti Soap",
    tagline: "Natural face & body soap",
    category: "Body",
    price: 249,
    comingSoon: false,
    image: "/products/multani-mitti.jpg",
    shortDescription:
      "Fuller's earth soap that draws out oil and impurities for a matte, clean finish.",
    description:
      "Handcrafted with pure Multani Mitti (Fuller's Earth), this soap gently absorbs excess oil, tightens pores, and leaves skin feeling clean without stripping natural moisture. Ideal for oily and combination skin, face and body both.",
    ingredients: ["Multani Mitti", "Coconut oil base", "Rose water", "Glycerin"],
    specifications: {
      "Skin Type": "Oily / Combination",
      "Weight": "100g",
      "Shelf Life": "18 months",
    },
  },
  {
    id: "aloevera-lemongrass-soap",
    name: "Aloevera & Lemongrass Soap",
    tagline: "Natural face & body soap",
    category: "Body",
    price: 249,
    comingSoon: false,
    image: "/products/aloevera-lemongrass.jpg",
    shortDescription:
      "Cooling aloe vera paired with fresh lemongrass to soothe and refresh skin daily.",
    description:
      "A calming blend of pure aloe vera gel and lemongrass essential oil. Soothes irritation, hydrates, and leaves behind a fresh citrus-herbal scent. Suits sensitive and normal skin types, for daily face and body use.",
    ingredients: ["Aloe vera gel", "Lemongrass oil", "Coconut oil base", "Vitamin E"],
    specifications: {
      "Skin Type": "Sensitive / Normal",
      "Weight": "100g",
      "Shelf Life": "18 months",
    },
  },
  {
    id: "charcoal-black-oud-soap",
    name: "Charcoal & Black Oud Soap",
    tagline: "Natural face & body soap",
    category: "Body",
    price: 279,
    comingSoon: false,
    image: "/products/charcoal-black-oud.jpg",
    shortDescription:
      "Activated charcoal detox with a rich, smoky oud fragrance.",
    description:
      "Activated charcoal draws out deep-set impurities and excess oil, while black oud lends a warm, luxurious scent that lingers. A detoxifying bar for city-tired skin, face and body both.",
    ingredients: ["Activated charcoal", "Black oud oil", "Coconut oil base", "Shea butter"],
    specifications: {
      "Skin Type": "Oily / Normal",
      "Weight": "100g",
      "Shelf Life": "18 months",
    },
  },
  {
    id: "papaya-way-soap",
    name: "Papaya Way Soap",
    tagline: "Natural face & body soap",
    category: "Body",
    price: 249,
    comingSoon: false,
    image: "/products/papaya-way.jpg",
    shortDescription:
      "Papaya-enzyme soap that gently exfoliates for brighter, even-toned skin.",
    description:
      "Natural papaya enzymes gently exfoliate dead skin cells, helping reveal brighter, more even-toned skin over time. A gentle everyday bar for face and body.",
    ingredients: ["Papaya extract", "Coconut oil base", "Honey", "Vitamin E"],
    specifications: {
      "Skin Type": "All skin types",
      "Weight": "100g",
      "Shelf Life": "18 months",
    },
  },
];

export const getProductById = (id) => products.find((p) => p.id === id);
