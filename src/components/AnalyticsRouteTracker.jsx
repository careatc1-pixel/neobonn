import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * This app is a client-side SPA — navigating between pages does NOT
 * trigger a full browser reload, so Google Analytics' default gtag.js
 * setup (which only fires on initial page load) would undercount
 * pageviews massively. This component fires a manual page_view event
 * to GA4 every time the route changes.
 */
export default function AnalyticsRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);

  return null;
}
