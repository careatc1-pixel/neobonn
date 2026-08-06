import { useEffect, useState } from "react";
import { COMPANY } from "../data/company";

/**
 * Full-screen intro animation shown once per browser session.
 * Sequence (mirrors the brand's logo-reveal video):
 *   1. Cream backdrop fades in.
 *   2. Outer rings draw themselves in.
 *   3. Gold bead drops into place with a soft bounce.
 *   4. Full lock-up (logo + wordmark) fades/scales up.
 *   5. Whole splash wipes away to reveal the Home page.
 */
export default function SplashScreen({ onFinish }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 150), // rings in
      setTimeout(() => setStage(2), 750), // bead drop
      setTimeout(() => setStage(3), 1500), // wordmark reveal
      setTimeout(() => setStage(4), 2600), // hold
      setTimeout(() => onFinish?.(), 3200), // wipe out
    ];
    return () => timers.forEach(clearTimeout);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-cream)] transition-all duration-700 ease-in-out ${
        stage === 4 ? "opacity-0 scale-105 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Rings */}
        <div
          className={`relative h-28 w-28 rounded-full border-[3px] border-[var(--color-forest)] transition-all duration-700 ease-out ${
            stage >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        >
          <div className="absolute inset-[6px] rounded-full border-[3px] border-[var(--color-forest)]" />

          {/* Gold bead drop */}
          <div
            className={`absolute h-4 w-4 rounded-full bg-gradient-to-br from-[var(--color-gold-light)] to-[var(--color-gold)] shadow-md transition-all ${
              stage >= 2
                ? "top-[18%] right-[14%] duration-700 ease-[cubic-bezier(.34,1.56,.64,1)]"
                : "-top-10 right-[14%] duration-300"
            }`}
          />
        </div>

        {/* Wordmark */}
        <div
          className={`mt-6 text-center transition-all duration-700 ease-out ${
            stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <h1 className="font-display text-3xl tracking-wide">
            <span className="text-[var(--color-forest-dark)]">neo</span><span className="text-[var(--color-gold)]">bonn</span>
          </h1>
          <p className="mt-1 whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-[var(--color-gold)]">
            {COMPANY.tagline}
          </p>
        </div>
      </div>
    </div>
  );
}
