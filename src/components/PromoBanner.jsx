import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CloudRain, X } from "lucide-react";

const DISMISS_KEY = "neobonn_promo_dismissed_v1";

export default function PromoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(DISMISS_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="relative overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(100deg, #22362a, #33503f, #22362a, #2d4536, #22362a)",
        backgroundSize: "300% 300%",
        animation: "neobonn-gradient-flow 8s ease-in-out infinite",
      }}
    >
      {/* Falling-rain stripe backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          background:
            "repeating-linear-gradient(115deg, white 0px, white 1px, transparent 1px, transparent 14px)",
          backgroundSize: "200% 200%",
          animation: "neobonn-rain-fall 3.5s linear infinite",
        }}
      />

      {/* Soft glow sweep */}
      <div
        className="pointer-events-none absolute inset-y-0 w-1/3 opacity-20"
        style={{
          background: "linear-gradient(90deg, transparent, white, transparent)",
          animation: "neobonn-sweep 5s ease-in-out infinite",
        }}
      />

      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-10 py-2.5 text-center sm:px-8">
        <CloudRain
          size={16}
          className="shrink-0 text-[var(--color-gold-light)]"
          style={{ animation: "neobonn-bob 2.2s ease-in-out infinite" }}
        />
        <p className="text-xs font-medium tracking-wide sm:text-sm">
          <span
            className="font-bold uppercase text-[var(--color-gold-light)]"
            style={{
              textShadow: "0 0 12px rgba(224,189,110,0.6)",
              animation: "neobonn-glow 2.2s ease-in-out infinite",
            }}
          >
            Monsoon Sale
          </span>{" "}
          — Flat{" "}
          <span
            className="inline-block font-bold"
            style={{ animation: "neobonn-pulse-scale 1.8s ease-in-out infinite" }}
          >
            40% OFF
          </span>{" "}
          on every product, this week only.
        </p>
        <Link
          to="/products"
          className="ml-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-forest-dark)] transition-transform hover:scale-105 sm:text-xs"
          style={{ animation: "neobonn-cta-glow 2.4s ease-in-out infinite" }}
        >
          Shop Now
        </Link>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss offer banner"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X size={16} />
      </button>

      <style>{`
        @keyframes neobonn-gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes neobonn-rain-fall {
          0% { background-position: 0% 0%; }
          100% { background-position: -40% 100%; }
        }
        @keyframes neobonn-sweep {
          0% { transform: translateX(-120%); }
          50% { transform: translateX(320%); }
          100% { transform: translateX(320%); }
        }
        @keyframes neobonn-bob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(-6deg); }
        }
        @keyframes neobonn-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        @keyframes neobonn-pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes neobonn-cta-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); }
          50% { box-shadow: 0 0 0 5px rgba(255,255,255,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
