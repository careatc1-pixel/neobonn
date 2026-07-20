import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { products as defaultProducts } from "../../data/products";
import { SheetsAPI } from "../../lib/sheets";

const emptyProduct = {
  id: "", name: "", tagline: "", category: "Body", price: "",
  comingSoon: false, image: "", shortDescription: "", description: "",
  ingredients: "", specifications: "",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [list, setList] = useState(defaultProducts);
  const [editing, setEditing] = useState(null); // product being edited, or null
  const [saving, setSaving] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await SheetsAPI.listProducts();
      if (res.demo) {
        setDemoMode(true);
        return; // fall back to local defaultProducts already in state
      }
      if (res.ok) setList(res.products);
    })();
  }, []);

  const logout = () => {
    sessionStorage.removeItem("neobonn_admin");
    navigate("/admin");
  };

  const startNew = () => setEditing({ ...emptyProduct });
  const startEdit = (p) =>
    setEditing({
      ...p,
      ingredients: (p.ingredients || []).join(", "),
      specifications: JSON.stringify(p.specifications || {}, null, 2),
    });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...editing,
      price: editing.price ? Number(editing.price) : null,
      ingredients: editing.ingredients
        ? editing.ingredients.split(",").map((s) => s.trim())
        : [],
      specifications: (() => {
        try {
          return JSON.parse(editing.specifications || "{}");
        } catch {
          return {};
        }
      })(),
      id: editing.id || editing.name.toLowerCase().replace(/\s+/g, "-"),
    };

    const res = await SheetsAPI.upsertProduct(payload);
    if (res.demo) {
      // Local-only update so admin UI stays usable pre-backend-setup
      setList((prev) => {
        const exists = prev.some((p) => p.id === payload.id);
        return exists
          ? prev.map((p) => (p.id === payload.id ? payload : p))
          : [...prev, payload];
      });
    } else if (res.ok) {
      setList(res.products);
    }
    setSaving(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    const res = await SheetsAPI.deleteProduct(id);
    if (res.demo) {
      setList((prev) => prev.filter((p) => p.id !== id));
    } else if (res.ok) {
      setList(res.products);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">
          Admin · Products
        </h1>
        <button onClick={logout} className="text-sm font-medium text-red-600 hover:underline">
          Logout
        </button>
      </div>

      {demoMode && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Demo mode: VITE_SHEETS_API_URL isn't set, so changes here only
          persist in this browser tab (not saved to Google Sheets yet).
          See README.md to connect the backend.
        </div>
      )}

      <button
        onClick={startNew}
        className="mt-6 rounded-full bg-[var(--color-forest-dark)] px-6 py-2.5 text-sm font-semibold text-white"
      >
        + Add New Product
      </button>

      <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--color-forest)]/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-cream-deep)] text-[var(--color-charcoal)]/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-forest)]/10">
            {list.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.category}</td>
                <td className="px-4 py-3">{p.price ? `₹${p.price}` : "—"}</td>
                <td className="px-4 py-3">
                  {p.comingSoon ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">Coming Soon</span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Live</span>
                  )}
                </td>
                <td className="space-x-3 px-4 py-3 text-right">
                  <button onClick={() => startEdit(p)} className="font-medium text-[var(--color-forest-dark)] hover:underline">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <h2 className="font-display text-xl text-[var(--color-forest-dark)]">
              {editing.id ? "Edit Product" : "New Product"}
            </h2>
            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <input required placeholder="Name" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm" />
              <input placeholder="Tagline" value={editing.tagline}
                onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm">
                  <option>Face</option>
                  <option>Body</option>
                  <option>Coming Soon</option>
                </select>
                <input type="number" placeholder="Price (₹)" value={editing.price ?? ""}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                  className="rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.comingSoon}
                  onChange={(e) => setEditing({ ...editing, comingSoon: e.target.checked })} />
                Mark as "Coming Soon"
              </label>
              <input placeholder="Image URL (e.g. /products/xyz.jpg)" value={editing.image}
                onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm" />
              <textarea placeholder="Short description" rows={2} value={editing.shortDescription}
                onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm" />
              <textarea placeholder="Full description" rows={3} value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm" />
              <input placeholder="Ingredients (comma separated)" value={editing.ingredients}
                onChange={(e) => setEditing({ ...editing, ingredients: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm" />
              <textarea placeholder='Specifications JSON, e.g. {"Weight":"100g"}' rows={2} value={editing.specifications}
                onChange={(e) => setEditing({ ...editing, specifications: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm font-mono text-xs" />

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)}
                  className="flex-1 rounded-full border border-[var(--color-forest)]/20 py-2.5 text-sm font-medium">
                  Cancel
                </button>
                <button disabled={saving}
                  className="flex-1 rounded-full bg-[var(--color-forest-dark)] py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
