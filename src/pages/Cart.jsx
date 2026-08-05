import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useCampaign } from "../context/CampaignContext";
import { discountedPrice } from "../lib/pricing";
import SEO from "../components/SEO";

export default function Cart() {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const { discountPercent } = useCampaign();
  const navigate = useNavigate();
  const seoTag = <SEO title="Your Bag" path="/cart" noindex />;
  const hasDiscount = discountPercent > 0;
  const discountedSubtotal = discountedPrice(subtotal, discountPercent);
  const totalMrp = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalDiscount = totalMrp - discountedSubtotal;
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        {seoTag}
        <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">Your bag is empty</h1>
        <Link to="/products" className="mt-6 inline-block rounded-full bg-[var(--color-forest-dark)] px-8 py-3 text-sm font-semibold text-white">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-16">
      {seoTag}
      <h1 className="font-display text-2xl text-[var(--color-forest-dark)] md:text-3xl">
        Your Bag <span className="text-base font-sans font-normal text-[var(--color-charcoal)]/50">({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* Item list */}
        <div className="rounded-2xl border border-[var(--color-forest)]/10 bg-white">
          {items.map((item, idx) => {
            const itemFinalPrice = discountedPrice(item.price, discountPercent);
            const atMaxStock = item.qty >= Number(item.stock ?? Infinity);
            return (
              <div
                key={item.id}
                className={`flex gap-4 p-5 ${idx !== items.length - 1 ? "border-b border-[var(--color-forest)]/10" : ""}`}
              >
                <img
                  src={item.image}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => (e.currentTarget.style.opacity = 0)}
                  alt={item.name}
                  className="h-24 w-24 shrink-0 rounded-lg bg-[var(--color-cream-deep)] object-cover"
                />

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium leading-snug">{item.name}</h3>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-semibold text-[var(--color-forest-dark)]">₹{itemFinalPrice}</span>
                    {hasDiscount && (
                      <>
                        <span className="text-[var(--color-charcoal)]/35 line-through">₹{item.price}</span>
                        <span className="font-medium text-green-700">
                          {Math.round(((item.price - itemFinalPrice) / item.price) * 100)}% off
                        </span>
                      </>
                    )}
                  </div>

                  {atMaxStock && (
                    <p className="mt-1 text-xs text-amber-600">Max available in stock</p>
                  )}

                  {/* Bottom row: qty stepper on the left, remove on the right —
                      mirrors the Flipkart cart row layout */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center rounded border border-[var(--color-forest)]/25">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="px-3 py-1.5 text-base font-medium text-[var(--color-forest-dark)] disabled:opacity-30"
                        disabled={item.qty <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        disabled={atMaxStock}
                        className="px-3 py-1.5 text-base font-medium text-[var(--color-forest-dark)] disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/60 hover:text-red-600"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Price details — sticky sidebar on desktop, like Flipkart's checkout panel */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[var(--color-forest)]/10 bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/50">
              Price Details
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-charcoal)]/70">Price ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
                <span>₹{totalMrp}</span>
              </div>
              {hasDiscount && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-charcoal)]/70">Discount</span>
                  <span className="text-green-700">− ₹{totalDiscount}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-charcoal)]/70">Delivery</span>
                <span className="text-green-700">Free</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-dashed border-[var(--color-forest)]/20 pt-4">
              <span className="font-display text-lg">Total Amount</span>
              <span className="font-display text-lg">₹{discountedSubtotal}</span>
            </div>

            {hasDiscount && totalDiscount > 0 && (
              <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                You will save ₹{totalDiscount} on this order
              </p>
            )}

            <button
              onClick={() => navigate("/checkout")}
              className="mt-5 w-full rounded-full bg-[var(--color-forest-dark)] py-3.5 text-sm font-semibold text-white"
            >
              Proceed to Checkout
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[var(--color-forest)]/10 bg-white p-4 text-xs text-[var(--color-charcoal)]/60">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[var(--color-forest-dark)]" />
            Safe and secure payments. Easy returns. 100% authentic products.
          </div>
        </div>
      </div>
    </div>
  );
}
