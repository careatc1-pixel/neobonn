import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import logo from "../assets/logo-icon.png";
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
    <footer className="relative mt-20 bg-[var(--color-forest-dark)] text-[var(--color-cream)]">
      {/* Organic wave transition from the cream page body into the dark footer */}
      <div className="absolute -top-[39px] left-0 h-[40px] w-full overflow-hidden leading-none">
        <img src={waveDivider} alt="" aria-hidden="true" className="h-full w-full" />
      </div>

      {/* Soft ambient glow behind the logo, echoing the hero section */}
      <div className="pointer-events-none absolute left-1/2 top-10 h-48 w-48 -translate-x-1/2 rounded-full bg-[var(--color-gold)]/10 blur-3xl" />

      {/* Botanical leaf flourish — same quiet, gilded-leaf motif used on
          the homepage sale banner, scattered softly across the footer */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1000 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="footerLeafGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-gold-light)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="footerLeafCream" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-cream)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-cream)" stopOpacity="0.05" />
          </linearGradient>
          <path id="footerLeaf" d="M0,0 C9,-16 27,-16 36,0 C27,16 9,16 0,0 Z" />
          <g id="footerLeafVein">
            <use href="#footerLeaf" />
            <path d="M2,0 L34,0" stroke="var(--color-forest-dark)" strokeOpacity="0.2" strokeWidth="1" fill="none" />
          </g>
        </defs>

        {/* top-left sprig */}
        <g>
          <path d="M 0,10 C 55,34 96,78 132,138" stroke="var(--color-cream)" strokeOpacity="0.16" fill="none" strokeWidth="1.4" />
          <use href="#footerLeafVein" fill="url(#footerLeafGold)" transform="translate(28,26) rotate(58)" />
          <use href="#footerLeafVein" fill="url(#footerLeafCream)" transform="translate(62,54) rotate(70) scale(0.8)" />
          <use href="#footerLeafVein" fill="url(#footerLeafGold)" transform="translate(94,92) rotate(52) scale(0.6)" />
        </g>

        {/* top-right sprig */}
        <g>
          <path d="M 1000,6 C 946,30 906,72 868,128" stroke="var(--color-cream)" strokeOpacity="0.16" fill="none" strokeWidth="1.4" />
          <use href="#footerLeafVein" fill="url(#footerLeafGold)" transform="translate(958,18) rotate(112)" />
          <use href="#footerLeafVein" fill="url(#footerLeafCream)" transform="translate(926,48) rotate(98) scale(0.8)" />
          <use href="#footerLeafVein" fill="url(#footerLeafGold)" transform="translate(896,84) rotate(120) scale(0.6)" />
        </g>

        {/* bottom-left sprig */}
        <g>
          <path d="M 0,300 C 46,278 78,244 108,204" stroke="var(--color-cream)" strokeOpacity="0.14" fill="none" strokeWidth="1.2" />
          <use href="#footerLeafVein" fill="url(#footerLeafCream)" transform="translate(30,276) rotate(-66) scale(0.55)" />
          <use href="#footerLeafVein" fill="url(#footerLeafGold)" transform="translate(58,250) rotate(-82) scale(0.42)" />
        </g>

        {/* bottom-right sprig */}
        <g>
          <path d="M 1000,296 C 954,272 920,238 888,198" stroke="var(--color-cream)" strokeOpacity="0.14" fill="none" strokeWidth="1.2" />
          <use href="#footerLeafVein" fill="url(#footerLeafGold)" transform="translate(972,274) rotate(-118) scale(0.55)" />
          <use href="#footerLeafVein" fill="url(#footerLeafCream)" transform="translate(944,248) rotate(-100) scale(0.42)" />
        </g>
      </svg>

      <div className="relative mx-auto max-w-[1120px] px-5 pb-8 pt-9 text-center md:px-8">
        {/* Logo + wordmark */}
        <Link to="/" className="inline-flex flex-col items-center gap-1.5">
          <img src={logo} alt="neobonn icon" width="330" height="349" className="h-11 w-auto object-contain drop-shadow-sm" />
          <span className="font-display text-xl tracking-wide">
            <span className="text-[var(--color-cream)]">neo</span><span className="text-[var(--color-gold-light)]">bonn</span>
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[var(--color-gold-light)]">
            {COMPANY.tagline}
          </span>
        </Link>

        <div className="mx-auto mt-4 h-px w-16 bg-[var(--color-cream)]/15" />

        {/* Copyright + legal links */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm text-[var(--color-cream)]/70">
          <span>© {new Date().getFullYear()}, {COMPANY.legalName}</span>
          {LEGAL_LINKS.map((l) => (
            <span key={l.to} className="flex items-center gap-2">
              <span className="text-[var(--color-cream)]/30">·</span>
              <Link to={l.to} className="transition-colors hover:text-[var(--color-gold-light)]">{l.label}</Link>
            </span>
          ))}
        </div>

        {/* Contact line */}
        <p className="mt-2 text-sm text-[var(--color-cream)]/70">
          {COMPANY.phones[0]} &nbsp;·&nbsp; {COMPANY.email}
        </p>
        <p className="mx-auto mt-1 flex max-w-sm items-start justify-center gap-1.5 text-xs text-[var(--color-cream)]/45">
          <MapPin size={13} className="mt-0.5 shrink-0" />
          <span className="min-w-0 text-left">{COMPANY.address}</span>
        </p>

        {/* Social icons */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <a
            href={COMPANY.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-cream)]/20 text-[var(--color-cream)]/80 transition-all hover:-translate-y-0.5 hover:border-[var(--color-gold-light)] hover:text-[var(--color-gold-light)]"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
          <a
            href={COMPANY.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-cream)]/20 text-[var(--color-cream)]/80 transition-all hover:-translate-y-0.5 hover:border-[var(--color-gold-light)] hover:text-[var(--color-gold-light)]"
          >
            <FacebookIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
