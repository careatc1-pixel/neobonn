# neobonn — Website Starter (Atharv Luxe Co.)

A React + Vite storefront for **neobonn**, with individual page routing,
a logo intro animation, a product catalog, cart & checkout, customer
login, an admin panel, and a **Google Sheets backend** (no paid server/IP
required).

---

## 1. What's already built

- ✅ Logo intro animation on first load (`src/components/SplashScreen.jsx`)
- ✅ Individual routes per page: `/`, `/products`, `/products/:id`, `/about`,
  `/contact`, `/login`, `/signup`, `/account`, `/cart`, `/checkout`,
  `/admin`, `/admin/dashboard`
- ✅ Your 5 products pre-loaded (`src/data/products.js`), including
  Vitamin C Serum marked "Coming Soon" with a waitlist form
- ✅ Cart with quantity, persisted in the browser
- ✅ Customer signup/login wired to call a Google Sheet
- ✅ Contact/enquiry form → writes to a Google Sheet
- ✅ Checkout → Razorpay payment → signature verified inside Google Apps
  Script (no separate backend server needed) → order + bill saved to Sheet
- ✅ Admin Panel (`/admin`) to add/edit/delete products, specifications
  included
- ✅ Inventory management: track stock per product, auto "Out of Stock"
  on the storefront when it hits 0, and stock is auto-deducted from the
  Google Sheet the moment a payment is verified
- ✅ Runs entirely without a backend too ("demo mode") so you can preview
  the whole site before wiring up Sheets

## 2. Run it locally

```bash
cd neobonn
npm install
npm run dev
```

Open the printed local URL. The site works immediately in **demo mode**
(cart, login, enquiries all work using your browser's local storage) —
nothing gets lost, but nothing is shared across devices yet. That's what
Step 3 fixes.

## 3. Connect the Google Sheets backend (free, no server)

1. Create a new Google Sheet, name it `Neobonn Database`.
2. Add 6 tabs exactly named: `Users`, `Enquiries`, `Orders`, `Products`,
   `Errors`, `Returns` — with the header columns listed at the top of
   `google-apps-script/Code.gs`.
   (`Errors` powers the "Oops" screen, `Returns` powers Return/Exchange
   requests + automatic refunds — see below.)
3. In the Sheet: **Extensions -> Apps Script**. Delete the placeholder
   code and paste in the entire contents of `google-apps-script/Code.gs`.
4. In the Apps Script editor: **Project Settings (gear icon) -> Script
   Properties -> Add property**:
   - `RAZORPAY_KEY_ID` = your Razorpay key id
   - `RAZORPAY_KEY_SECRET` = your Razorpay key secret
5. In `Code.gs`, replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with your
   Sheet's ID (the long string in its URL between `/d/` and `/edit`).
6. Click **Deploy -> New deployment -> Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Copy the deployment URL it gives you.
7. In the `neobonn` project folder, copy `.env.example` to `.env` and
   paste that URL into `VITE_SHEETS_API_URL`.
8. Restart `npm run dev`. Signups, enquiries, orders and admin product
   edits will now write straight into your Google Sheet — visible in
   real time, filterable, exportable to Excel, no server cost.

### Error handling — the "Oops" screen & trial IDs

If anything breaks for a customer (a crash, a network hiccup, the
backend being unreachable), they never see a raw error message — they
see a friendly animated "Oops" screen with a short **trial ID** (e.g.
`NB-8K2F41`). The real technical detail (message, stack trace, page,
browser) is logged in the background to the `Errors` tab of your
Google Sheet, keyed by that same trial ID.

If a customer reports a trial ID:

- Go to **Admin -> Error Logs**, paste the ID into the search box, and
  you'll see exactly what happened — or
- Open the `Errors` tab in your Google Sheet directly and search the
  `TrialId` column.

Relevant files: `src/components/OopsScreen.jsx` (the UI),
`src/components/ErrorBoundary.jsx` and `GlobalErrorOverlay.jsx` (catch
render crashes and uncaught/network errors respectively),
`src/lib/errorReporting.js` (generates the trial ID and logs it).

### Returns, Exchanges & automatic refunds

From **Account -> My Orders**, once an order is marked `Delivered`,
customers get a **Return / Exchange** button for **7 days**. The form
requires a reason plus at least **one photo and one video** of the
product as proof (this is enforced both in the UI and in the backend).

- Requests land in the `Returns` sheet tab and in
  **Admin -> Returns & Refunds**, where you can open the photos/video
  and **Approve** or **Reject**.
- Approving a **Return** automatically refunds the customer to their
  original payment method via the **Razorpay Refunds API** — no manual
  step in the Razorpay dashboard. If a refund attempt fails (e.g. a
  transient Razorpay error), the request is marked `Failed` and a
  **Retry refund** button appears.
- Approving an **Exchange** doesn't move any money — arrange the
  replacement shipment separately (e.g. by placing a new order for the
  customer).
- Customers get an email at each step (request received, approved/
  rejected, refund initiated); you also get an email when a new
  request comes in.

**One-time setup:** photos/video are uploaded to a Google Drive folder
named `neobonn Returns & Exchanges` (auto-created on first request).
The very first time this runs, Google will prompt to authorize Drive
access for the script — same process as the `testEmailSetup` step
above (Apps Script editor -> run any function once -> Advanced -> Allow).

Relevant files: `src/components/ReturnRequestModal.jsx` (the request
form), `src/lib/fileToBase64.js` (photo/video encoding + size limits),
`src/pages/Account.jsx` (eligibility + "My Returns" list),
`src/pages/admin/AdminDashboard.jsx` (Returns & Refunds tab),
and `processAutomaticRefund` / `handleReviewReturn` in
`google-apps-script/Code.gs`.

### Sender name on customer emails

Every customer-facing email (order confirmation, shipment updates,
login/reset OTP, return confirmation, return approve/reject) is sent
with the display name **"neobonn"** instead of the raw Gmail address —
so customers see "neobonn" in their inbox, not
`info.neobonn@gmail.com`.

**Limitation to know:** this is a *display name*, not a hidden sender —
the underlying Gmail address is still technically present in the email
headers (visible if a customer clicks into "show details"). Fully
replacing it everywhere requires sending from a custom-domain address
(e.g. `orders@neobonn.com` via Google Workspace) or a transactional
email service — not possible with a free personal Gmail account.

## 4. Get a Razorpay account (for real payments)

Sign up at razorpay.com (India-based, supports UPI/cards/netbanking).
Once KYC is approved, get your Key Id + Key Secret from Settings -> API
Keys, and put them in the Script Properties above.

> **Why Razorpay and not "just Sheets"?** Payments must be verified with
> a cryptographic signature so nobody can fake a "success" from the
> browser. Apps Script does that verification for you (see
> `handleVerifyPayment` in Code.gs) — so you still don't pay for a
> traditional server, but the payment step stays secure.

## 4a. Email OTP — login & password reset (free, no SMS cost)

Customers can log in with a one-time email code instead of a password
(toggle on the login page), and reset a forgotten password the same way.
This uses Apps Script's built-in `MailApp.sendEmail` — **completely
free**, since it uses your Google account's own email-sending quota
(no SMS gateway, no per-message charge, nothing for you to pay for).

One thing to know: a plain Gmail account can send **~100 emails/day**
through Apps Script; a Google Workspace account gets a much higher
quota (1,500/day). For a site with meaningful order volume, consider
using a Workspace account for the Sheet, or switching to a transactional
email API (e.g. Resend, Postmark) later if you outgrow the quota.

## 5. Admin Panel

Visit `/admin`, log in with the password from `VITE_ADMIN_PASSWORD` in
your `.env` (default: `atharvluxe2026` — **change this before going
live**). From the dashboard you can add new products (like the Vitamin C
Serum once it's ready), edit specifications, prices, and mark items as
"Coming Soon" or live.

> For a production launch, swap this simple password gate for a proper
> admin login row in the Sheet, checked the same way as customer login.

## 6. Inventory management (stock / out-of-stock)

Every product now has a **Stock** column — the number of units you have
on hand. The storefront reads this live, so:

- When a product's stock reaches **0**, it automatically shows an
  **"Out of Stock"** badge on the shop grid and product page, the "Add
  to Bag" button is replaced with a "Notify Me" form, and the quantity
  people can add to their bag is capped at what's actually available.
- The moment a customer's payment is **verified** (not just placed —
  actually paid), that quantity is automatically subtracted from the
  Products sheet. No manual step needed.
- The backend also double-checks stock right before creating the
  Razorpay order, so two people can't both buy the last unit.

**Managing stock, day to day:** Go to `/admin/dashboard`. Each product
row has a **Stock** column with `−` / `+` buttons and a number box you
can type into directly — changes save instantly to your Google Sheet.
You can also set stock from the full "Edit" form.

**If you already have a live Google Sheet from before this update:**
add a new header `Stock` as the 12th column (column L) on the
`Products` tab, and re-copy the latest `google-apps-script/Code.gs`
into your Apps Script project (Extensions -> Apps Script), then
**Deploy -> Manage deployments -> Edit -> New version -> Deploy** so
the update goes live. Existing product rows will read as 0 stock until
you fill in real quantities from the admin panel.

**Column order no longer matters.** The script reads Products columns
by their header text (row 1), not by position — so accidentally
reordering columns, or a CSV import shifting things, can't silently
corrupt or drop a product anymore. Just keep the 12 header names
exactly as spelled in the schema above somewhere in row 1; they can be
in any order and you can add your own extra columns alongside them.

## 6. Product photos

Product images currently point to placeholder paths like
`/products/multani-mitti.jpg`. Drop your real product photography into
the `public/products/` folder using those exact filenames (or update the
paths in `src/data/products.js` / via the Admin Panel).

## 7. Deploying the site (Vercel — step by step)

**Option A — GitHub + Vercel (recommended, auto-redeploys on future changes)**

1. Create a free account at [github.com](https://github.com) if you don't
   have one, and a free account at [vercel.com](https://vercel.com) (you
   can sign up directly with your GitHub account).
2. On GitHub: click **New repository**, name it `neobonn`, keep it
   **Private** (recommended, since `.env` details shouldn't be public even
   though it's excluded), then follow GitHub's "push an existing folder"
   instructions using the `neobonn` project folder from this zip.
3. On Vercel: **Add New → Project**, select your `neobonn` GitHub repo,
   click **Import**. Vercel auto-detects it's a Vite app — leave the
   build settings as default (Build Command: `npm run build`, Output
   Directory: `dist`).
4. Before clicking Deploy, expand **Environment Variables** and add:
   - `VITE_SHEETS_API_URL` = your Apps Script deployment URL
   - `VITE_ADMIN_PASSWORD` = your admin panel password
   (Do this here, not in `.env` — Vercel keeps these secret and out of
   your repo.)
5. Click **Deploy**. In ~1 minute you'll get a live URL like
   `neobonn.vercel.app` — open it and test the whole site (Home, Shop,
   Cart, Contact form, `/admin`).
6. Any time you want to update the live site later, just edit files and
   push to GitHub again — Vercel redeploys automatically.

**Option B — Instant deploy without GitHub (quickest for a first look)**

1. Install the Vercel CLI once: `npm install -g vercel`
2. Inside the `neobonn` folder, run: `vercel`
3. Follow the prompts (log in, confirm project settings). It will give
   you a live `.vercel.app` URL immediately.
4. Add your environment variables afterwards by running
   `vercel env add VITE_SHEETS_API_URL` and
   `vercel env add VITE_ADMIN_PASSWORD`, then redeploy with `vercel --prod`.

Either way, the `vercel.json` file already included in this project
tells Vercel to route all URLs (like `/products/multani-mitti-soap`)
back through `index.html`, so page refreshes and direct links to any
page work correctly — this is required for React Router apps.

## 8. Connecting your own domain (after Vercel is live)

Once the site is live on a `.vercel.app` URL, go to your Vercel project
→ **Settings → Domains** → add your domain (e.g. `neobonn.com` once
purchased). Vercel will show you 1–2 DNS records to add at your domain
registrar (GoDaddy, Namecheap, etc.) — usually just an `A` record and a
`CNAME`. It updates automatically once DNS propagates (a few minutes to
a few hours).

## 9. Company details already wired in

- Brand: neobonn · Atharv Luxe Co.
- Phone: +91 9654873069, +91 9310721874
- Address: Block B-2, House No. 239, Paschim Vihar, New Delhi - 110063
- Email: Connect@atharvtechco.com

Edit these any time in `src/data/company.js`.

---

## Suggested next steps

1. Get real product photography and drop it into `public/products/`.
2. Wire up the Sheets backend (Step 3) and test a full signup -> enquiry
   -> order flow.
3. Get Razorpay KYC done in parallel — it can take a few days.
4. Swap the admin password gate for a real admin-login row before launch.
5. Buy a domain (e.g. neobonn.com) and point it at your Vercel/Netlify
   deployment.
