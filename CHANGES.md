# Changes in this update

## 1. Fixed: cart was shared across all users
`src/context/CartContext.jsx` used one fixed localStorage key
(`neobonn_cart`) for everyone. Any user signed in on the same browser saw
the same bag. Now each cart is stored under a key scoped to the signed-in
account (`neobonn_cart__<email>`, or `neobonn_cart__guest` when logged
out). Logging in automatically merges anything added as a guest into that
account's saved cart. No manual steps needed — this just works after
deploying the new frontend build.

## 2. Added: full order/shipment tracking system
- **Customers** can see a live shipment timeline (Order Placed → Confirmed
  → Shipped → Out for Delivery → Delivered) on `/account` for each order,
  and anyone (even without logging in) can look an order up at
  `/track-order` using Order ID + email.
- **Admin** gets a new "Orders & Shipment Tracking" tab in
  `/admin/dashboard` to move any order through the stages, attach a
  courier name + tracking number, and leave a note — every update is
  timestamped and shown in the customer's timeline.

### ⚠️ Manual step required: update your Google Sheet + redeploy Code.gs
This feature needs 4 new columns on the **Orders** tab of your Google
Sheet, added right after `CreatedAt` (column M):

```
N: TrackingStatus
O: Carrier
P: TrackingNumber
Q: TrackingHistory(JSON)
```

Then:
1. Open your Google Sheet → Extensions → Apps Script.
2. Replace the existing `Code.gs` contents with the one in this zip
   (`google-apps-script/Code.gs`).
3. Deploy → Manage deployments → pencil (Edit) icon on your existing
   deployment → Version: "New version" → Deploy.
4. `VITE_SHEETS_API_URL` in your frontend `.env` stays the same — no
   change needed there.

## 3. Added: automatic email notifications on every shipment update
Customers now automatically get an email:
- Right when payment is confirmed ("Order confirmed").
- Every time the admin moves the order to a new stage (Confirmed →
  Shipped → Out for Delivery → Delivered/Cancelled), including any note,
  courier, and tracking number the admin entered.

This uses Google's built-in `MailApp` (the same free mechanism already
used for OTP login emails) — **no third-party service, no per-email
cost.** It's genuinely free forever, subject to your Google account's own
daily sending quota (~100 emails/day on a plain Gmail account, much
higher on Google Workspace). If that quota is ever hit, the email simply
doesn't send that day — it never blocks or breaks the order/status
update itself.

### About phone/SMS notifications
There is no SMS or WhatsApp service that is reliably free forever —
every option (Twilio, Fast2SMS, WhatsApp Cloud API, etc.) is either paid
or gives a small trial credit that runs out. To avoid setting up
something that surprises you with a bill later, phone notifications were
intentionally left out. What customers *do* get instead:
- The tracking link (`/track-order`) is included in every email, so
  they can check status themselves on their phone anytime.
- The customer's phone number is already stored per order (visible to
  admin in the Orders tab), so you can message them manually via
  WhatsApp/SMS for high-priority orders if you want to.

If you'd like real SMS/WhatsApp later, the cheapest realistic paid option
in India is usually an SMS DLT-registered route (a few paise per SMS) or
the WhatsApp Business API — happy to wire that in whenever you're ready
to take on that cost.

## 4. Redesigned: shipment tracking is now Amazon-style & bug-free

### What was wrong
- Saving the same status twice added a duplicate entry to a hidden JSON
  blob — confusing, and looked like "data overwriting."
- Order-confirmation and status-update emails could fail silently (e.g.
  if Gmail sending was never authorized for this script) with zero
  feedback to you.

### What changed
Each shipment stage now has its **own plain date column** in the Orders
sheet — nothing hidden in JSON, nothing to decode:

```
R: OrderPlacedAt
S: ConfirmedAt
T: ShippedAt
U: OutForDeliveryAt
V: DeliveredAt
W: CancelledAt
```

Add these 6 new headers to the **Orders** sheet, right after the
`TrackingHistory(JSON)` column (Q) you added earlier.

**Behaviour (matches Amazon/major e-commerce platforms):**
- Each column is filled in **exactly once** — the first time the order
  reaches that stage. Clicking "Save update" again with the same status
  does nothing (no overwrite, no duplicate email) — you'll just see a
  message: *"Order is already marked 'X' — no changes made."*
- Adding/correcting the courier or tracking number still counts as a
  real update and still emails the customer, even if the stage itself
  was already reached.
- Once an order is **Cancelled**, no further status changes are allowed
  on it.
- You can see the full order history at a glance directly in the sheet —
  just look across the 6 date columns.

### Fix: order/status emails not sending
The #1 reason emails silently never arrive: Gmail sending was never
**authorized** for this script (this only happens once, and only from
inside the Apps Script editor — the deployed Web App can't trigger it).

**Run this once:**
1. Apps Script editor → function dropdown (top toolbar, next to Debug)
   → select **`testEmailSetup`**.
2. Click **Run (▶)**.
3. The first time, Google shows a permission screen → click **Advanced**
   → **"Go to (project name), unsafe"** → **Allow**.
4. Check the inbox of the Google account that owns this Apps Script
   project — you should get a test email within a minute.

Once that test email arrives, order confirmation + every status update
email will start working automatically. If an email ever does fail
after this (e.g. daily quota reached), the admin dashboard now tells you
exactly why right after you click "Save update" — instead of failing
silently.

No existing order data is lost or changed by this update — the new
columns are simply blank for older orders until you next update their
status.

## 5. Added: Help Desk — chat widget + callback requests (Amazon/Flipkart-style)

### What's new
- A floating **"Need help?" chat bubble** now appears bottom-right on
  every storefront page (not on the admin panel). It's a guided
  assistant — not a generative-AI model (that would need a paid API,
  and this whole system is built to stay free) — but it walks the
  customer through the same flow those apps use:
  1. "Is this about an order?" → if logged in, their recent orders are
     pulled in automatically to pick from (or they can type an Order ID).
  2. "What's it about?" → quick-reply buttons (delivery delay, wrong
     item, refund, payment issue, product question, other).
  3. Two ways to reach you:
     - **Chat on WhatsApp** — opens `wa.me` straight to your business
       number (**9310035064**) with the order ID + query pre-filled in
       the message, so you see full context immediately.
     - **Request a callback** — customer leaves their phone number,
       which lands in a new **Admin → Help Desk** tab. You get an
       instant email notification (free, via MailApp) the moment a
       request comes in.
- **Admin → Help Desk** tab: every callback request, with one-tap
  **Call** / **WhatsApp customer** buttons (dials or opens WhatsApp
  straight to *their* number), an internal note field, and a status
  flow: Pending → Contacted → Resolved (or Cancelled).

### Manual step required
Add a new sheet tab named exactly **`CallbackRequests`** to your Google
Sheet, with this header row (row 1, exact spelling):

```
RequestId | Name | Email | Phone | OrderId | QueryType | Message | PreferredTime | Status | RequestedAt | ResolvedAt | AdminNote
```

Then redeploy `Code.gs` as usual (Deploy → Manage deployments → pencil →
New version → Deploy). No changes needed to any other sheet.

### About the WhatsApp number
The number **9310035064** is hardcoded in two places — the chat widget
(`src/components/HelpDesk.jsx`) and the backend
(`google-apps-script/Code.gs`, look for `HELPDESK_WHATSAPP_NUMBER`) — so
if you ever change your business WhatsApp number, update it in both
spots. This uses `wa.me` links (WhatsApp's own free deep-linking
service) — no WhatsApp Business API subscription needed, and no cost.

## 6. Redesigned: Account/Profile page (Zepto/Amazon-style layout)

The `/account` page now matches the app-style profile layout you shared
a screenshot of:

- **Header**: avatar, name, phone number, Logout.
- **3 quick-action cards**: "Your Orders", "Help & Support" (opens the
  chat widget from anywhere on the page), "Your Wishlist".
- **"Your Information" list**: Your Refunds, Your Wishlist, E-Gift
  Cards, Help & Support — tapping a row jumps straight to that section
  on the same page.
- Everything below (Orders with live shipment tracking, Wishlist,
  Returns/Refunds) is the same real, working data as before — just
  reorganized to match the screenshot's structure.

### What's genuinely new & working
- **Wishlist** — tap the heart on any product card or product page to
  save/unsave it. Fully working right now. It's stored the same way the
  cart already is (per-account, on-device) — no new sheet/deployment
  step needed. One trade-off worth knowing: like the cart, it doesn't
  sync across different devices/browsers for the same account, since
  there's no backend table for it. If you'd like it to sync across
  devices too, that's a small follow-up (a `Wishlist` sheet + 2 backend
  actions, same pattern as Returns) — just ask.

### What's intentionally a placeholder, not faked
- **"neobonn Gift Cards" / wallet balance** — shown in the screenshot as
  a purple "Cash & Gift Card" banner with a real ₹ balance. Building
  that for real means a proper credit ledger, redemption at checkout,
  and an admin way to issue credit — i.e. it touches real money
  handling. Rather than show a balance that doesn't actually work at
  checkout (which would be actively misleading to customers), it's
  marked **"Coming Soon"** for now. Happy to build the real version
  whenever you're ready to scope it out.
