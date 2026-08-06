import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Phone, Send, Package, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SheetsAPI } from "../lib/sheets";
import { onOpenHelpDesk } from "../lib/helpDeskBus";

// Company WhatsApp Business number — kept here (not just in the backend)
// so the "Chat on WhatsApp" button works instantly without a round trip.
const WHATSAPP_NUMBER = "919310035064";

const QUERY_TYPES = [
  "Where's my order?",
  "Wrong / damaged item",
  "Return or refund",
  "Payment issue",
  "Product question",
  "Something else",
];

function Bubble({ from, children }) {
  const isBot = from === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug ${
          isBot
            ? "rounded-tl-sm bg-white text-[var(--color-charcoal)] shadow-sm"
            : "rounded-tr-sm bg-[var(--color-forest-dark)] text-white"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function QuickReplies({ options, onPick, disabled }) {
  return (
    <div className="flex flex-wrap gap-2 pl-1">
      {options.map((opt) => (
        <button
          key={opt}
          disabled={disabled}
          onClick={() => onPick(opt)}
          className="rounded-full border border-[var(--color-forest-dark)]/25 bg-white px-3.5 py-1.5 text-xs font-medium text-[var(--color-forest-dark)] transition-colors hover:bg-[var(--color-forest-dark)]/5 disabled:opacity-50"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function HelpDesk() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("welcome"); // welcome -> order -> query -> route -> callbackForm -> done
  const [messages, setMessages] = useState([]);
  const [myOrders, setMyOrders] = useState(null); // null = not fetched yet
  const [selectedOrder, setSelectedOrder] = useState(null); // {orderId, label} or "manual" or "skip"
  const [manualOrderId, setManualOrderId] = useState("");
  const [queryType, setQueryType] = useState("");
  const [form, setForm] = useState({ name: user?.name || "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [requestId, setRequestId] = useState("");
  const scrollRef = useRef(null);

  const say = (text) => setMessages((prev) => [...prev, { from: "bot", text }]);
  const reply = (text) => setMessages((prev) => [...prev, { from: "user", text }]);

  // Kick off the greeting the first time the widget is opened.
  useEffect(() => {
    if (open && messages.length === 0) {
      say("Hi! I'm the neobonn help assistant 👋");
      setTimeout(() => say("Is this about an order you placed, or something else?"), 350);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Allow other parts of the app (e.g. the Account page's "Help &
  // Support" card) to open this widget without prop-drilling.
  useEffect(() => onOpenHelpDesk(() => setOpen(true)), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step]);

  const startOrderFlow = async () => {
    reply("An order I placed");
    setStep("order");
    if (user?.email && myOrders === null) {
      say("Let me pull up your recent orders...");
      try {
        const res = await SheetsAPI.getMyOrders(user.email);
        const orders = res.ok ? res.orders.slice(0, 5) : [];
        setMyOrders(orders);
        setTimeout(() => {
          say(orders.length ? "Which order is this about?" : "Which order is this about? Go ahead and type the Order ID.");
        }, 200);
      } catch {
        setMyOrders([]);
        say("Which order is this about? Go ahead and type the Order ID.");
      }
    } else if (!user?.email) {
      setMyOrders([]);
      setTimeout(() => say("No worries — you can type the Order ID, or just skip this."), 250);
    }
  };

  const startGeneralFlow = () => {
    reply("Something else");
    setSelectedOrder({ orderId: "", label: "" });
    setStep("query");
    setTimeout(() => say("Got it! What's this about?"), 250);
  };

  const pickOrder = (order) => {
    setSelectedOrder(order);
    reply(order.label);
    setStep("query");
    setTimeout(() => say("Got it! What's this about?"), 250);
  };

  const confirmManualOrderId = () => {
    const id = manualOrderId.trim();
    pickOrder({ orderId: id, label: id ? `Order ${id}` : "I'll skip the order ID" });
  };

  const pickQueryType = (type) => {
    setQueryType(type);
    reply(type);
    setStep("route");
    setTimeout(() => say("How would you like to reach us — WhatsApp is usually fastest, or I can have someone call you back."), 300);
  };

  const buildWhatsAppText = () => {
    const lines = [
      `Hi neobonn team, I need help.`,
      selectedOrder?.orderId ? `Order ID: ${selectedOrder.orderId}` : null,
      queryType ? `Query: ${queryType}` : null,
      user?.name ? `Name: ${user.name}` : null,
    ].filter(Boolean);
    return encodeURIComponent(lines.join("\n"));
  };

  const openWhatsApp = () => {
    reply("Chat on WhatsApp");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppText()}`, "_blank", "noopener,noreferrer");
    setTimeout(() => say("Opening WhatsApp for you — talk soon! 💬"), 200);
  };

  const openCallbackForm = () => {
    reply("Request a callback");
    setStep("callbackForm");
    setTimeout(() => say("Sure — just need a number to call you on."), 250);
  };

  const submitCallback = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await SheetsAPI.requestCallback({
        name: form.name || user?.name || "",
        email: user?.email || "",
        phone: form.phone.trim(),
        orderId: selectedOrder?.orderId || "",
        queryType,
        message: form.message,
      });
      if (res.ok) {
        setRequestId(res.requestId);
        setStep("done");
        say(`Done! Our team will call you on ${form.phone.trim()} shortly. Reference: ${res.requestId}`);
      } else {
        setSubmitError(res.message || "Couldn't submit that — please try again.");
      }
    } catch (err) {
      setSubmitError(err.message || "Couldn't submit that — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetWidget = () => {
    setStep("welcome");
    setMessages([]);
    setMyOrders(null);
    setSelectedOrder(null);
    setManualOrderId("");
    setQueryType("");
    setForm({ name: user?.name || "", phone: "", message: "" });
    setSubmitError("");
    setRequestId("");
  };

  return (
    <>
      {/* Floating launcher — visible on every storefront page (not just
          /account). Account page's "Help & Support" entries call
          openHelpDesk() directly and skip this button, but it's the only
          way a guest or someone browsing Home/Products/Cart/etc. can
          reach support at all. */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Need help? Chat with us"
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-[var(--color-forest-dark)] px-5 py-3.5 text-sm font-semibold text-white shadow-2xl transition-transform hover:scale-105"
        >
          <MessageCircle size={18} />
          <span className="hidden sm:inline">Need help?</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-[60] flex h-[70vh] max-h-[560px] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-[var(--color-forest)]/10 bg-[var(--color-cream-deep)] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-[var(--color-forest-dark)] px-4 py-3.5 text-white">
            <div>
              <p className="text-sm font-semibold">neobonn Help Desk</p>
              <p className="text-[11px] text-white/70">Usually replies in a few minutes</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <Bubble key={i} from={m.from}>
                {m.text}
              </Bubble>
            ))}

            {step === "welcome" && (
              <QuickReplies options={["An order I placed", "Something else"]} onPick={(o) => (o === "An order I placed" ? startOrderFlow() : startGeneralFlow())} />
            )}

            {step === "order" && myOrders !== null && (
              <div className="space-y-2 pl-1">
                {myOrders.map((o) => (
                  <button
                    key={o.orderId}
                    onClick={() =>
                      pickOrder({
                        orderId: o.orderId,
                        label: `${o.items?.[0]?.name || "Order"}${o.items?.length > 1 ? ` +${o.items.length - 1} more` : ""} · ${o.orderId}`,
                      })
                    }
                    className="flex w-full items-center gap-2 rounded-xl border border-[var(--color-forest)]/15 bg-white px-3 py-2 text-left text-xs hover:border-[var(--color-forest-dark)]/40"
                  >
                    <Package size={14} className="shrink-0 text-[var(--color-forest-dark)]" />
                    <span className="flex-1 truncate">
                      {o.items?.[0]?.name || "Order"}
                      {o.items?.length > 1 ? ` +${o.items.length - 1} more` : ""}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--color-charcoal)]/50">{o.orderId}</span>
                  </button>
                ))}
                <div className="flex gap-2">
                  <input
                    value={manualOrderId}
                    onChange={(e) => setManualOrderId(e.target.value)}
                    placeholder="Or type an Order ID"
                    className="flex-1 rounded-full border border-[var(--color-forest)]/20 bg-white px-3 py-1.5 text-xs"
                  />
                  <button
                    onClick={confirmManualOrderId}
                    className="rounded-full bg-[var(--color-forest-dark)] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Go
                  </button>
                </div>
                <button
                  onClick={() => pickOrder({ orderId: "", label: "Skip — not order specific" })}
                  className="text-[11px] font-medium text-[var(--color-charcoal)]/50 underline"
                >
                  Skip, not about a specific order
                </button>
              </div>
            )}

            {step === "query" && <QuickReplies options={QUERY_TYPES} onPick={pickQueryType} />}

            {step === "route" && (
              <div className="space-y-2 pl-1">
                <button
                  onClick={openWhatsApp}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <MessageCircle size={16} /> Chat on WhatsApp
                </button>
                <button
                  onClick={openCallbackForm}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-forest-dark)]/30 px-4 py-2.5 text-sm font-semibold text-[var(--color-forest-dark)]"
                >
                  <Phone size={16} /> Request a callback
                </button>
              </div>
            )}

            {step === "callbackForm" && (
              <form onSubmit={submitCallback} className="space-y-2 rounded-xl bg-white p-3">
                <input
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--color-forest)]/15 px-3 py-2 text-xs"
                />
                <input
                  required
                  type="tel"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--color-forest)]/15 px-3 py-2 text-xs"
                />
                <textarea
                  placeholder="Anything else we should know? (optional)"
                  rows={2}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--color-forest)]/15 px-3 py-2 text-xs"
                />
                {submitError && <p className="text-[11px] text-red-600">{submitError}</p>}
                <button
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-forest-dark)] py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  <Send size={14} /> {submitting ? "Submitting..." : "Request callback"}
                </button>
              </form>
            )}

            {step === "done" && (
              <div className="rounded-xl bg-white p-4 text-center">
                <CheckCircle2 className="mx-auto text-green-600" size={28} />
                <p className="mt-2 text-xs text-[var(--color-charcoal)]/70">
                  Reference ID: <span className="font-mono">{requestId}</span>
                </p>
                <button onClick={resetWidget} className="mt-3 text-xs font-semibold text-[var(--color-forest-dark)] underline">
                  Start a new query
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
