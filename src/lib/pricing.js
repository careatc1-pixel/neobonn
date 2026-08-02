// Applies a sitewide discount percentage (0-90, from the currently
// Active campaign — see CampaignContext) to a price. Kept in one place
// so every page that shows a price (product card, product detail, cart,
// checkout) rounds the same way. The final authoritative charge is
// always recalculated server-side (see computeAuthoritativeAmount in
// Code.gs) — this is only for what the customer sees on screen.
export function discountedPrice(price, discountPercent) {
  const p = Number(price) || 0;
  const d = Math.max(0, Math.min(90, Number(discountPercent) || 0));
  if (d <= 0) return p;
  return Math.round(p * (1 - d / 100));
}
