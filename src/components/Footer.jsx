import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import logo from "../assets/logo-icon.png";
import footerIllustration from "../assets/footer-illustration.svg";
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
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/refund-policy", label: "Refund Policy" },
  { to: "/terms-of-service", label: "Terms of Service" },
];

export default function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-[var(--color-forest-dark)] text-[var(--color-cream)]">
      {/* soft organic glow, kept subtle so the illustration stays the hero */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[560px] -translate-x-1/2 rounded-full bg-[var(--color-forest)]/30 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-5 pb-6 pt-16 text-center md:px-8">
        {/* Logo + wordmark */}
        <Link to="/" className="inline-flex flex-col items-center gap-2">
          <img src={logo} alt="neobonn icon" className="h-16 w-auto object-contain" />
          <span className="font-display text-2xl tracking-wide">neobonn</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-gold-light)]">
            {COMPANY.tagline}
          </span>
        </Link>

        {/* Copyright + legal links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm text-[var(--color-cream)]/70">
          <span>© {new Date().getFullYear()}, {COMPANY.legalName}</span>
          {LEGAL_LINKS.map((l) => (
            <span key={l.to} className="flex items-center gap-2">
              <span className="text-[var(--color-cream)]/30">·</span>
              <Link to={l.to} className="hover:text-[var(--color-gold-light)]">{l.label}</Link>
            </span>
          ))}
        </div>

        {/* Contact line */}
        <p className="mt-3 text-sm font-semibold tracking-wide text-[var(--color-cream)]">
          {COMPANY.phones[0]} &nbsp;·&nbsp; {COMPANY.email}
        </p>
        <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-[var(--color-cream)]/50">
          <MapPin size={13} className="shrink-0" /> {COMPANY.address}
        </p>

        {/* Social icons */}
        <div className="mt-6 flex items-center justify-center gap-5">
          <a
            href={COMPANY.social.instagram}
            aria-label="Instagram"
            className="text-[var(--color-cream)]/80 transition-colors hover:text-[var(--color-gold-light)]"
          >
            <InstagramIcon className="h-[18px] w-[18px]" />
          </a>
          <a
            href={COMPANY.social.facebook}
            aria-label="Facebook"
            className="text-[var(--color-cream)]/80 transition-colors hover:text-[var(--color-gold-light)]"
          >
            <FacebookIcon className="h-[18px] w-[18px]" />
          </a>
        </div>
      </div>

      {/* Large original organic-beauty illustration strip — aloe, botanicals,
          blossoms, a serum bottle & jar, sun and butterflies in neobonn's
          own forest/gold/rose palette */}
      <div className="relative mt-2 h-[110px] w-full overflow-hidden sm:h-[160px] md:h-[185px]">
        <img
          src={footerIllustration}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-bottom"
        />
      </div>
    </footer>
  );
}
