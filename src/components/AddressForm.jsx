import { useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import { detectCurrentAddress } from "../lib/geolocation";

const LABELS = ["Home", "Work", "Other"];

const emptyForm = {
  label: "Home",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  lat: null,
  lng: null,
  isDefault: false,
};

// Add/edit form for one saved delivery address. Includes a "Use my
// current location" button that reads the device's GPS location and
// reverse-geocodes it into the address fields, so the customer doesn't
// have to type everything by hand.
export default function AddressForm({ initialAddress, onSave, onCancel, showDefaultToggle = true }) {
  const [form, setForm] = useState(() => ({ ...emptyForm, ...initialAddress }));
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [locateNotice, setLocateNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleUseLocation = async () => {
    setLocateError("");
    setLocateNotice("");
    setLocating(true);
    try {
      const detected = await detectCurrentAddress();
      set({
        // GPS + reverse geocoding can find the street/area reliably, but
        // it cannot read a house or flat number off a door — that part
        // has to come from the customer. So we never overwrite whatever
        // house/flat number they've already typed, and prefix the
        // detected street instead of replacing the field outright.
        line1: form.line1 ? form.line1 : detected.line1 || "",
        city: detected.city || form.city,
        state: detected.state || form.state,
        pincode: detected.pincode || form.pincode,
        lat: detected.lat,
        lng: detected.lng,
      });
      setLocateNotice(
        detected.accuracy && detected.accuracy > 50
          ? "Location found, but GPS accuracy was low. Please double-check the house/flat no., street and pincode below before saving."
          : "Location found. Please add or confirm your house/flat number below — GPS can't read that off a door."
      );
    } catch (err) {
      setLocateError(err.message || "Couldn't get your current location.");
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.phone || !form.line1 || !form.city || !form.pincode) {
      setError("Please fill in name, phone, address, city and pincode.");
      return;
    }
    setSaving(true);
    try {
      const res = await onSave(form);
      if (res && res.ok === false) {
        setError(res.message || "Couldn't save this address. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={handleUseLocation}
        disabled={locating}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-forest-dark)]/30 bg-[var(--color-forest-dark)]/5 py-3 text-sm font-semibold text-[var(--color-forest-dark)] disabled:opacity-60"
      >
        {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
        {locating ? "Finding your location..." : "Use my current location"}
      </button>
      {locateError && <p className="text-xs text-red-600">{locateError}</p>}
      {locateNotice && <p className="text-xs text-amber-600">{locateNotice}</p>}

      <div className="flex gap-2">
        {LABELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => set({ label: l })}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              form.label === l
                ? "bg-[var(--color-forest-dark)] text-white"
                : "border border-[var(--color-forest)]/20 text-[var(--color-charcoal)]/70"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm"
        />
        <input
          required
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => set({ phone: e.target.value })}
          className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm"
        />
      </div>

      <input
        required
        placeholder="House / flat no., street"
        value={form.line1}
        onChange={(e) => set({ line1: e.target.value })}
        className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm"
      />
      <input
        placeholder="Landmark, area (optional)"
        value={form.line2}
        onChange={(e) => set({ line2: e.target.value })}
        className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <input
          required
          placeholder="City"
          value={form.city}
          onChange={(e) => set({ city: e.target.value })}
          className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm"
        />
        <input
          placeholder="State"
          value={form.state}
          onChange={(e) => set({ state: e.target.value })}
          className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm"
        />
        <input
          required
          placeholder="Pincode"
          value={form.pincode}
          onChange={(e) => set({ pincode: e.target.value })}
          className="rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm"
        />
      </div>

      {showDefaultToggle && (
        <label className="flex items-center gap-2 text-sm text-[var(--color-charcoal)]/70">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => set({ isDefault: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--color-forest)]/30"
          />
          Set as default delivery address
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-[var(--color-forest)]/20 py-3 text-sm font-semibold text-[var(--color-charcoal)]/70"
          >
            Cancel
          </button>
        )}
        <button
          disabled={saving}
          className="flex-1 rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save address"}
        </button>
      </div>
    </form>
  );
}
