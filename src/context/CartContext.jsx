import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("neobonn_cart") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("neobonn_cart", JSON.stringify(items));
  }, [items]);

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

export const useCart = () => useContext(CartContext);
