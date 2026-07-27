import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, ShoppingBag, User } from "lucide-react";
import logo from "../assets/logo-icon.png";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { COMPANY } from "../data/company";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Shop" },
  { to: "/about", label: "Our Story" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-forest)]/10 bg-[var(--color-cream)]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="neobonn icon" className="h-11 w-auto object-contain md:h-14" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl tracking-wide text-[var(--color-forest-dark)] md:text-2xl">
              neobonn
            </span>
            <span className="mt-0.5 whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.15em] text-[var(--color-gold)] md:text-[9px]">
              {COMPANY.tagline}
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide transition-colors ${
                    isActive
                      ? "text-[var(--color-forest-dark)]"
                      : "text-[var(--color-charcoal)]/70 hover:text-[var(--color-forest-dark)]"
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <Link
            to={user ? "/account" : "/login"}
            className="hidden items-center gap-1.5 text-sm font-medium text-[var(--color-charcoal)]/80 hover:text-[var(--color-forest-dark)] md:flex"
          >
            <User size={18} />
            {user ? user.name?.split(" ")[0] : "Login"}
          </Link>

          <Link to="/cart" className="relative">
            <ShoppingBag size={20} className="text-[var(--color-forest-dark)]" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-gold)] text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-[var(--color-forest)]/10 bg-[var(--color-cream)] px-5 py-4 md:hidden">
          <ul className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} onClick={() => setOpen(false)} className="text-sm font-medium">
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link to={user ? "/account" : "/login"} onClick={() => setOpen(false)} className="text-sm font-medium">
                {user ? "My Account" : "Login / Sign up"}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
