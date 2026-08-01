import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { ChevronDown } from "lucide-react";
import { products as defaultProducts } from "../../data/products";
import { SheetsAPI } from "../../lib/sheets";
import { ADMIN_LOGIN_PATH } from "../../App";
import OrderTimeline, { TRACKING_STAGES } from "../../components/OrderTimeline";

const CSV_HEADER = [
  "Id", "Name", "Tagline", "Category", "Price", "ComingSoon", "Image",
  "ShortDescription", "Description", "Ingredients(JSON)", "Specifications(JSON)", "Stock",
];

const slugify = (s) =>
  (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const normalizeKey = (k) => (k || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Turns one parsed CSV row (arbitrary header casing) into our product shape.
function rowToProduct(row) {
  const get = (...keys) => {
    for (const key of Object.keys(row)) {
      if (keys.includes(normalizeKey(key))) return row[key];
    }
    return "";
  };

  const name = (get("name") || "").trim();
  if (!name) return null; // skip blank rows

  const id = (get("id") || "").trim() || slugify(name);
  const comingSoonRaw = (get("comingsoon") || "").toString().trim().toLowerCase();
  const priceRaw = (get("price") || "").toString().trim();
  const stockRaw = (get("stock") || "").toString().trim();

  const parseJsonOrDefault = (raw, fallback, splitOnComma) => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return splitOnComma ? raw.split(",").map((s) => s.trim()).filter(Boolean) : fallback;
    }
  };

  return {
    id,
    name,
    tagline: get("tagline"),
    category: get("category") || "Body",
    price: priceRaw ? Number(priceRaw) : null,
    comingSoon: ["true", "1", "yes"].includes(comingSoonRaw),
    image: get("image"),
    shortDescription: get("shortdescription"),
    description: get("description"),
    ingredients: parseJsonOrDefault(get("ingredientsjson", "ingredients"), [], true),
    specifications: parseJsonOrDefault(get("specificationsjson", "specifications"), {}, false),
    stock: stockRaw ? Math.max(0, Number(stockRaw) || 0) : 0,
  };
}

function csvEscape(val) {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function productsToCsv(products) {
  const rows = products.map((p) => [
    p.id, p.name, p.tagline, p.category, p.price ?? "",
    p.comingSoon ? "TRUE" : "FALSE", p.image, p.shortDescription, p.description,
    JSON.stringify(p.ingredients || []), JSON.stringify(p.specifications || {}), p.stock ?? 0,
  ]);
  return [CSV_HEADER, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
}

const emptyProduct = {
  id: "", name: "", tagline: "", category: "Body", price: "",
  comingSoon: false, image: "", shortDescription: "", description: "",
  ingredients: "", specifications: "", stock: "",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("products"); // "products" | "orders"
  const [list, setList] = useState(defaultProducts);
  const [editing, setEditing] = useState(null); // product being edited, or null
  const [saving, setSaving] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [stockDrafts, setStockDrafts] = useState({}); // { [id]: "12" } while typing
  const [stockSavingId, setStockSavingId] = useState(null);
  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null); // { rows, newCount, updateCount }
  const [importing, setImporting] = useState(false);

  // ---- Orders tab state ----
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersDemoMode, setOrdersDemoMode] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDrafts, setOrderDrafts] = useState({}); // { [orderId]: { status, carrier, trackingNumber, note } }
  const [orderSavingId, setOrderSavingId] = useState(null);

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

  const loadOrders = async () => {
    setOrdersLoading(true);
    const res = await SheetsAPI.listAllOrders();
    if (res.demo) {
      setOrdersDemoMode(true);
    } else if (res.ok) {
      setOrders(res.orders);
    }
    setOrdersLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const draftFor = (order) =>
    orderDrafts[order.orderId] || {
      status: order.trackingStatus || "Order Placed",
      carrier: order.carrier || "",
      trackingNumber: order.trackingNumber || "",
      note: "",
    };

  const setDraft = (order, patch) =>
    setOrderDrafts((prev) => ({ ...prev, [order.orderId]: { ...draftFor(order), ...patch } }));

  const saveOrderStatus = async (order) => {
    const draft = draftFor(order);
    setOrderSavingId(order.orderId);
    const res = await SheetsAPI.updateOrderStatus({
      orderId: order.orderId,
      status: draft.status,
      carrier: draft.carrier,
      trackingNumber: draft.trackingNumber,
      note: draft.note,
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.orderId === order.orderId ? res.order : o)));
      setOrderDrafts((prev) => {
        const next = { ...prev };
        delete next[order.orderId];
        return next;
      });
    } else {
      alert(res.message || "Couldn't update this order. Please try again.");
    }
    setOrderSavingId(null);
  };

  const logout = () => {
    sessionStorage.removeItem("neobonn_admin");
    navigate(ADMIN_LOGIN_PATH);
  };

  const startNew = () => setEditing({ ...emptyProduct });
  const startEdit = (p) =>
    setEditing({
      ...p,
      stock: p.stock ?? "",
      ingredients: (p.ingredients || []).join(", "),
      specifications: JSON.stringify(p.specifications || {}, null, 2),
    });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...editing,
      price: editing.price ? Number(editing.price) : null,
      stock: editing.stock === "" || editing.stock == null ? 0 : Math.max(0, Number(editing.stock)),
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

  // ---- Manage Inventory: fast, single-field stock updates ----
  const saveStock = async (id, nextStock) => {
    const stock = Math.max(0, Number(nextStock) || 0);
    setStockSavingId(id);
    const res = await SheetsAPI.updateStock(id, stock);
    if (res.demo) {
      setList((prev) => prev.map((p) => (p.id === id ? { ...p, stock } : p)));
    } else if (res.ok) {
      setList(res.products);
    }
    setStockSavingId(null);
    setStockDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const adjustStock = (p, delta) => saveStock(p.id, Number(p.stock ?? 0) + delta);

  // ---- Bulk CSV Import ----
  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map(rowToProduct).filter(Boolean);
        if (rows.length === 0) {
          alert("Couldn't find any valid product rows in that file. Make sure it has a 'Name' column.");
          return;
        }
        const existingIds = new Set(list.map((p) => p.id));
        const newCount = rows.filter((r) => !existingIds.has(r.id)).length;
        setImportPreview({ rows, newCount, updateCount: rows.length - newCount });
      },
      error: (err) => alert("Couldn't read that file: " + err.message),
    });
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    const res = await SheetsAPI.bulkUpsertProducts(importPreview.rows);
    if (res.demo) {
      setList((prev) => {
        const byId = new Map(prev.map((p) => [p.id, p]));
        importPreview.rows.forEach((r) => byId.set(r.id, r));
        return [...byId.values()];
      });
    } else if (res.ok) {
      setList(res.products);
    } else if (res.message === "Unknown action") {
      alert(
        "Import failed: your deployed Apps Script backend is running an older version of Code.gs that doesn't have the Import feature yet.\n\n" +
        "Fix: open your Apps Script project → paste the latest Code.gs → Deploy → Manage deployments → click the pencil (Edit) on your existing deployment → Version: \"New version\" → Deploy. Then try importing again."
      );
    } else {
      alert(res.message || "Import failed. Please try again.");
    }
    setImporting(false);
    setImportPreview(null);
  };

  // ---- Bulk CSV Export ----
  const handleExport = () => {
    const csv = productsToCsv(list);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neobonn-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">
          Admin · {tab === "products" ? "Products" : "Orders"}
        </h1>
        <button onClick={logout} className="text-sm font-medium text-red-600 hover:underline">
          Logout
        </button>
      </div>

      <div className="mt-5 inline-flex rounded-full border border-[var(--color-forest)]/15 p-1">
        <button
          onClick={() => setTab("products")}
          className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
            tab === "products" ? "bg-[var(--color-forest-dark)] text-white" : "text-[var(--color-forest-dark)]"
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
            tab === "orders" ? "bg-[var(--color-forest-dark)] text-white" : "text-[var(--color-forest-dark)]"
          }`}
        >
          Orders &amp; Shipment Tracking
        </button>
      </div>

      {tab === "products" && demoMode && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Demo mode: VITE_SHEETS_API_URL isn't set, so changes here only
          persist in this browser tab (not saved to Google Sheets yet).
          See README.md to connect the backend.
        </div>
      )}

      {tab === "products" && (
      <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={startNew}
          className="rounded-full bg-[var(--color-forest-dark)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          + Add New Product
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full border border-[var(--color-forest)]/30 px-6 py-2.5 text-sm font-semibold text-[var(--color-forest-dark)]"
        >
          ⇧ Import CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelected}
          className="hidden"
        />
        <button
          onClick={handleExport}
          className="rounded-full border border-[var(--color-forest)]/30 px-6 py-2.5 text-sm font-semibold text-[var(--color-forest-dark)]"
        >
          ⇩ Export CSV
        </button>
        <span className="text-xs text-[var(--color-charcoal)]/50">
          Import adds new products &amp; updates existing ones (matched by Id) — all in one shot.
        </span>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--color-forest)]/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-cream-deep)] text-[var(--color-charcoal)]/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-forest)]/10">
            {list.map((p) => {
              const outOfStock = !p.comingSoon && Number(p.stock ?? 0) <= 0;
              const draft = stockDrafts[p.id];
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3">{p.price ? `₹${p.price}` : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustStock(p, -1)}
                        disabled={stockSavingId === p.id || Number(p.stock ?? 0) <= 0}
                        className="h-7 w-7 rounded-full border border-[var(--color-forest)]/20 text-sm leading-none disabled:opacity-30"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={draft ?? p.stock ?? 0}
                        onChange={(e) =>
                          setStockDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        onBlur={(e) => {
                          if (e.target.value === "" || Number(e.target.value) === Number(p.stock ?? 0)) {
                            setStockDrafts((prev) => {
                              const next = { ...prev };
                              delete next[p.id];
                              return next;
                            });
                            return;
                          }
                          saveStock(p.id, e.target.value);
                        }}
                        disabled={stockSavingId === p.id}
                        className="w-16 rounded-lg border border-[var(--color-forest)]/20 px-2 py-1 text-center text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => adjustStock(p, 1)}
                        disabled={stockSavingId === p.id}
                        className="h-7 w-7 rounded-full border border-[var(--color-forest)]/20 text-sm leading-none disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.comingSoon ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">Coming Soon</span>
                    ) : outOfStock ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">Out of Stock</span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Live</span>
                    )}
                  </td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <button onClick={() => startEdit(p)} className="font-medium text-[var(--color-forest-dark)] hover:underline">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </>
      )}

      {tab === "orders" && (
        <div className="mt-6">
          {ordersDemoMode && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Demo mode: VITE_SHEETS_API_URL isn't set, so order data can't
              be loaded here yet. See README.md to connect the backend.
            </div>
          )}

          {!ordersDemoMode && ordersLoading && (
            <p className="text-sm text-[var(--color-charcoal)]/50">Loading orders...</p>
          )}

          {!ordersDemoMode && !ordersLoading && orders.length === 0 && (
            <p className="text-sm text-[var(--color-charcoal)]/50">No orders yet.</p>
          )}

          <div className="space-y-4">
            {orders.map((order) => {
              const isOpen = expandedOrderId === order.orderId;
              const draft = draftFor(order);
              return (
                <div key={order.orderId} className="rounded-xl border border-[var(--color-forest)]/10 p-5">
                  <button
                    onClick={() => setExpandedOrderId(isOpen ? null : order.orderId)}
                    className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                  >
                    <div>
                      <p className="font-mono text-xs text-[var(--color-charcoal)]/50">{order.orderId}</p>
                      <p className="text-sm font-medium">{order.customerName} · {order.email}</p>
                      <p className="text-xs text-[var(--color-charcoal)]/50">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        (order.status || "").toLowerCase() === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {order.status || "Pending"}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.trackingStatus === "Cancelled" ? "bg-red-100 text-red-700" :
                        order.trackingStatus === "Delivered" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {order.trackingStatus || "Order Placed"}
                      </span>
                      <span className="font-display text-lg text-[var(--color-forest-dark)]">₹{order.amount}</span>
                      <ChevronDown size={16} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-5 space-y-5 border-t border-[var(--color-forest)]/10 pt-4">
                      <ul className="space-y-1 text-sm text-[var(--color-charcoal)]/70">
                        {(order.items || []).map((item, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{item.name} × {item.qty}</span>
                            {item.price && <span>₹{item.price * item.qty}</span>}
                          </li>
                        ))}
                      </ul>

                      <p className="text-xs text-[var(--color-charcoal)]/60">
                        {order.address}, {order.city} - {order.pincode} · {order.phone}
                      </p>

                      <OrderTimeline
                        trackingStatus={order.trackingStatus}
                        trackingHistory={order.trackingHistory}
                        carrier={order.carrier}
                        trackingNumber={order.trackingNumber}
                      />

                      <div className="rounded-xl bg-[var(--color-cream-deep)] p-4">
                        <p className="mb-3 text-sm font-semibold text-[var(--color-forest-dark)]">Update shipment</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <select
                            value={draft.status}
                            onChange={(e) => setDraft(order, { status: e.target.value })}
                            className="rounded-lg border border-[var(--color-forest)]/20 bg-white px-3 py-2 text-sm"
                          >
                            {TRACKING_STAGES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <input
                            placeholder="Courier (e.g. Delhivery)"
                            value={draft.carrier}
                            onChange={(e) => setDraft(order, { carrier: e.target.value })}
                            className="rounded-lg border border-[var(--color-forest)]/20 bg-white px-3 py-2 text-sm"
                          />
                          <input
                            placeholder="Tracking number"
                            value={draft.trackingNumber}
                            onChange={(e) => setDraft(order, { trackingNumber: e.target.value })}
                            className="rounded-lg border border-[var(--color-forest)]/20 bg-white px-3 py-2 text-sm"
                          />
                          <input
                            placeholder="Note for this update (optional)"
                            value={draft.note}
                            onChange={(e) => setDraft(order, { note: e.target.value })}
                            className="rounded-lg border border-[var(--color-forest)]/20 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <button
                          onClick={() => saveOrderStatus(order)}
                          disabled={orderSavingId === order.orderId}
                          className="mt-3 rounded-full bg-[var(--color-forest-dark)] px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {orderSavingId === order.orderId ? "Saving..." : "Save update"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  <option>Hair</option>
                  <option>Wellness</option>
                  <option>Coming Soon</option>
                </select>
                <input type="number" placeholder="Price (₹)" value={editing.price ?? ""}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                  className="rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm" />
              </div>
              <div>
                <input type="number" min="0" placeholder="Stock (units available)" value={editing.stock ?? ""}
                  onChange={(e) => setEditing({ ...editing, stock: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm" />
                <p className="mt-1 text-xs text-[var(--color-charcoal)]/50">
                  Product auto-shows "Out of Stock" on the site once this hits 0.
                </p>
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
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <h2 className="font-display text-xl text-[var(--color-forest-dark)]">
              Confirm Import
            </h2>
            <p className="mt-2 text-sm text-[var(--color-charcoal)]/70">
              Found <strong>{importPreview.rows.length}</strong> product
              {importPreview.rows.length === 1 ? "" : "s"} in this file —{" "}
              <strong>{importPreview.newCount}</strong> new,{" "}
              <strong>{importPreview.updateCount}</strong> will update existing products
              (matched by Id).
            </p>

            <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-[var(--color-forest)]/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-cream-deep)] text-[var(--color-charcoal)]/60">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-forest)]/10">
                  {importPreview.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-1.5">{r.name}</td>
                      <td className="px-3 py-1.5">{r.category}</td>
                      <td className="px-3 py-1.5">{r.price ? `₹${r.price}` : "—"}</td>
                      <td className="px-3 py-1.5">{r.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setImportPreview(null)}
                className="flex-1 rounded-full border border-[var(--color-forest)]/20 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="flex-1 rounded-full bg-[var(--color-forest-dark)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {importing ? "Importing..." : `Import ${importPreview.rows.length} Products`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
