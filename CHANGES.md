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

Existing orders placed before this update will simply show as
"Order Placed" with no history until you update their status once from
the new admin Orders tab — nothing breaks.
