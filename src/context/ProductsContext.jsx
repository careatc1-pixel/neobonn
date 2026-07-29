import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { products as defaultProducts } from "../data/products";
import { SheetsAPI } from "../lib/sheets";

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(defaultProducts);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SheetsAPI.listProducts();
      if (res.demo) {
        setDemoMode(true);
        setProducts(defaultProducts); // no backend wired up — use local catalog
      } else if (res.ok) {
        setDemoMode(false);
        setProducts(res.products);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getProductById = (id) => products.find((p) => p.id === id);

  // A product is out of stock once its units run out — unless it's a
  // "Coming Soon" item, which uses the separate notify-me flow instead.
  const isOutOfStock = (product) =>
    !!product && !product.comingSoon && Number(product.stock ?? 0) <= 0;

  return (
    <ProductsContext.Provider
      value={{ products, loading, demoMode, refresh, getProductById, isOutOfStock }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export const useProducts = () => useContext(ProductsContext);
