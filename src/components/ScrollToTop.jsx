import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Without this, React Router keeps whatever scroll position the browser
// happened to be at when navigating to a new page — so clicking a link
// from the bottom of one page lands you in the middle of the next one
// instead of at the top. This resets scroll to (0, 0) on every route
// change. (A hard page refresh is a separate, native browser behavior —
// the browser itself restores the previous scroll position on reload
// unless we opt out, which is handled below.)
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
