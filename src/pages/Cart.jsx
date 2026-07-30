import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">Your bag is empty</h1>
        <Link to="/products" className="mt-6 inline-block rounded-full bg-[var(--color-forest-dark)] px-8 py-3 text-sm font-semibold text-white">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-16 md:px-8">
      <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">Your Bag</h1>

      <div className="mt-8 divide-y divide-[var(--color-forest)]/10">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-5">
            <img src={item.image} onError={(e) => (e.currentTarget.style.opacity = 0)} alt={item.name} className="h-20 w-20 rounded-lg bg-[var(--color-cream-deep)] object-cover" />
            <div className="flex-1">
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-[var(--color-charcoal)]/60">₹{item.price} each</p>
              {Number(item.stock ?? Infinity) <= item.qty && (
                <p className="mt-0.5 text-xs text-amber-600">Max available in stock</p>
              )}
            </div>
            <div className="flex items-center rounded-full border border-[var(--color-forest)]/20">
              <button onClick={() => updateQty(item.id, item.qty - 1)} className="px-3 py-1.5">−</button>
              <span className="w-6 text-center text-sm">{item.qty}</span>
              <button
                onClick={() => updateQty(item.id, item.qty + 1)}
                disabled={item.qty >= Number(item.stock ?? Infinity)}
                className="px-3 py-1.5 disabled:opacity-30"
              >
                +
              </button>
            </div>
            <span className="w-16 text-right font-medium">₹{item.price * item.qty}</span>
            <button onClick={() => removeItem(item.id)} className="text-xs text-red-500 hover:underline">Remove</button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-[var(--color-forest)]/10 pt-6">
        <span className="font-display text-xl">Subtotal</span>
        <span className="font-display text-xl">₹{subtotal}</span>
      </div>

      <button
        onClick={() => navigate("/checkout")}
        className="mt-8 w-full rounded-full bg-[var(--color-forest-dark)] py-3.5 text-sm font-semibold text-white sm:w-auto sm:px-12"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
