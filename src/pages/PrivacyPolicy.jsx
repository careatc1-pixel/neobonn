import { COMPANY } from "../data/company";

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      <h1 className="font-display text-3xl text-[var(--color-forest-dark)]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[var(--color-charcoal)]/50">Last updated: July 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-charcoal)]/75">
        <p>
          {COMPANY.legalName} ("we", "us", "our") operates the {COMPANY.brand}
          website. This page explains what information we collect when you
          use our site, and how we use it.
        </p>

        <div>
          <h2 className="mb-2 font-display text-lg text-[var(--color-forest-dark)]">Information We Collect</h2>
          <p>
            When you create an account, place an order, or contact us, we
            collect details such as your name, email address, phone number,
            and delivery address. Payment details are processed securely by
            our payment partner and are not stored on our servers.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-[var(--color-forest-dark)]">How We Use It</h2>
          <p>
            We use your information to process orders, respond to enquiries,
            and — only if you opt in — share updates about new products and
            offers. We do not sell your personal information to third parties.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-[var(--color-forest-dark)]">Contact Us</h2>
          <p>
            For any privacy-related questions, reach us at{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-[var(--color-forest-dark)] underline">
              {COMPANY.email}
            </a>{" "}
            or {COMPANY.phones.join(" / ")}.
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
