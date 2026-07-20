import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">
        Hi, {user.name} 👋
      </h1>
      <p className="mt-3 text-[var(--color-charcoal)]/70">{user.email}</p>
      <button
        onClick={() => { logout(); navigate("/"); }}
        className="mt-8 rounded-full border border-[var(--color-forest-dark)]/30 px-8 py-3 text-sm font-semibold text-[var(--color-forest-dark)] hover:bg-[var(--color-forest-dark)]/5"
      >
        Logout
      </button>
    </div>
  );
}
