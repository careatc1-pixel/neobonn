import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Leaf, User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signup(form.name, form.email, form.phone, form.password);
    setLoading(false);
    if (res.ok) navigate("/account");
    else setError(res.message || "Could not create account.");
  };

  const fields = [
    { name: "name", type: "text", placeholder: "Full name", icon: User },
    { name: "email", type: "email", placeholder: "Email address", icon: Mail },
    { name: "phone", type: "tel", placeholder: "Phone number", icon: Phone, required: false },
  ];

  return (
    <div className="relative overflow-hidden px-5 py-16 md:py-24">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-forest)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-[var(--color-gold)]/10 blur-3xl" />

      <div className="relative mx-auto max-w-md">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-forest)]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-forest-dark)]">
            <Leaf size={12} /> neobonn
          </span>
          <h1 className="mt-4 font-display text-3xl text-[var(--color-forest-dark)] md:text-4xl">
            Create Your Account
          </h1>
          <p className="mt-2 text-sm text-[var(--color-charcoal)]/60">
            Join us for organic beauty, delivered
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-[var(--color-forest)]/10 bg-white p-7 shadow-[0_20px_50px_-20px_rgba(34,54,42,0.18)] md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ name, type, placeholder, icon: Icon, required = true }) => (
              <div className="relative" key={name}>
                <Icon size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-forest)]/40" />
                <input
                  required={required}
                  type={type}
                  name={name}
                  placeholder={placeholder}
                  value={form[name]}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[var(--color-forest)]/20 bg-[var(--color-cream)]/40 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-[var(--color-forest-dark)] focus:bg-white"
                />
              </div>
            ))}
            <div className="relative">
              <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-forest)]/40" />
              <input
                required
                type={showPw ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-[var(--color-forest)]/20 bg-[var(--color-cream)]/40 py-3 pl-11 pr-11 text-sm outline-none transition-colors focus:border-[var(--color-forest-dark)] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-forest)]/40 hover:text-[var(--color-forest-dark)]"
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"} {!loading && <ArrowRight size={16} />}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--color-charcoal)]/60">
            Already have an account? <Link to="/login" className="font-semibold text-[var(--color-forest-dark)]">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
