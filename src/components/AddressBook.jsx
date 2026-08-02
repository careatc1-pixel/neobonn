import { useState } from "react";
import { Plus, MapPinned } from "lucide-react";
import { useAddresses } from "../context/AddressContext";
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";

// Full "manage my saved addresses" section — used on the Account page.
// Lets a signed-in customer save multiple delivery addresses (Home,
// Work, Other...), edit or delete them, and pick which one is the
// default used to pre-fill Checkout.
export default function AddressBook() {
  const { addresses, loading, saveAddress, deleteAddress, setDefaultAddress } = useAddresses();
  const [mode, setMode] = useState("list"); // "list" | "add" | "edit"
  const [editingAddress, setEditingAddress] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const handleSave = async (form) => {
    const res = await saveAddress(editingAddress ? { ...form, addressId: editingAddress.addressId } : form);
    if (res.ok) {
      setMode("list");
      setEditingAddress(null);
    }
    return res;
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm("Remove this saved address?")) return;
    setBusyId(addressId);
    await deleteAddress(addressId);
    setBusyId(null);
  };

  const handleSetDefault = async (addressId) => {
    setBusyId(addressId);
    await setDefaultAddress(addressId);
    setBusyId(null);
  };

  if (mode === "add" || mode === "edit") {
    return (
      <div className="mt-4 rounded-2xl border border-[var(--color-forest)]/10 bg-white p-5">
        <h3 className="font-display text-lg text-[var(--color-forest-dark)]">
          {mode === "edit" ? "Edit address" : "Add a new address"}
        </h3>
        <div className="mt-4">
          <AddressForm
            initialAddress={mode === "edit" ? editingAddress : undefined}
            onSave={handleSave}
            onCancel={() => {
              setMode("list");
              setEditingAddress(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {loading && addresses.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal)]/50">Loading your addresses...</p>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-forest)]/20 py-12 text-center">
          <MapPinned className="text-[var(--color-forest)]/40" size={32} />
          <p className="mt-3 text-sm text-[var(--color-charcoal)]/60">
            No saved addresses yet. Add one so checkout is faster next time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.addressId}
              address={addr}
              busy={busyId === addr.addressId}
              onEdit={(a) => {
                setEditingAddress(a);
                setMode("edit");
              }}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setMode("add")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-[var(--color-forest-dark)]/30 py-3 text-sm font-semibold text-[var(--color-forest-dark)]"
      >
        <Plus size={16} /> Add new address
      </button>
    </div>
  );
}
