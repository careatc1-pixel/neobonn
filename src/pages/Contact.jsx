import { useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { COMPANY } from "../data/company";
import { SheetsAPI } from "../lib/sheets";
import SEO from "../components/SEO";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    await SheetsAPI.submitEnquiry(form);
    setStatus("sent");
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8">
      <SEO
        title="Contact Us"
        description={`Get in touch with ${COMPANY.brand} — questions about orders, ingredients, or wholesale enquiries.`}
        path="/contact"
      />
      <div className="grid gap-14 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
            Get in Touch
          </p>
          <h1 className="mt-2 font-display text-4xl text-[var(--color-forest-dark)]">
            We'd love to hear from you
          </h1>
          <p className="mt-4 text-[var(--color-charcoal)]/70">
            Questions about an order, bulk enquiries, or just want to say hi —
            reach out any time.
          </p>

          <ul className="mt-8 space-y-4 text-sm text-[var(--color-charcoal)]/80">
            <li className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-[var(--color-forest)]" /> {COMPANY.address}</li>
            <li className="flex items-center gap-3"><Phone size={18} className="text-[var(--color-forest)]" /> {COMPANY.phones.join(" · ")}</li>
            <li className="flex items-center gap-3"><Mail size={18} className="text-[var(--color-forest)]" /> {COMPANY.email}</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--color-forest)]/10 p-6">
          <input
            required name="name" value={form.name} onChange={handleChange}
            placeholder="Full name"
            className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]"
          />
          <input
            required type="email" name="email" value={form.email} onChange={handleChange}
            placeholder="Email address"
            className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]"
          />
          <input
            name="phone" value={form.phone} onChange={handleChange}
            placeholder="Phone number"
            className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]"
          />
          <textarea
            required name="message" value={form.message} onChange={handleChange}
            placeholder="Your message" rows={4}
            className="w-full rounded-lg border border-[var(--color-forest)]/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-forest-dark)]"
          />
          <button
            disabled={status === "sending"}
            className="w-full rounded-full bg-[var(--color-forest-dark)] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {status === "sending" ? "Sending..." : status === "sent" ? "Sent ✓ We'll be in touch" : "Send Enquiry"}
          </button>
        </form>
      </div>
    </div>
  );
}
