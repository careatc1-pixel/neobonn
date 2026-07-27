import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { posterSlides as allPosterSlides } from "../data/posters";

const AUTOPLAY_MS = 5500;

export default function PosterSlider({
  slides = allPosterSlides,
  eyebrow = "The Ingredient Story",
  heading = "Explore the Full Product Range",
  showThumbnails = true,
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);
  const slideCount = slides.length;

  const goTo = useCallback(
    (i) => setIndex(((i % slideCount) + slideCount) % slideCount),
    [slideCount]
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Autoplay
  useEffect(() => {
    if (!playing || hovering) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slideCount);
    }, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [playing, hovering, slideCount]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  // Touch swipe
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      delta > 0 ? prev() : next();
    }
    touchStartX.current = null;
  };

  const slide = slides[index];

  return (
    <section
      className="mx-auto max-w-7xl px-5 py-16 md:px-8"
      aria-roledescription="carousel"
      aria-label="Neobonn product range highlights"
    >
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-display text-3xl text-[var(--color-forest-dark)]">
            {heading}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="flex items-center gap-2 rounded-full border border-[var(--color-forest)]/20 px-4 py-2 text-xs font-semibold text-[var(--color-charcoal)]/70 transition-colors hover:border-[var(--color-forest-dark)]/50"
          aria-label={playing ? "Pause slideshow" : "Play slideshow"}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? "Pause" : "Play"}
        </button>
      </div>

      <div
        className="group relative overflow-hidden rounded-3xl bg-[var(--color-cream-deep)] shadow-xl shadow-black/5"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/8] lg:aspect-[16/6.2]">
          {slides.map((s, i) => (
            <img
              key={s.id}
              src={s.image}
              alt={`${s.title} — ${s.tagline}`}
              className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out"
              style={{ opacity: i === index ? 1 : 0, zIndex: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
            />
          ))}

          {/* Arrows */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[var(--color-forest-dark)] opacity-0 shadow-md transition-all hover:bg-white group-hover:opacity-100 sm:left-4 sm:p-3"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[var(--color-forest-dark)] opacity-0 shadow-md transition-all hover:bg-white group-hover:opacity-100 sm:right-4 sm:p-3"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute right-5 top-5 z-20 flex gap-1.5 sm:right-8 sm:top-8">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}: ${s.title}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-white/10">
            <div
              key={index + String(playing && !hovering)}
              className="h-full bg-[var(--color-gold)]"
              style={{
                animation:
                  playing && !hovering
                    ? `neobonn-progress ${AUTOPLAY_MS}ms linear forwards`
                    : "none",
                width: playing && !hovering ? undefined : "0%",
              }}
            />
          </div>
        </div>

        {/* Caption bar — sits below the artwork, never overlaps it */}
        <div className="relative z-10 flex flex-col gap-4 border-t border-black/5 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--color-gold)]">
              {slide.eyebrow}
            </p>
            <h3 className="mt-1 font-display text-xl leading-tight text-[var(--color-forest-dark)] sm:text-2xl">
              {slide.title}
            </h3>
            <p className="mt-1 text-sm italic text-[var(--color-charcoal)]/60">
              {slide.tagline}
            </p>
          </div>

          <Link
            to={slide.ctaLink}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[var(--color-forest-dark)] px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-transform hover:scale-[1.03] sm:self-auto sm:text-sm"
          >
            {slide.ctaLabel} →
          </Link>
        </div>
      </div>

      {/* Thumbnail strip */}
      {showThumbnails && (
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              className={`group/thumb relative overflow-hidden rounded-xl border-2 transition-colors ${
                i === index
                  ? "border-[var(--color-forest-dark)]"
                  : "border-transparent hover:border-[var(--color-forest)]/30"
              }`}
            >
              <img
                src={s.image}
                alt={s.title}
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                loading="lazy"
                draggable={false}
              />
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-[10px] font-medium text-white">
                {s.title}
              </span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes neobonn-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
