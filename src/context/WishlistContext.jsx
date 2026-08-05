import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

// Same per-user scoping approach as CartContext — keyed to whoever is
// signed in (or "guest") so wishlists never leak between accounts on a
// shared browser.
const wishlistKeyFor = (email) => `neobonn_wishlist__${email ? email.toLowerCase() : "guest"}`;

function readWishlist(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const activeKey = wishlistKeyFor(user?.email);
  const [items, setItems] = useState(() => readWishlist(activeKey));

  // Reload when the signed-in user changes (login/logout/switch account).
  useEffect(() => {
    setItems(readWishlist(activeKey));
  }, [activeKey]);

  useEffect(() => {
    localStorage.setItem(activeKey, JSON.stringify(items));
  }, [items, activeKey]);

  const isWishlisted = (id) => items.some((i) => i.id === id);

  const toggleWishlist = (product) => {
    setItems((prev) =>
      prev.some((i) => i.id === product.id)
        ? prev.filter((i) => i.id !== product.id)
        : [
            ...prev,
            { id: product.id, name: product.name, price: product.price, image: product.image },
          ]
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggleWishlist, removeItem, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
