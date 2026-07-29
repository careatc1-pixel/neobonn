import { COMPANY } from "../data/company";

export default function TermsOfService() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">Terms of Service</h1>
      <p className="mt-2 text-sm text-[var(--color-charcoal)]/50">Last updated: July 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-charcoal)]/75">
        <p>
          By using the {COMPANY.brand} website, operated by {COMPANY.legalName},
          you agree to the following terms.
        </p>

        <div>
          <h2 className="mb-2 font-display text-lg text-[var(--color-forest-dark)]">Orders & Payment</h2>
          <p>
            All prices are listed in Indian Rupees (INR) and are subject to
            change without notice. Orders are confirmed only after successful
            payment.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-[var(--color-forest-dark)]">Product Information</h2>
          <p>
            We describe our products as accurately as possible. Since our
            soaps are handmade, slight variations in colour, shape, or
            fragrance intensity between batches are natural and not a defect.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-[var(--color-forest-dark)]">Governing Law</h2>
          <p>
            These terms are governed by the laws of India, and any disputes
            are subject to the jurisdiction of the courts in New Delhi.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-[var(--color-forest-dark)]">Contact Us</h2>
          <p>
            Questions about these terms? Write to{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-[var(--color-forest-dark)] underline">
              {COMPANY.email}
            </a>.
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
