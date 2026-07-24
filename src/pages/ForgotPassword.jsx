import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const { requestOtp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: enter email, 2: enter otp + new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    const res = await requestOtp(email, "reset");
    setSending(false);
    if (res.ok) {
      setStep(2);
      setInfo(res.demo ? "Demo mode: use code 123456" : "A 6-digit code has been emailed to you.");
    } else {
      setError(res.message || "Could not find an account with this email.");
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const res = await resetPassword(email, otp, newPassword);
    if (res.ok) {
      navigate("/login/customer", { state: { resetSuccess: true } });
    } else {
      setError(res.message || "Invalid or expired code.");
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <h1 className="text-center font-display text-3xl text-[var(--color-forest-dark)]">
        Reset Password
      </h1>
      <p className="mt-2 text-center text-sm text-[var(--color-charcoal)]/60">
        {step === 1
          ? "Enter your account email — we'll send you a one-time code."
          : "Enter the code we emailed you, then set a new password."}
      </p>

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
          <input
            required type="email" placeholder="Email address"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={sending}
            className="w-full rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Reset Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="mt-8 space-y-4">
          {info && <p className="text-sm text-[var(--color-forest-dark)]">{info}</p>}
          <input
            required placeholder="Enter 6-digit code" value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-[var(--color-forest-dark)]"
          />
          <input
            required type="password" placeholder="New password"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]"
          />
          <input
            required type="password" placeholder="Confirm new password"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white">
            Reset Password
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--color-charcoal)]/60">
        Remembered it? <Link to="/login/customer" className="font-semibold text-[var(--color-forest-dark)]">Back to login</Link>
      </p>
    </div>
  );
}
