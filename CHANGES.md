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

No manual sheet changes are needed for this — it uses the same Orders
sheet/columns from step 2 above. Just redeploy the updated `Code.gs`.
