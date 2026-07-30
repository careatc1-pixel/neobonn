import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/CartContext";
import { SheetsAPI } from "../lib/sheets";

export default function ProductDetail() {
  const { id } = useParams();
  const { getProductById, isOutOfStock, loading } = useProducts();
  const product = getProductById(id);
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notified, setNotified] = useState(false);

  if (!product) {
    if (loading) {
      return <div className="mx-auto max-w-[1440px] px-5 py-24 text-center text-[var(--color-charcoal)]/50">Loading…</div>;
    }
    return <Navigate to="/products" replace />;
  }

  const outOfStock = isOutOfStock(product);
  const maxQty = Math.max(1, Number(product.stock ?? 1));

  const handleAdd = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleNotify = async (e) => {
    e.preventDefault();
    await SheetsAPI.submitEnquiry({
      name: "Waitlist",
      email: notifyEmail,
      phone: "",
      message: `Notify me when ${product.name} is back in stock`,
    });
    setNotified(true);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-8">
      <nav className="mb-8 text-sm text-[var(--color-charcoal)]/50">
        <Link to="/products" className="hover:text-[var(--color-forest-dark)]">Shop</Link> / {product.name}
      </nav>

      <div className="grid gap-12 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-[var(--color-cream-deep)]">
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => (e.currentTarget.style.opacity = 0)}
            className={`h-full w-full object-cover ${outOfStock ? "grayscale" : ""}`}
          />
        </div>

        <div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
              {product.category}
            </p>
            {outOfStock && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-700">
                Out of Stock
              </span>
            )}
          </div>
          <h1 className="mt-2 font-display text-4xl text-[var(--color-forest-dark)]">
            {product.name}
          </h1>

          {product.dermatologicallyApproved && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-forest)]">
              <ShieldCheck size={15} className="text-[var(--color-gold)]" />
              Dermatologically Approved
            </p>
          )}

          <p className="mt-4 text-[var(--color-charcoal)]/70">{product.description}</p>

          {product.ingredients?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-forest-dark)]">
                Key Ingredients
              </h3>
              <p className="mt-2 text-sm text-[var(--color-charcoal)]/70">
                {product.ingredients.join(" · ")}
              </p>
            </div>
          )}

          {product.specifications && (
            <div className="mt-6 divide-y divide-[var(--color-forest)]/10 rounded-xl border border-[var(--color-forest)]/10">
              {Object.entries(product.specifications).map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-[var(--color-charcoal)]/50">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            {product.comingSoon || outOfStock ? (
              notified ? (
                <p className="text-sm font-medium text-[var(--color-forest-dark)]">
                  Thanks — we'll email you {product.comingSoon ? "at launch" : "when it's back"}! 🌿
                </p>
              ) : (
                <form onSubmit={handleNotify} className="flex max-w-sm gap-2">
                  <input
                    required
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="Your email"
                    className="flex-1 rounded-full border border-[var(--color-forest)]/20 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-forest-dark)]"
                  />
                  <button className="rounded-full bg-[var(--color-forest-dark)] px-6 py-2.5 text-sm font-semibold text-white">
                    Notify Me
                  </button>
                </form>
              )
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-full border border-[var(--color-forest)]/20">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2 text-lg">−</button>
                  <span className="w-8 text-center">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="px-4 py-2 text-lg">+</button>
                </div>
                <span className="font-display text-2xl text-[var(--color-forest-dark)]">₹{product.price}</span>
              </div>
            )}

            {!product.comingSoon && !outOfStock && (
              <>
                <button
                  onClick={handleAdd}
                  className="mt-6 w-full rounded-full bg-[var(--color-forest-dark)] py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01] sm:w-auto sm:px-10"
                >
                  {added ? "Added to Bag ✓" : "Add to Bag"}
                </button>
                {maxQty <= 5 && (
                  <p className="mt-2 text-xs text-[var(--color-charcoal)]/50">
                    Only {maxQty} left in stock — order soon.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
