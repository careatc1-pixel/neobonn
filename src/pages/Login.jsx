import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, requestOtp, loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("password"); // "password" | "otp"

  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(form.email, form.password);
    if (res.ok) navigate("/account");
    else setError(res.message || "Invalid email or password.");
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!form.email) {
      setError("Please enter your email first.");
      return;
    }
    setSending(true);
    const res = await requestOtp(form.email, "login");
    setSending(false);
    if (res.ok) {
      setOtpSent(true);
      setInfo(res.demo ? "Demo mode: use code 123456" : "A 6-digit code has been emailed to you.");
    } else {
      setError(res.message || "Could not send code. Please check the email and try again.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    const res = await loginWithOtp(form.email, otp);
    if (res.ok) navigate("/account");
    else setError(res.message || "Invalid or expired code.");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <h1 className="text-center font-display text-3xl text-[var(--color-forest-dark)]">
        Welcome Back
      </h1>

      {/* Mode toggle */}
      <div className="mx-auto mt-6 flex rounded-full border border-[var(--color-forest)]/20 p-1 text-sm">
        <button
          onClick={() => { setMode("password"); setError(""); setInfo(""); }}
          className={`rounded-full px-5 py-1.5 font-medium transition-colors ${
            mode === "password" ? "bg-[var(--color-forest-dark)] text-white" : "text-[var(--color-charcoal)]/60"
          }`}
        >
          Password
        </button>
        <button
          onClick={() => { setMode("otp"); setError(""); setInfo(""); }}
          className={`rounded-full px-5 py-1.5 font-medium transition-colors ${
            mode === "otp" ? "bg-[var(--color-forest-dark)] text-white" : "text-[var(--color-charcoal)]/60"
          }`}
        >
          Login with OTP
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-4">
          <input
            required type="email" placeholder="Email address"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]"
          />
          <input
            required type="password" placeholder="Password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-[var(--color-forest-dark)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <button className="w-full rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white">
            Login
          </button>
        </form>
      ) : (
        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="mt-8 space-y-4">
          <input
            required type="email" placeholder="Email address"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={otpSent}
            className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)] disabled:bg-[var(--color-cream-deep)]"
          />

          {otpSent && (
            <input
              required placeholder="Enter 6-digit code" value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-[var(--color-forest-dark)]"
            />
          )}

          {info && <p className="text-sm text-[var(--color-forest-dark)]">{info}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            disabled={sending}
            className="w-full rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {otpSent ? "Verify & Login" : sending ? "Sending..." : "Send OTP"}
          </button>

          {otpSent && (
            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(""); setInfo(""); }}
              className="w-full text-center text-xs font-medium text-[var(--color-charcoal)]/50 hover:underline"
            >
              Use a different email
            </button>
          )}
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--color-charcoal)]/60">
        New here? <Link to="/signup" className="font-semibold text-[var(--color-forest-dark)]">Create an account</Link>
      </p>
    </div>
  );
}
