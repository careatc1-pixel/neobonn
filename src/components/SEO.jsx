import { Helmet } from "react-helmet-async";

// ⚠️ IMPORTANT: change this to your real live domain (the one connected in
// Hostinger + Vercel). Every canonical URL, sitemap entry, and Open Graph
// tag is built from this one value, so getting it right here fixes the
// whole site at once.
export const SITE_URL = "https://www.neobonn.com";
export const SITE_NAME = "neobonn";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

/**
 * Drop this at the top of any page component:
 *   <SEO title="..." description="..." path="/products" />
 *
 * `jsonLd` is optional — pass a schema.org object (e.g. Product schema)
 * and it will be injected as a <script type="application/ld+json">.
 */
export default function SEO({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd = null,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Skin Care & Wellness Brand`;
  const canonical = `${SITE_URL}${path === "/" ? "" : path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph — controls how the page looks when shared on
          WhatsApp / Facebook / Instagram / LinkedIn */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      {/* Twitter/X card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
