import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Leaf, User, ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "atharvluxe2026";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("as") === "admin" ? "admin" : "customer");

  return (
    <div className="relative overflow-hidden px-5 py-16 md:py-24">
      {/* organic decorative backdrop */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-forest)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-[var(--color-gold)]/10 blur-3xl" />

      <div className="relative mx-auto max-w-md">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-forest)]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-forest-dark)]">
            <Leaf size={12} /> neobonn
          </span>
          <h1 className="mt-4 font-display text-3xl text-[var(--color-forest-dark)] md:text-4xl">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-[var(--color-charcoal)]/60">
            Choose how you'd like to sign in
          </p>
        </div>

        {/* Two modules — Customer / Admin */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("customer")}
            className={`group flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-center transition-all ${
              mode === "customer"
                ? "border-[var(--color-forest-dark)] bg-white shadow-[0_8px_24px_-8px_rgba(34,54,42,0.25)]"
                : "border-[var(--color-forest)]/15 bg-white/50 hover:border-[var(--color-forest)]/30"
            }`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                mode === "customer"
                  ? "bg-[var(--color-forest-dark)] text-white"
                  : "bg-[var(--color-forest)]/10 text-[var(--color-forest-dark)]"
              }`}
            >
              <User size={20} />
            </span>
            <span className="font-display text-base text-[var(--color-forest-dark)]">Customer</span>
            <span className="text-[11px] leading-tight text-[var(--color-charcoal)]/55">
              Shop &amp; track orders
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`group flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-center transition-all ${
              mode === "admin"
                ? "border-[var(--color-gold)] bg-white shadow-[0_8px_24px_-8px_rgba(199,154,61,0.3)]"
                : "border-[var(--color-forest)]/15 bg-white/50 hover:border-[var(--color-forest)]/30"
            }`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                mode === "admin"
                  ? "bg-[var(--color-gold)] text-white"
                  : "bg-[var(--color-forest)]/10 text-[var(--color-forest-dark)]"
              }`}
            >
              <ShieldCheck size={20} />
            </span>
            <span className="font-display text-base text-[var(--color-forest-dark)]">Admin</span>
            <span className="text-[11px] leading-tight text-[var(--color-charcoal)]/55">
              Manage the store
            </span>
          </button>
        </div>

        {/* Panel */}
        <div className="mt-6 rounded-3xl border border-[var(--color-forest)]/10 bg-white p-7 shadow-[0_20px_50px_-20px_rgba(34,54,42,0.18)] md:p-8">
          {mode === "customer" ? (
            <CustomerLoginForm login={login} navigate={navigate} />
          ) : (
            <AdminLoginForm navigate={navigate} />
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerLoginForm({ login, navigate }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(form.email, form.password);
    setLoading(false);
    if (res.ok) navigate("/account");
    else setError(res.message || "Invalid email or password.");
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-forest)]/40" />
          <input
            required
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-[var(--color-forest)]/20 bg-[var(--color-cream)]/40 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-[var(--color-forest-dark)] focus:bg-white"
          />
        </div>
        <div className="relative">
          <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-forest)]/40" />
          <input
            required
            type={showPw ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          {loading ? "Signing in..." : "Login"} {!loading && <ArrowRight size={16} />}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--color-charcoal)]/60">
        New here? <Link to="/signup" className="font-semibold text-[var(--color-forest-dark)]">Create an account</Link>
      </p>
    </>
  );
}

function AdminLoginForm({ navigate }) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("neobonn_admin", "true");
      navigate("/admin/dashboard");
    } else {
      setError("Incorrect password.");
    }
  };

  return (
    <>
      <div className="mb-5 flex items-center gap-2 rounded-xl bg-[var(--color-gold)]/10 px-4 py-3 text-xs text-[var(--color-forest-dark)]">
        <ShieldCheck size={16} className="shrink-0 text-[var(--color-gold)]" />
        This area is restricted to neobonn store administrators.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-forest)]/40" />
          <input
            type={showPw ? "text" : "password"}
            required
            autoFocus
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-forest)]/20 bg-[var(--color-cream)]/40 py-3 pl-11 pr-11 text-sm outline-none transition-colors focus:border-[var(--color-gold)] focus:bg-white"
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
        <button className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-gold)] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95">
          Enter Admin Panel <ArrowRight size={16} />
        </button>
      </form>
    </>
  );
}
