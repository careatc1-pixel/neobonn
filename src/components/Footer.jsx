import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import logo from "../assets/logo-icon.png";
import botanicalStrip from "../assets/footer-botanical.svg";
import waveDivider from "../assets/footer-wave.svg";
import { COMPANY } from "../data/company";

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M15 4h-2.5A3.5 3.5 0 0 0 9 7.5V10H6.5v3H9v7h3v-7h2.5l.5-3H12V7.8c0-.7.4-1.1 1.1-1.1H15V4Z" />
  </svg>
);

const LEGAL_LINKS = [
  { to: "/track-order", label: "Track Order" },
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/refund-policy", label: "Refund Policy" },
  { to: "/terms-of-service", label: "Terms of Service" },
];

export default function Footer() {
  return (
    <footer className="relative mt-32 bg-[var(--color-forest-dark)] text-[var(--color-cream)]">
      {/* Organic wave transition from the cream page body into the dark footer */}
      <div className="absolute -top-[59px] left-0 h-[60px] w-full overflow-hidden leading-none">
        <img src={waveDivider} alt="" aria-hidden="true" className="h-full w-full" />
      </div>

      {/* Soft ambient glow behind the logo, echoing the hero section */}
      <div className="pointer-events-none absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--color-gold)]/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1120px] px-5 pb-12 pt-14 text-center md:px-8">
        {/* Logo + wordmark */}
        <Link to="/" className="inline-flex flex-col items-center gap-2.5">
          <img src={logo} alt="neobonn icon" width="330" height="349" className="h-16 w-auto object-contain drop-shadow-sm" />
          <span className="font-display text-2xl tracking-wide">
            <span className="text-[var(--color-cream)]">neo</span><span className="text-[var(--color-gold-light)]">bonn</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-gold-light)]">
            {COMPANY.tagline}
          </span>
        </Link>

        <div className="mx-auto mt-7 h-px w-16 bg-[var(--color-cream)]/15" />

        {/* Copyright + legal links */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm text-[var(--color-cream)]/70">
          <span>© {new Date().getFullYear()}, {COMPANY.legalName}</span>
          {LEGAL_LINKS.map((l) => (
            <span key={l.to} className="flex items-center gap-2">
              <span className="text-[var(--color-cream)]/30">·</span>
              <Link to={l.to} className="transition-colors hover:text-[var(--color-gold-light)]">{l.label}</Link>
            </span>
          ))}
        </div>

        {/* Contact line */}
        <p className="mt-3 text-sm text-[var(--color-cream)]/70">
          {COMPANY.phones[0]} &nbsp;·&nbsp; {COMPANY.email}
        </p>
        <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-[var(--color-cream)]/45">
          <MapPin size={13} className="shrink-0" /> {COMPANY.address}
        </p>

        {/* Social icons */}
        <div className="mt-7 flex items-center justify-center gap-4">
          <a
            href={COMPANY.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-cream)]/20 text-[var(--color-cream)]/80 transition-all hover:-translate-y-0.5 hover:border-[var(--color-gold-light)] hover:text-[var(--color-gold-light)]"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
          <a
            href={COMPANY.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-cream)]/20 text-[var(--color-cream)]/80 transition-all hover:-translate-y-0.5 hover:border-[var(--color-gold-light)] hover:text-[var(--color-gold-light)]"
          >
            <FacebookIcon className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Decorative two-layer botanical line-art strip */}
      <div className="relative h-[120px] w-full overflow-hidden sm:h-[150px]">
        <img
          src={botanicalStrip}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-bottom"
        />
      </div>
    </footer>
  );
}
