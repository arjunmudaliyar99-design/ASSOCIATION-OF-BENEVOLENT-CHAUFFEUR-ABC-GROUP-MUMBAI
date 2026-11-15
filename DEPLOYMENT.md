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

## Upgrade option: paid India server (≈ ₹8,500 / year for the first 2 years)

Not used at launch (November 2026: the association chose the free plan). Move here if the site outgrows the free plan. One small server in India runs the website, backend, database and member documents. No usage limits that pause the site, no cold starts.

Prices below were checked on hostinger.com/in on 15 Nov 2026 and include 18% GST.

| Part | Service | Cost |
|---|---|---|
| Server | **Hostinger KVM 1 VPS**, India location, **24-month plan** (₹599/mo): 1 vCPU, 4 GB RAM, 50 GB NVMe | **₹16,963.68 for 2 years** (≈ ₹8,482/yr). Renews at ₹999/mo + GST |
| | 12-month plan instead (₹699/mo) | ₹9,897.84 for 1 year. Renews at ₹1,149/mo + GST |
| Domain (`abcgroupmumbai.com`, available) | Free for year 1 with the VPS plan | ₹0, then ₹1,499/yr + GST |
| HTTPS | Caddy (Let's Encrypt), auto-renewing | ₹0 |
| CDN + protection | Cloudflare free plan | ₹0 |
| Uptime alerts | UptimeRobot free | ₹0 |
| Off-site backups | Trust Google Drive (15 GB free) | ₹0 |
| **Total** | | **≈ ₹8,500 / year for 2 years; ≈ ₹16,000 / year after renewal** |

Hostinger's optional daily auto-backup (₹299/mo) isn't needed, because `deploy/backup.sh` backs up nightly to Google Drive for free.

Alternative: AWS Lightsail Mumbai, 2 GB plan with public IPv4 ($12/month + 18% GST, ≈ ₹14,400/year). It's more expensive but billed monthly. Avoid 1 GB servers: building the site needs about 1.5 GB of memory.

Prices change. Check hostinger.in/vps-hosting before paying. Pay with the trust's card, and note that renewal can cost more than the first year.

### Set up the server (one time, about 1 hour)
1. **Buy the VPS** with the trust Gmail. OS: **Ubuntu 24.04**, location **India**. Add your SSH key.
2. **Point the domain:** add the domain to Cloudflare (free). Create `A` records for `@` and `www` → the server's IP, set to **DNS only** (grey cloud) for now.
3. **Log in as root and prepare the server:**
   ```bash
   apt update && apt -y upgrade
   apt -y install git sqlite3 rclone ufw
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt -y install nodejs
   apt -y install caddy
   ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
   adduser --disabled-password --gecos "" abc
   echo "abc ALL=(root) NOPASSWD: /usr/bin/systemctl restart abc-web" > /etc/sudoers.d/abc
   ```
4. **Get the code (as user `abc`):**
   ```bash
   su - abc
   git clone <repo URL> site && cd site/web
   mkdir -p data
   ```
   Create `web/.env.production` with the values from `web/.env.example`. Use `DATABASE_URL=file:./data/abc.db` and leave `DATABASE_AUTH_TOKEN` empty, so there is no Turso. Then build:
   ```bash
   npm ci && npm run build
   npm run admin:create    # first admin login
   ```
5. **Start it (as root):**
   ```bash
   cp /home/abc/site/deploy/abc-web.service /etc/systemd/system/
   systemctl daemon-reload && systemctl enable --now abc-web
   cp /home/abc/site/deploy/Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy
   ```
   Open `https://abcgroupmumbai.com`. HTTPS turns on automatically within a minute.
6. **Turn on Cloudflare:** switch both DNS records to **Proxied** (orange cloud). Then set SSL/TLS mode to **Full (strict)**. Cloudflare now caches photos and pages close to visitors, and it blocks bot traffic.
7. **Backups (as `abc`):** run `rclone config` and add a Google Drive remote named `gdrive`, signed in with the trust Gmail. Then add the cron line from `deploy/backup.sh`. Test it once with `~/site/deploy/backup.sh`.
8. **Uptime monitor:** set up UptimeRobot as in step 7 below. You only need it for alerts here; the server never sleeps.
9. **Razorpay webhook and go-live:** same as steps 5–6 below.

### Updating the site later
```bash
ssh abc@<server-ip>
~/site/deploy/update.sh
```
This pulls the latest code, rebuilds, restarts and checks `/api/health`. The site is down for a few seconds.

### Monthly upkeep (10 minutes)
- `apt update && apt -y upgrade` as root (Ubuntu installs security fixes automatically).
- Check that last night's backup is in Google Drive.

---

## Chosen plan: free hosting (Netlify + Turso)

Chosen in November 2026. Fixed cost is only the domain.

### Free plan budget

Everything (website, backend, database and member documents) fits on **free plans**. The only fixed cost is the **domain**.

| Part | Service | Plan | Cost |
|---|---|---|---|
| Website + backend | **Netlify** | Free. Commercial use is allowed. | ₹0 |
| Database + member documents | **Turso** | Free: 5 GB storage, 500 million row reads/month | ₹0 |
| CDN + HTTPS | Included with Netlify | – | ₹0 |
| Domain | Cloudflare Registrar / GoDaddy / Hostinger | `.com` | **₹900–1,500 / year** |
| Payments | Razorpay | No setup or yearly fee | ≈2% + GST per payment |
| **Total fixed** | | | **≈ ₹900–1,500 / year** |

That leaves about ₹500–2,000 of the ₹2,000–3,000 budget spare. Keep it for domain renewal price increases.

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
| `NEXT_PUBLIC_SITE_URL` | `https://abcgroupmumbai.com` |
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
Netlify → **Domain management → Add a domain** → `abcgroupmumbai.com`. Follow Netlify's DNS instructions at your registrar. HTTPS turns on automatically.

### 5. Razorpay webhook
Razorpay → **Settings → Webhooks → Add new webhook**
- URL: `https://abcgroupmumbai.com/api/razorpay/webhook`
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
  - `https://abcgroupmumbai.com/` (is the site up?)
  - `https://abcgroupmumbai.com/api/health` (keeps the server and database awake; answers `{"ok":true}`)
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
