import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProductsProvider } from "./context/ProductsContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import GlobalErrorOverlay from "./components/GlobalErrorOverlay.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Catches uncaught runtime errors + unhandled promise rejections
        (e.g. network failures nobody awaited) anywhere on the site. */}
    <GlobalErrorOverlay />
    {/* Top-level catch-all for React render crashes — last line of
        defense if something breaks outside the page-level boundary
        in App.jsx (e.g. Navbar/Footer/PromoBanner themselves). */}
    <ErrorBoundary context="Top-level app">
      <BrowserRouter>
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
