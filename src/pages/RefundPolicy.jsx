import { COMPANY } from "../data/company";

export default function RefundPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">Refund & Return Policy</h1>
      <p className="mt-2 text-sm text-[var(--color-charcoal)]/50">Last updated: July 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-charcoal)]/75">
        <div>
          <h2 className="mb-2 font-display text-lg text-[var(--color-forest-dark)]">Returns</h2>
          <p>
            Because our soaps and skincare are handcrafted in small batches
            and are personal-care items, we can only accept returns if a
            product arrives damaged or incorrect. Please contact us within
            48 hours of delivery with photos of the issue.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-[var(--color-forest-dark)]">Refunds</h2>
          <p>
            Once a return is approved, refunds are processed to your original
            payment method within 5–7 business days.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-[var(--color-forest-dark)]">Cancellations</h2>
          <p>
            Orders can be cancelled free of charge before they are shipped.
            Once shipped, our standard return policy above applies.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-[var(--color-forest-dark)]">Contact Us</h2>
          <p>
            To start a return or ask about an order, write to{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-[var(--color-forest-dark)] underline">
              {COMPANY.email}
            </a>{" "}
            or call {COMPANY.phones.join(" / ")}.
          </p>
        </div>

        <p className="text-xs text-[var(--color-charcoal)]/50">
          This is placeholder policy text — please replace it with content
          reviewed by a legal professional before launch.
        </p>
      </div>
    </div>
  );
}
