import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import PromoBanner from "./components/PromoBanner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnalyticsRouteTracker from "./components/AnalyticsRouteTracker";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import LoginChoice from "./pages/LoginChoice";
import ForgotPassword from "./pages/ForgotPassword";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsOfService from "./pages/TermsOfService";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RequireAdmin from "./pages/admin/RequireAdmin";

export default function App() {
  // Splash plays once per browser session (not on every internal route change)
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem("neobonn_splash_seen")
  );

  const finishSplash = () => {
    sessionStorage.setItem("neobonn_splash_seen", "true");
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={finishSplash} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AnalyticsRouteTracker />
      <PromoBanner />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<LoginChoice />} />
          <Route path="/login/customer" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/account" element={<Account />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
