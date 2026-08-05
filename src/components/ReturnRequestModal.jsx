import { useState } from "react";
import { X, Image as ImageIcon, Video as VideoIcon, Loader2, CheckCircle2 } from "lucide-react";
import { SheetsAPI } from "../lib/sheets";
import { fileToBase64, validateImageFile, validateVideoFile } from "../lib/fileToBase64";

const MAX_IMAGES = 4;

export default function ReturnRequestModal({ order, user, onClose, onSubmitted }) {
  const [type, setType] = useState("Return"); // "Return" | "Exchange"
  const [selected, setSelected] = useState(() => (order.items || []).map(() => true));
  const [reason, setReason] = useState("");
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [returnId, setReturnId] = useState(null);
  const [refundMethod, setRefundMethod] = useState("Wallet"); // "Wallet" | "Original Payment" — only relevant for type === "Return"

  const toggleItem = (i) =>
    setSelected((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setFileError("");
    if (images.length + files.length > MAX_IMAGES) {
      setFileError(`Please attach at most ${MAX_IMAGES} photos.`);
      return;
    }
    for (const f of files) {
      const err = validateImageFile(f);
      if (err) {
        setFileError(err);
        return;
      }
    }
    setImages((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");
    const err = validateVideoFile(file);
    if (err) {
      setFileError(err);
      return;
    }
    setVideo(file);
    e.target.value = "";
  };

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const canSubmit =
    reason.trim() &&
    images.length > 0 &&
    video &&
    selected.some(Boolean) &&
    !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const items = (order.items || []).filter((_, i) => selected[i]);
      const [imagePayloads, videoPayload] = await Promise.all([
        Promise.all(images.map(fileToBase64)),
        fileToBase64(video),
      ]);
      const res = await SheetsAPI.submitReturnRequest({
        orderId: order.orderId,
        email: user.email,
        phone: user.phone || "",
        type,
        items,
        reason: reason.trim(),
        images: imagePayloads,
        video: videoPayload,
        refundMethod: type === "Return" ? refundMethod : undefined,
      });
      if (res.demo) {
        setSubmitError("Demo mode: connect the Google Sheets backend (see README.md) to submit real requests.");
      } else if (res.ok) {
        setReturnId(res.returnId);
        onSubmitted?.();
      } else {
        setSubmitError(res.message || "Couldn't submit your request. Please try again.");
      }
    } catch (err) {
      setSubmitError(err.message || "Couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-[var(--color-forest-dark)]">
            {returnId ? "Request submitted" : "Return / Exchange"}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-[var(--color-charcoal)]/50 hover:text-[var(--color-charcoal)]">
            <X size={20} />
          </button>
        </div>

        {returnId ? (
          <div className="mt-6 flex flex-col items-center text-center">
            <CheckCircle2 className="text-[var(--color-forest)]" size={40} />
            <p className="mt-3 text-sm text-[var(--color-charcoal)]/70">
              We've received your {type.toLowerCase()} request for order{" "}
              <span className="font-mono">{order.orderId}</span>. Our team will review the
              photos/video and get back to you shortly.
              {type === "Return" && (
                refundMethod === "Wallet"
                  ? " Once approved, the refund will be credited to your neobonn Cash Wallet instantly."
                  : " Once approved, the refund will be sent to your original payment method."
              )}
            </p>
            <div className="mt-4 rounded-xl border border-[var(--color-forest)]/15 bg-[var(--color-cream-deep)] px-5 py-3">
              <div className="text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">
                Request ID
              </div>
              <div className="font-display text-lg font-semibold text-[var(--color-forest-dark)]">
                {returnId}
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-6 rounded-full bg-[var(--color-forest-dark)] px-8 py-2.5 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-xs text-[var(--color-charcoal)]/60">
              Order <span className="font-mono">{order.orderId}</span> — requests must be
              submitted within 7 days of delivery.
            </p>

            <div className="flex gap-2">
              {["Return", "Exchange"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                    type === t
                      ? "bg-[var(--color-forest-dark)] text-white"
                      : "border border-[var(--color-forest)]/20 text-[var(--color-forest-dark)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-charcoal)]/70">
                Which item(s)?
              </label>
              <ul className="mt-2 space-y-1.5">
                {(order.items || []).map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected[i]}
                      onChange={() => toggleItem(i)}
                      className="h-4 w-4 accent-[var(--color-forest-dark)]"
                    />
                    <span>{item.name} × {item.qty}</span>
                  </li>
                ))}
              </ul>
            </div>

            {type === "Return" && (
              <div>
                <label className="text-xs font-semibold text-[var(--color-charcoal)]/70">
                  How should we refund you?
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundMethod("Wallet")}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                      refundMethod === "Wallet"
                        ? "border-[var(--color-forest-dark)] bg-[var(--color-forest-dark)]/5 text-[var(--color-forest-dark)]"
                        : "border-[var(--color-forest)]/20 text-[var(--color-charcoal)]/70"
                    }`}
                  >
                    <span className="block font-semibold">neobonn Cash Wallet</span>
                    <span className="mt-0.5 block text-[10px] text-[var(--color-charcoal)]/50">
                      Instant credit — use it on your next order
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundMethod("Original Payment")}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                      refundMethod === "Original Payment"
                        ? "border-[var(--color-forest-dark)] bg-[var(--color-forest-dark)]/5 text-[var(--color-forest-dark)]"
                        : "border-[var(--color-forest)]/20 text-[var(--color-charcoal)]/70"
                    }`}
                  >
                    <span className="block font-semibold">Original payment method</span>
                    <span className="mt-0.5 block text-[10px] text-[var(--color-charcoal)]/50">
                      5-7 business days via your bank/UPI
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[var(--color-charcoal)]/70">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="e.g. Wrong shade delivered, product arrived damaged..."
                className="mt-1.5 w-full rounded-lg border border-[var(--color-forest)]/20 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-charcoal)]/70">
                Photos (required — up to {MAX_IMAGES})
              </label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {images.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-full bg-[var(--color-cream-deep)] px-3 py-1.5 text-xs">
                    <ImageIcon size={14} />
                    <span className="max-w-[100px] truncate">{f.name}</span>
                    <button type="button" onClick={() => removeImage(i)} aria-label="Remove photo">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-[var(--color-forest)]/30 px-3 py-1.5 text-xs font-medium text-[var(--color-forest-dark)]">
                    <ImageIcon size={14} /> Add photo
                    <input type="file" accept="image/*" multiple hidden onChange={handleImagesChange} />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-charcoal)]/70">
                Video (required)
              </label>
              <div className="mt-1.5">
                {video ? (
                  <div className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-cream-deep)] px-3 py-1.5 text-xs">
                    <VideoIcon size={14} />
                    <span className="max-w-[160px] truncate">{video.name}</span>
                    <button type="button" onClick={() => setVideo(null)} aria-label="Remove video">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-[var(--color-forest)]/30 px-3 py-1.5 text-xs font-medium text-[var(--color-forest-dark)]">
                    <VideoIcon size={14} /> Add video
                    <input type="file" accept="video/*" hidden onChange={handleVideoChange} />
                  </label>
                )}
              </div>
            </div>

            {fileError && <p className="text-xs text-red-600">{fileError}</p>}
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-forest-dark)] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting && <Loader2 className="animate-spin" size={16} />}
              {submitting ? "Submitting..." : `Submit ${type} Request`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
