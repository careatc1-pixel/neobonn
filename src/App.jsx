import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import PromoBanner from "./components/PromoBanner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnalyticsRouteTracker from "./components/AnalyticsRouteTracker";
import ErrorBoundary from "./components/ErrorBoundary";
import HelpDesk from "./components/HelpDesk";
import OopsScreen from "./components/OopsScreen";

// Route-level code splitting: previously every page (storefront + admin)
// was bundled into a single ~450KB JS file that had to download and parse
// before ANY page could render — so even the homepage paid the cost of
// the admin dashboard's code. Lazy-loading each page means the browser
// only fetches the code for the page actually being visited, which is
// what was making every page's initial load feel slower.
const Home = lazy(() => import("./pages/Home"));
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
const RequireAdmin = lazy(() => import("./pages/admin/RequireAdmin"));

// Minimal, near-invisible fallback for the brief moment a lazy page chunk
// is downloading — avoids a jarring blank screen without adding another
// heavyweight loading screen on top of the splash screen.
function PageFallback() {
  return <div className="min-h-[40vh]" aria-hidden="true" />;
}

// Secret admin entry URL — not linked anywhere in the site.
// e.g. https://www.neobonn.com/nb-team-portal-2026
export const ADMIN_LOGIN_PATH = "/nb-team-portal-2026";

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

  // React Router does NOT reset scroll position on navigation by default —
  // it keeps whatever scroll offset the previous page had. So clicking
  // "Add to Cart" → "Proceed" or any nav link could land the user mid-page
  // or down near the footer on the new page instead of at the top/header.
  // This resets scroll to top on every route change.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (showSplash && !isAdminRoute) {
    return <SplashScreen onFinish={finishSplash} />;
  }

  if (isAdminRoute) {
    return (
      <div className="flex min-h-screen flex-col">
        <ErrorBoundary key={location.pathname} context={`Admin page: ${location.pathname}`}>
          <Suspense fallback={<PageFallback />}>
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
      <AnalyticsRouteTracker />
      <PromoBanner />
      <Navbar />
      <main className="flex-1">
        {/* key={pathname} — remounts (resets) the boundary on every
            navigation, so leaving a broken page automatically recovers
            instead of staying stuck on the Oops screen. Navbar/Footer
            stay outside this boundary, so "Go to Homepage" always works. */}
        <ErrorBoundary key={location.pathname} context={`Page: ${location.pathname}`} fullScreen={false}>
          <Suspense fallback={<PageFallback />}>
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
