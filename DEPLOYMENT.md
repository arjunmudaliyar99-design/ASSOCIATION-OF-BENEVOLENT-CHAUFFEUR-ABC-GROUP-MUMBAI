# ABC Group Mumbai: production deployment guide

Prices below were checked when this was written and use **$1 ≈ ₹85**. Check each provider's page before paying.

---

## What gets deployed

| Part | What it is |
|---|---|
| Website | Next.js 15 (React 19), mostly pre-built static pages |
| Backend | API routes in the same app: payments, webhook, admin dashboard. **No separate server.** |
| Database | libSQL (SQLite-compatible). One file on a server, or Turso in the cloud. |
| Payments | Razorpay Checkout + Orders API + webhook |

Everything lives in the `web/` folder. One deploy updates the site, the backend and the admin dashboard together.

---

## Hosting plan for a ₹2,000–3,000 yearly budget

Everything (website, backend, database and member documents) fits on **free plans**. The only fixed cost is the **domain**.

| Part | Service | Plan | Cost |
|---|---|---|---|
| Website + backend | **Netlify** | Free. Commercial use is allowed. | ₹0 |
| Database + member documents | **Turso** | Free: 5 GB storage, 500 million row reads/month | ₹0 |
| CDN + HTTPS | Included with Netlify | – | ₹0 |
| Domain | Cloudflare Registrar / GoDaddy / Hostinger | `.org` (or `.in` for less) | **₹800–1,200 / year** |
| Payments | Razorpay | No setup or yearly fee | ≈2% + GST per payment |
| **Total fixed** | | | **≈ ₹800–1,200 / year** |

That leaves ₹1,000–2,000 of the budget spare. Keep it for domain renewal price increases.

**Will the free plans be enough?**
- **Storage:** 800 members × 3 documents × about 300 KB is about **0.7 GB**, well inside Turso's 5 GB. The join form shrinks phone photos before upload.
- **Traffic:** a trust website with a few thousand visits a month is far below Netlify's free limits.
- **Limits change:** check the current limits on netlify.com/pricing and turso.tech/pricing before launch. If a limit is ever reached, the site shows an error and nothing is lost. You then decide whether to upgrade.

**Speed:** public pages are pre-built and served from Netlify's CDN, so they load fast in India. Payment and admin requests go to Netlify's server functions, which run in the US by default. **Create the Turso database in the same region as those functions** (for example AWS us-east-2, Ohio) so each database call stays local. This adds a fraction of a second to the payment step only, not to page loads.

**Another free option: Vercel Hobby.** Its functions can run in **Mumbai**, which makes payments and admin slightly faster, but Vercel's free plan is officially for non-commercial use only. Netlify is the safer free choice for a trust taking payments.

---

## Before you start (one time)

1. **Domain:** buy it, for example on Cloudflare Registrar, GoDaddy or Hostinger. Put the **trust** as the owner and turn on auto-renew.
2. **Razorpay account:** create it in the trust's name, choose **NGO / Trust**, and upload the trust's documents. The signatory must be available for OTPs.
3. **Razorpay test keys:** Razorpay → Account & Settings → API Keys → Generate **Test** keys. Use these until KYC is approved.
4. **GitHub:** push this repo.

---

## Deploy step by step (Netlify + Turso)

### 1. Create the database (Turso)
1. Sign up at turso.tech (free).
2. **Create Database:** name `abc-mumbai`, location **AWS us-east-2 (Ohio)**, or the region nearest your Netlify functions.
3. Copy the **database URL** (`libsql://abc-mumbai-….turso.io`) and **create a token**.

### 2. Deploy the site (Netlify)
1. Sign up at netlify.com (free) → **Add new site → Import from GitHub** → choose the repo.
2. **Base directory:** `web` · **Build command:** `npm run build` · **Publish directory:** `web/.next`. Netlify detects Next.js and sets this up automatically.
3. **Site configuration → Environment variables:**

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://abcgroupmumbai.org` |
| `DATABASE_URL` | the `libsql://…` URL |
| `DATABASE_AUTH_TOKEN` | the Turso token |
| `AUTH_SECRET` | 64 random characters (see the command in `web/.env.example`) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | from Razorpay |
| `RAZORPAY_WEBHOOK_SECRET` | any long random string, also typed into Razorpay in step 5 |

4. **Deploy.** The database tables are created automatically on first use. Every push to GitHub redeploys the site.

### 3. Create the admin logins
On your computer, inside `web/`, put the same `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in `.env.local`, then run:
```bash
npm run admin:create -- secretary 'a-long-password-here'
```
Repeat for each committee member who needs access. Running it again with the same name resets that password.

### 4. Connect the domain
Netlify → **Domain management → Add a domain** → `abcgroupmumbai.org`. Follow Netlify's DNS instructions at your registrar. HTTPS turns on automatically.

### 5. Razorpay webhook
Razorpay → **Settings → Webhooks → Add new webhook**
- URL: `https://abcgroupmumbai.org/api/razorpay/webhook`
- Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `payment.failed`, `order.paid`

### 6. Test, then go live
1. With **test keys**:
   - make one donation and one membership payment with Razorpay's test UPI or card
   - upload three sample documents on the membership form
   - check that everything appears in **Admin**, and that the documents open
2. Once KYC is approved, put the **Live** keys into Netlify, add a **live** webhook (step 5 again in Live mode), and redeploy.
3. Make one real ₹1 donation, confirm it in Admin, and refund it from the Razorpay dashboard.

### 7. Keep it fast and inside the free limits
- **Uptime monitor (free):** at uptimerobot.com, add two HTTP monitors at **5-minute** intervals, with alerts to the trust Gmail:
  - `https://abcgroupmumbai.org/` (is the site up?)
  - `https://abcgroupmumbai.org/api/health` (keeps the server and database awake; answers `{"ok":true}`)
  Don't go below 5 minutes; it only uses up free allowance.
- **Built in:** when a visitor starts typing in the Donate or Join form, the page calls `/api/health` once in the background, so the server is awake by the time they press Pay.
- **Netlify usage alerts:** turn them on (Team settings → Usage / billing notifications).
- **Media:** put videos on YouTube and embed them; never upload video files. Keep gallery photos under about 300 KB each (today: 6 MB in total).
- **Expected use:** about 5–10 membership payments a month, one donation drive a year and a few thousand visits a month. That is a small fraction of the free plans. If a limit is ever reached, the site pauses until the next month; no data is lost because it lives in Turso.
- **Fallback if usage grows:** a small Mumbai VPS (Hostinger KVM 1 or AWS Lightsail $5, about ₹350–450/month on a yearly plan) running `npm run build && npm run start` with `DATABASE_URL=file:./data/abc.db`, plus a nightly copy of `data/abc.db` to Google Drive.

### Backups
- **Database:** Turso keeps automatic backups.
- **Monthly:** download the **Members** and **Donations** CSVs from Admin and store them in the trust's Google Drive.

---

## Security that's already built in

- Payments are verified with Razorpay's **HMAC signatures**, both in the browser step and in the webhook. Forged requests are rejected.
- **Prices come from the server.** The browser can't change a membership price.
- Every payment is recorded **exactly once**, even if Razorpay notifies us several times.
- **Admin access:**
  - passwords stored with bcrypt
  - sessions use an httpOnly, SameSite=strict cookie that expires after 12 hours
  - 8 login attempts per 15 minutes per IP
  - every admin action is logged
- Rate limits on payment orders and the membership lookup page.
- Security headers on every page: CSP allowing only this site and Razorpay, HSTS, no framing, nosniff.
- Excel export protects against formula injection.
- `/admin`, `/membership` and the API are hidden from search engines.
- **Member documents** (Aadhaar, PAN, licence):
  - stored privately in the database, never in a public folder
  - viewable only by signed-in admins, and every view is logged
  - checked by their actual file contents (JPG, PNG, WebP or PDF only, under 1.2 MB)
  - unfinished sign-ups' documents are deleted after 2 days

## Automated tests

```bash
cd web && npm test
```
12 end-to-end tests cover:
- donations: validation and paying
- the webhook-only path, used when the browser closes before the payment finishes
- forged signatures being rejected
- membership pricing and renewals
- document uploads: required, fake files rejected, linked after payment
- blocking rejected members
- Excel import: bad rows and repeat imports
- admin access protection

## Before launch: things to confirm with the association

- [x] Final membership prices: confirmed at ₹365 for 1 year and ₹3,000 for 10 years, editable in **Admin → Plans & prices**.
- [ ] 80G status. Turn on with `features.has80G = true` in `web/src/data/site.ts`.
- [ ] Existing members list, for **Admin → Import members**.
- [ ] Names of the committee members who need admin logins.
