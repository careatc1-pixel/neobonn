// Auto-generates public/sitemap.xml from the static pages + the live
// product catalog (src/data/products.js). Runs automatically before every
// `npm run build` (see the "prebuild" script in package.json), so you
// never have to hand-edit the sitemap when you add/remove a product.
//
// ⚠️ Keep this SITE_URL in sync with src/components/SEO.jsx — both must
// point at your real live domain.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { products } from "../src/data/products.js";

const SITE_URL = "https://www.neobonn.com";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "public", "sitemap.xml");

const today = new Date().toISOString().split("T")[0];

// Static, always-public pages. changefreq/priority are hints to
// crawlers, not guarantees — home + product listing update most often.
const staticPages = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/products", changefreq: "weekly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.2" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms-of-service", changefreq: "yearly", priority: "0.2" },
];

const productPages = products.map((p) => ({
  path: `/products/${p.id}`,
  changefreq: "weekly",
  priority: p.comingSoon ? "0.4" : "0.8",
}));

const allPages = [...staticPages, ...productPages];

const urlEntries = allPages
  .map(
    ({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

writeFileSync(outPath, xml, "utf-8");
console.log(`✅ sitemap.xml generated with ${allPages.length} URLs → ${outPath}`);
