// Friendly full-screen (or inline) fallback shown any time something
// breaks — a render crash, a network/backend hiccup, anything. The
// customer only ever sees this + a short trial ID; the real technical
// detail is logged separately (see src/lib/errorReporting.js) for the
// developer to look up in Admin -> Error Logs.

function MascotJar() {
  // A cute wobbling little cream-jar character, in the site's own
  // brand colors — feels like part of neobonn rather than a generic
  // browser error page.
  return (
    <svg
      viewBox="0 0 220 220"
      className="mx-auto h-40 w-40 md:h-48 md:w-48"
      aria-hidden="true"
    >
      <style>{`
        .nb-oops-float { animation: nbOopsFloat 2.6s ease-in-out infinite; transform-origin: 110px 190px; }
        .nb-oops-blink { animation: nbOopsBlink 3.4s ease-in-out infinite; transform-origin: center; }
        .nb-oops-swirl { animation: nbOopsSwirl 6s linear infinite; transform-origin: 110px 96px; }
        @keyframes nbOopsFloat {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes nbOopsBlink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes nbOopsSwirl {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nb-oops-float, .nb-oops-blink, .nb-oops-swirl { animation: none; }
        }
      `}</style>

      <ellipse cx="110" cy="196" rx="46" ry="8" fill="var(--color-forest-dark)" opacity="0.12" />

      <g className="nb-oops-float">
        {/* jar body */}
        <rect x="62" y="96" width="96" height="88" rx="20" fill="var(--color-cream-deep)" stroke="var(--color-forest)" strokeWidth="4" />
        {/* jar lid */}
        <rect x="54" y="70" width="112" height="30" rx="12" fill="var(--color-gold)" stroke="var(--color-forest-dark)" strokeWidth="4" />
        <rect x="70" y="60" width="80" height="16" rx="8" fill="var(--color-gold-light)" stroke="var(--color-forest-dark)" strokeWidth="3" />

        {/* confused swirl on the lid, like a dollop of cream */}
        <g className="nb-oops-swirl">
          <path
            d="M110 86 q10 -10 0 -18 q-8 -6 0 -12"
            fill="none"
            stroke="var(--color-forest-dark)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.35"
          />
        </g>

        {/* face */}
        <g className="nb-oops-blink">
          <circle cx="92" cy="132" r="6" fill="var(--color-forest-dark)" />
          <circle cx="128" cy="132" r="6" fill="var(--color-forest-dark)" />
        </g>
        {/* confused wavy mouth */}
        <path
          d="M92 156 q9 10 18 0 q9 -10 18 0"
          fill="none"
          stroke="var(--color-forest-dark)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* little blush */}
        <circle cx="80" cy="146" r="6" fill="var(--color-gold-light)" opacity="0.6" />
        <circle cx="140" cy="146" r="6" fill="var(--color-gold-light)" opacity="0.6" />
      </g>

      {/* floating question marks */}
      <text x="30" y="60" fontSize="26" fill="var(--color-gold)" fontFamily="Georgia, serif" opacity="0.8">?</text>
      <text x="176" y="48" fontSize="20" fill="var(--color-forest)" fontFamily="Georgia, serif" opacity="0.6">?</text>
    </svg>
  );
}

export default function OopsScreen({
  trialId,
  title = "Oops! That didn't go as planned.",
  message = "Something glitched on our end. It's not you — please try again in a moment.",
  onRetry,
  fullScreen = true,
  showHomeLink = true,
}) {
  const wrapperClass = fullScreen
    ? "flex min-h-[70vh] flex-1 items-center justify-center px-5 py-16"
    : "flex items-center justify-center px-5 py-12";

  return (
    <div className={wrapperClass}>
      <div className="w-full max-w-md text-center">
        <MascotJar />

        <h1 className="mt-2 font-display text-2xl text-[var(--color-forest-dark)] md:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-[var(--color-charcoal)]/70 md:text-base">
          {message}
        </p>

        {trialId && (
          <div className="mt-5 inline-flex flex-col items-center gap-1 rounded-2xl border border-[var(--color-forest)]/15 bg-[var(--color-cream-deep)] px-5 py-3">
            <span className="text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">
              Reference ID — share this with support if it keeps happening
            </span>
            <span className="font-display text-lg font-semibold text-[var(--color-forest-dark)]">
              {trialId}
            </span>
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-full bg-[var(--color-forest-dark)] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Try Again
            </button>
          )}
          {showHomeLink && (
            <a
              href="/"
              className="rounded-full border border-[var(--color-forest)]/25 px-6 py-2.5 text-sm font-semibold text-[var(--color-forest-dark)] transition-colors hover:bg-[var(--color-cream-deep)]"
            >
              Go to Homepage
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
