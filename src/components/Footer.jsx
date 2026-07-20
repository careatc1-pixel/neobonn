import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import logo from "../assets/logo-icon.png";
import { COMPANY } from "../data/company";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-forest)]/10 bg-[var(--color-cream-deep)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={logo} alt={COMPANY.brand} className="h-12 w-auto object-contain" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg tracking-wide text-[var(--color-forest-dark)]">
                {COMPANY.brand}
              </span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-[var(--color-gold)]">
                {COMPANY.tagline}
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-[var(--color-charcoal)]/70">
            Handcrafted, natural face &amp; body care by {COMPANY.legalName}.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm uppercase tracking-widest text-[var(--color-forest-dark)]">
            Shop
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-charcoal)]/70">
            <li><Link to="/products" className="hover:text-[var(--color-forest-dark)]">All Products</Link></li>
            <li><Link to="/about" className="hover:text-[var(--color-forest-dark)]">Our Story</Link></li>
            <li><Link to="/contact" className="hover:text-[var(--color-forest-dark)]">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm uppercase tracking-widest text-[var(--color-forest-dark)]">
            Reach Us
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-charcoal)]/70">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" /> {COMPANY.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0" /> {COMPANY.phones.join(" / ")}
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0" /> {COMPANY.email}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm uppercase tracking-widest text-[var(--color-forest-dark)]">
            Newsletter
          </h4>
          <p className="mt-4 text-sm text-[var(--color-charcoal)]/70">
            Be the first to know about new launches, starting with our Vitamin C Face Serum.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--color-forest)]/10 py-5 text-center text-xs text-[var(--color-charcoal)]/50">
        © {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
      </div>
    </footer>
  );
}
