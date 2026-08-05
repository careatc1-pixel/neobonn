import { Suspense, lazy, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import PromoBanner from "./components/PromoBanner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnalyticsRouteTracker from "./components/AnalyticsRouteTracker";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import HelpDesk from "./components/HelpDesk";
import OopsScreen from "./components/OopsScreen";

// Home loads eagerly (it's the most common landing page, so there's no
// benefit to splitting it out — it would just load immediately anyway).
// Every other page is lazy: its JS doesn't download until someone
// actually navigates there, so a first-time visitor on "/" only pays
// for Home's code, not Checkout's, not Account's, and — the single
// biggest win here — not the entire Admin Dashboard (~1800 lines of
// admin-only code that a regular customer never needed to download).
import Home from "./pages/Home";
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Signup = lazy(() => import("./pages/Signup"));
const Account = lazy(() => import("./pages/Account"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
import RequireAdmin from "./pages/admin/RequireAdmin";

// Secret admin entry URL — not linked anywhere in the site.
// e.g. https://www.neobonn.com/nb-team-portal-2026
export const ADMIN_LOGIN_PATH = "/nb-team-portal-2026";

// Minimal, layout-neutral fallback while a lazy page's JS downloads —
// deliberately not a spinner/skeleton with its own visual weight, just
// a thin brand-colored top bar so navigation never feels like it "did
// nothing". Shows only if the chunk takes a moment; on a fast
// connection it's rarely even seen.
function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-forest-dark)]/20 border-t-[var(--color-forest-dark)]" />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  // Admin pages are a separate, standalone area — they must never show the
  // storefront's Navbar/Footer, since that navbar reflects the *customer*
  // login (AuthContext), not the admin session. Rendering it there caused
  // whatever customer account happened to be logged in on that browser
  // (e.g. "Nikunj") to appear at the top of the admin dashboard, which has
  // nothing to do with admin access.
  const isAdminRoute =
    location.pathname === ADMIN_LOGIN_PATH || location.pathname.startsWith("/admin");

  // Splash plays once per browser session (not on every internal route change)
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem("neobonn_splash_seen")
  );

  const finishSplash = () => {
    sessionStorage.setItem("neobonn_splash_seen", "true");
    setShowSplash(false);
  };

  if (showSplash && !isAdminRoute) {
    return <SplashScreen onFinish={finishSplash} />;
  }

  if (isAdminRoute) {
    return (
      <div className="flex min-h-screen flex-col">
        <ScrollToTop />
        <ErrorBoundary key={location.pathname} context={`Admin page: ${location.pathname}`}>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path={ADMIN_LOGIN_PATH} element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
                }
              />
              <Route path="*" element={<AdminLogin />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <AnalyticsRouteTracker />
      <PromoBanner />
      <Navbar />
      <main className="flex-1">
        {/* key={pathname} — remounts (resets) the boundary on every
            navigation, so leaving a broken page automatically recovers
            instead of staying stuck on the Oops screen. Navbar/Footer
            stay outside this boundary, so "Go to Homepage" always works. */}
        <ErrorBoundary key={location.pathname} context={`Page: ${location.pathname}`} fullScreen={false}>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login/customer" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/account" element={<Account />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route
                path="*"
                element={
                  <OopsScreen
                    title="Page not found"
                    message="The page you're looking for doesn't exist or may have moved."
                    showHomeLink
                    fullScreen={false}
                  />
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <HelpDesk />
    </div>
  );
}
