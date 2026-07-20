import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(form.email, form.password);
    if (res.ok) navigate("/account");
    else setError(res.message || "Invalid email or password.");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <h1 className="text-center font-display text-3xl text-[var(--color-forest-dark)]">
        Welcome Back
      </h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
        <button className="w-full rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white">
          Login
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--color-charcoal)]/60">
        New here? <Link to="/signup" className="font-semibold text-[var(--color-forest-dark)]">Create an account</Link>
      </p>
    </div>
  );
}
