import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { posterSlides } from "../data/posters";

const AUTOPLAY_MS = 5500;

export default function PosterSlider() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);
  const slideCount = posterSlides.length;

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

  const slide = posterSlides[index];

  return (
    <section
      className="mx-auto max-w-7xl px-5 py-16 md:px-8"
      aria-roledescription="carousel"
      aria-label="Neobonn product range highlights"
    >
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
            The Ingredient Story
          </p>
          <h2 className="mt-2 font-display text-3xl text-[var(--color-forest-dark)]">
            Explore the Full Product Range
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
        {/* Slides */}
        <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/8] lg:aspect-[16/6.2]">
          {posterSlides.map((s, i) => (
            <div
              key={s.id}
              className="absolute inset-0 transition-opacity duration-700 ease-out"
              style={{ opacity: i === index ? 1 : 0, zIndex: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              <img
                src={s.image}
                alt={`${s.title} — ${s.tagline}`}
                className="h-full w-full object-cover object-center"
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            </div>
          ))}

          {/* Caption panel */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-8 md:p-10">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--color-gold-light)]">
                {slide.eyebrow}
              </p>
              <h3 className="mt-2 font-display text-2xl leading-tight text-white sm:text-3xl md:text-4xl">
                {slide.title}
              </h3>
              <p className="mt-2 text-sm font-medium italic text-white/80 sm:text-base">
                {slide.tagline}
              </p>
              <p className="mt-3 hidden max-w-xl text-sm text-white/75 sm:block">
                {slide.description}
              </p>

              {slide.ingredients.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {slide.ingredients.map((ing) => (
                    <li
                      key={ing.name}
                      className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm sm:text-xs"
                    >
                      <span className="font-semibold">{ing.name}</span>
                      <span className="text-white/70"> — {ing.benefit}</span>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                to={slide.ctaLink}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-forest-dark)] transition-transform hover:scale-[1.03] sm:text-sm"
              >
                {slide.ctaLabel} →
              </Link>
            </div>
          </div>
        </div>

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
          {posterSlides.map((s, i) => (
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

      {/* Thumbnail strip */}
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {posterSlides.map((s, i) => (
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

      <style>{`
        @keyframes neobonn-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
