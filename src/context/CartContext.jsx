import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

// Every cart is stored under its own key, scoped to whoever is signed in
// (or "guest" when nobody is). This is what actually keeps carts private
// per account — previously everything shared one fixed "neobonn_cart" key
// in localStorage, so any user signed in on the same browser saw the same
// bag as everyone else.
const cartKeyFor = (email) => `neobonn_cart__${email ? email.toLowerCase() : "guest"}`;

function readCart(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeCart(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

// Merges a guest cart into a user's cart (used right after login/signup,
// so anything added before signing in isn't lost).
function mergeCarts(base, incoming) {
  const merged = [...base];
  incoming.forEach((inc) => {
    const existing = merged.find((i) => i.id === inc.id);
    if (existing) {
      const stock = Number(inc.stock ?? existing.stock ?? Infinity);
      existing.qty = Math.min(stock, existing.qty + inc.qty);
      existing.stock = stock;
    } else {
      merged.push(inc);
    }
  });
  return merged;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const activeKey = cartKeyFor(user?.email);
  const [items, setItems] = useState(() => readCart(activeKey));
  const prevKeyRef = useRef(activeKey);

  // Whenever the signed-in user changes (login, logout, switch account),
  // load *that* user's cart instead of continuing to show whoever's cart
  // was in memory before. On a guest -> logged-in transition, fold the
  // guest cart into the user's saved cart once, then clear the guest cart.
  useEffect(() => {
    const prevKey = prevKeyRef.current;
    if (prevKey === activeKey) return;

    const wasGuest = prevKey === cartKeyFor(undefined);
    if (wasGuest && user?.email) {
      const guestItems = readCart(prevKey);
      const userItems = readCart(activeKey);
      const merged = guestItems.length ? mergeCarts(userItems, guestItems) : userItems;
      writeCart(activeKey, merged);
      if (guestItems.length) localStorage.removeItem(prevKey);
      setItems(merged);
    } else {
      setItems(readCart(activeKey));
    }
    prevKeyRef.current = activeKey;
  }, [activeKey, user?.email]);

  useEffect(() => {
    writeCart(activeKey, items);
  }, [items, activeKey]);

  const addItem = (product, qty = 1) => {
    const stock = Number(product.stock ?? Infinity);
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, stock, qty: Math.min(stock, i.qty + qty) }
            : i
        );
      }
      return [
        ...prev,
        { id: product.id, name: product.name, price: product.price, image: product.image, stock, qty: Math.min(stock, qty) },
      ];
    });
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) =>
            i.id === id ? { ...i, qty: Math.min(qty, Number(i.stock ?? Infinity)) } : i
          )
    );

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clearCart, subtotal, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    // Same guard as useWishlist() — prevents a hard crash (destructuring
    // `items` off null) if this ever renders outside <CartProvider>.
    console.error("useCart() called outside <CartProvider> — cart data unavailable.");
    return {
      items: [], addItem: () => {}, removeItem: () => {}, updateQty: () => {},
      clearCart: () => {}, subtotal: 0, count: 0,
    };
  }
  return ctx;
};
