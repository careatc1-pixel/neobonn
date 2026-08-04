import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import SEO from "../components/SEO";

// Rough delivery-by estimate shown per line item, same idea as a
// marketplace cart (e.g. "Delivery by Wed, 12 Aug") — purely
// informational, not tied to real logistics data.
function deliveryEstimate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

export default function Cart() {
  const { items, updateQty, removeItem, subtotal, count } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();
  const seoTag = <SEO title="Your Bag" path="/cart" noindex />;

  // Stable per-item delivery estimate (3-6 days out) computed once per
  // render of the cart, not on every re-render of a single row.
  const deliveryDates = useMemo(
    () => Object.fromEntries(items.map((item, i) => [item.id, deliveryEstimate(3 + (i % 4))])),
    [items]
  );

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

  const handleSaveForLater = (item) => {
    // toggleWishlist() flips membership — only call it when the item isn't
    // already saved, otherwise it would remove it from the wishlist
    // instead of adding it (e.g. a product saved earlier, then re-added
    // to the bag from the product page).
    if (!isWishlisted(item.id)) toggleWishlist(item);
    removeItem(item.id);
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      {seoTag}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Items */}
        <div className="flex-1 rounded-2xl bg-white ring-1 ring-[var(--color-forest)]/10">
          <div className="border-b border-[var(--color-forest)]/10 px-5 py-5 sm:px-7">
            <h1 className="font-display text-2xl text-[var(--color-forest-dark)] sm:text-3xl">
              My Bag
              <span className="ml-2 font-body text-base font-normal text-[var(--color-charcoal)]/50">
                ({count} {count === 1 ? "item" : "items"})
              </span>
            </h1>
          </div>

          <div className="divide-y divide-[var(--color-forest)]/10">
            {items.map((item) => {
              const atMaxStock = item.qty >= Number(item.stock ?? Infinity);
              return (
                <div key={item.id} className="flex gap-4 px-5 py-6 sm:px-7">
                  <Link to={`/products/${item.id}`} className="shrink-0">
                    <img
                      src={item.image}
                      onError={(e) => (e.currentTarget.style.opacity = 0)}
                      alt={item.name}
                      className="h-24 w-24 rounded-xl bg-[var(--color-cream-deep)] object-cover sm:h-28 sm:w-28"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/products/${item.id}`} className="min-w-0">
                        <h3 className="truncate font-medium text-[var(--color-charcoal)] hover:text-[var(--color-forest-dark)] sm:text-[15px]">
                          {item.name}
                        </h3>
                      </Link>
                      <span className="shrink-0 font-display text-lg font-semibold text-[var(--color-forest-dark)]">
                        ₹{item.price * item.qty}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[var(--color-charcoal)]/50">₹{item.price} each</p>
                    {atMaxStock && (
                      <p className="mt-1 text-xs font-medium text-amber-600">Max available in stock</p>
                    )}

                    <div className="mt-3 flex items-center rounded-full border border-[var(--color-forest)]/20 w-fit">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        aria-label="Decrease quantity"
                        className="flex h-8 w-8 items-center justify-center text-[var(--color-forest-dark)]"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        disabled={atMaxStock}
                        aria-label="Increase quantity"
                        className="flex h-8 w-8 items-center justify-center text-[var(--color-forest-dark)] disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <p className="mt-3 text-xs text-[var(--color-charcoal)]/50">
                      Delivery by <span className="font-medium text-[var(--color-charcoal)]/70">{deliveryDates[item.id]}</span>
                    </p>

                    <div className="mt-4 flex items-center gap-5">
                      <button
                        onClick={() => handleSaveForLater(item)}
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/60 hover:text-[var(--color-forest-dark)]"
                      >
                        <Heart size={14} /> Save for later
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Price details */}
        <aside className="w-full lg:sticky lg:top-24 lg:w-[340px]">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-[var(--color-forest)]/10 sm:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal)]/50">
              Price Details
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-charcoal)]/70">
                  Price ({count} {count === 1 ? "item" : "items"})
                </span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-charcoal)]/70">Delivery Charges</span>
                <span className="font-medium text-[var(--color-forest-dark)]">Free</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-dashed border-[var(--color-forest)]/20 pt-4 font-display text-lg font-semibold text-[var(--color-forest-dark)]">
              <span>Total Amount</span>
              <span>₹{subtotal}</span>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="mt-6 w-full rounded-full bg-[var(--color-forest-dark)] py-3.5 text-sm font-semibold text-white hover:bg-[var(--color-forest)]"
            >
              Place Order
            </button>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[var(--color-charcoal)]/50">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
              Safe and secure payments. Easy returns. 100% authentic products.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
