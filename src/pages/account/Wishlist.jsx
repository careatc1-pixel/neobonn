import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import SEO from "../../components/SEO";

// Its own route (/account/wishlist) — a real page navigation from the
// "Your Wishlist" quick-action card, not a same-page scroll.
export default function AccountWishlist() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlist();
  const [movedToBag, setMovedToBag] = useState(null);

  if (!user) return <Navigate to="/login" replace />;

  const handleMoveToBag = (item) => {
    addItem({ id: item.id, name: item.name, price: item.price, image: item.image, stock: Infinity }, 1);
    setMovedToBag(item.id);
    setTimeout(() => setMovedToBag(null), 1500);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8">
      <SEO title="Your Wishlist" path="/account/wishlist" noindex />

      <Link
        to="/account"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-forest-dark)]"
      >
        <ArrowLeft size={16} /> Back to Account
      </Link>

      <h1 className="mt-4 font-display text-2xl text-[var(--color-forest-dark)]">Your Wishlist</h1>
      <p className="mt-1 text-xs text-[var(--color-charcoal)]/50">
        Saved on this device — tap the heart on any product to add or remove it.
      </p>

      {wishlistItems.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-forest)]/20 py-12 text-center">
          <Heart className="text-[var(--color-forest)]/40" size={32} />
          <p className="mt-3 text-sm text-[var(--color-charcoal)]/60">Nothing saved yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {wishlistItems.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-[var(--color-forest)]/10 bg-white">
              <div className="aspect-square overflow-hidden bg-[var(--color-cream-deep)]">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">{item.name}</p>
                <p className="text-sm text-[var(--color-forest-dark)]">₹{item.price}</p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => handleMoveToBag(item)}
                    className="flex-1 rounded-full bg-[var(--color-forest-dark)] py-1.5 text-[11px] font-semibold text-white"
                  >
                    {movedToBag === item.id ? "Added ✓" : "Add to Bag"}
                  </button>
                  <button
                    onClick={() => removeWishlistItem(item.id)}
                    aria-label="Remove from wishlist"
                    className="rounded-full border border-[var(--color-forest)]/15 px-2.5 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
