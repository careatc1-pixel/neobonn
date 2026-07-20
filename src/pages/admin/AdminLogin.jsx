import { useState } from "react";
import { useNavigate } from "react-router-dom";

// NOTE: For a real deployment, replace this with a proper check against
// your Google Sheet's "Admins" tab (via SheetsAPI) or Firebase Auth.
// This simple gate exists so /admin isn't wide open by default.
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "atharvluxe2026";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5">
      <h1 className="text-center font-display text-2xl text-[var(--color-forest-dark)]">
        Admin Panel
      </h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="password" required autoFocus placeholder="Admin password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white">
          Enter
        </button>
      </form>
    </div>
  );
}
