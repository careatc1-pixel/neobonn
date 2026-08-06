import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref to attach to an element, and a boolean that flips to true
 * once the element has scrolled into the viewport (and stays true).
 */
export function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // reveal once, don't re-hide on scroll away
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}
