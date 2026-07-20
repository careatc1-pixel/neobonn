import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await signup(form.name, form.email, form.phone, form.password);
    if (res.ok) navigate("/account");
    else setError(res.message || "Could not create account.");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <h1 className="text-center font-display text-3xl text-[var(--color-forest-dark)]">
        Create Your Account
      </h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input required name="name" placeholder="Full name" value={form.name} onChange={handleChange}
          className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]" />
        <input required type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange}
          className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]" />
        <input name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange}
          className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]" />
        <input required type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange}
          className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white">
          Create Account
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--color-charcoal)]/60">
        Already have an account? <Link to="/login" className="font-semibold text-[var(--color-forest-dark)]">Login</Link>
      </p>
    </div>
  );
}
