import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { products as defaultProducts } from "../data/products";
import { SheetsAPI } from "../lib/sheets";

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  // Start empty (not the static catalog) — that catalog was flashing on
  // screen for a moment before being replaced by whatever the live Sheet
  // returned, which looked like "products disappearing." Pages should
  // show a loading state instead until we know the real data.
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await SheetsAPI.listProducts();
      if (res.demo) {
        setDemoMode(true);
        setProducts(defaultProducts); // no backend configured — local catalog IS the real data here
      } else if (res.ok) {
        setDemoMode(false);
        setProducts(res.products);
      } else {
        // Backend reachable but returned an error — fall back to the
        // local catalog so the shop isn't blank, but flag it.
        console.warn("[products] listProducts returned an error, using local catalog as fallback", res);
        setLoadError(res.message || "Could not load live product data.");
        setProducts(defaultProducts);
      }
    } catch (err) {
      // Network/CORS/deployment-URL problem — same fallback, so a
      // backend hiccup never leaves the shop empty.
      console.warn("[products] Could not reach Sheets backend, using local catalog as fallback", err);
      setLoadError("Could not reach the product database. Showing the built-in catalog instead.");
      setProducts(defaultProducts);
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
      value={{ products, loading, demoMode, loadError, refresh, getProductById, isOutOfStock }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    console.error("useProducts() called outside <ProductsProvider> — product data unavailable.");
    return {
      products: [], loading: false, demoMode: false, loadError: "Product service unavailable.",
      refresh: () => {}, getProductById: () => undefined, isOutOfStock: () => false,
    };
  }
  return ctx;
};
