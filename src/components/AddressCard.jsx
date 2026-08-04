import { Home, Briefcase, MapPin, Pencil, Trash2, CheckCircle2 } from "lucide-react";

const ICONS = { Home, Work: Briefcase, Other: MapPin };

// Displays one saved address. `selectable` mode (used at Checkout)
// turns the whole card into a radio-style pick target; otherwise
// (used in Account) it shows edit/delete/set-default actions instead.
export default function AddressCard({
  address,
  selectable = false,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  busy = false,
}) {
  const Icon = ICONS[address.label] || MapPin;

  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className={`rounded-2xl border p-4 transition-colors ${
        selectable ? "cursor-pointer" : ""
      } ${
        selectable && selected
          ? "border-[var(--color-forest-dark)] bg-[var(--color-forest-dark)]/5"
          : "border-[var(--color-forest)]/15 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-forest)]/10">
          <Icon size={16} className="text-[var(--color-forest-dark)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--color-charcoal)]">{address.label}</p>
            {address.isDefault && (
              <span className="rounded-full bg-[var(--color-gold)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-forest-dark)]">
                Default
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--color-charcoal)]/80">{address.name} · {address.phone}</p>
          <p className="mt-0.5 text-sm text-[var(--color-charcoal)]/60">
            {[address.line1, address.line2, address.city, address.state, address.pincode]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
        {selectable && selected && (
          <CheckCircle2 size={20} className="shrink-0 text-[var(--color-forest-dark)]" />
        )}
      </div>

      {!selectable && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-forest)]/10 pt-3">
          {!address.isDefault && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onSetDefault(address.addressId)}
              className="rounded-full border border-[var(--color-forest)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--color-charcoal)]/70 disabled:opacity-60"
            >
              Set as default
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => onEdit(address)}
            className="flex items-center gap-1 rounded-full border border-[var(--color-forest)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--color-charcoal)]/70 disabled:opacity-60"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(address.addressId)}
            className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-60"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
