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

## Pick one hosting option

| | **Option A: Vercel + Turso** (recommended) | **Option B: One small server (VPS)** |
|---|---|---|
| Speed | Pages served from a global CDN, including Mumbai | Fast in India if the server is in Mumbai or Bangalore. Add Cloudflare (free) for CDN. |
| Setup effort | About 30 minutes, no server to look after | About 2 hours, plus occasional OS updates |
| Updates | Push to GitHub and it deploys automatically | Run 3 commands on the server |
| Backups | Turso handles database backups | You set a daily backup (steps below) |
| Yearly cost | **About ₹21,400** (Vercel Pro) or **about ₹1,000** (Hobby, see note) | **About ₹6,000–8,000** |

**About Vercel's free plan:** Vercel's free "Hobby" plan is meant for personal, non-commercial use. A trust collecting membership fees is a grey area, so budget for **Pro ($20/month)**. You can start on Hobby while testing.

---

## Yearly budget

### Option A: Vercel Pro + Turso

| Item | Cost | Billed |
|---|---|---|
| Domain (.org) | ₹800–1,200 | Yearly |
| Vercel Pro | $20/month ≈ **₹20,400/year** | Monthly |
| Turso database (Free plan: 5 GB, 500M row reads/month) | ₹0 | – |
| Razorpay | ₹0 fixed. About **2% + 18% GST on the fee** per payment. | Per payment |
| **Total fixed** | **≈ ₹21,400 / year** | |

### Option B: VPS

| Item | Cost | Billed |
|---|---|---|
| Domain (.org) | ₹800–1,200 | Yearly |
| VPS, 1 vCPU / 1–2 GB RAM, India region (DigitalOcean Bangalore $6/month, or Hostinger KVM 1) | ≈ ₹5,000–6,500 / year | Monthly or yearly |
| DigitalOcean automatic weekly backups (optional, 20% of server) | ≈ ₹1,200 / year | Monthly |
| Cloudflare (CDN + SSL) | ₹0 | – |
| Razorpay | About 2% + GST per payment | Per payment |
| **Total fixed** | **≈ ₹6,000–8,900 / year** | |

### What Razorpay keeps (both options)

| Payment | Razorpay fee (≈2% + GST) | Reaches the trust |
|---|---|---|
| ₹365 membership | ≈ ₹9 | ≈ ₹356 |
| ₹1,000 donation | ≈ ₹24 | ≈ ₹976 |
| ₹3,000 membership | ≈ ₹71 | ≈ ₹2,929 |

Money reaches the trust's bank account 2–3 working days after each payment.

---

## Before you start (one time)

1. **Domain:** buy it, for example on Cloudflare Registrar, GoDaddy or Hostinger. Put the **trust** as the owner and turn on auto-renew.
2. **Razorpay account:** create it in the trust's name, choose **NGO / Trust**, and upload the trust's documents. The signatory must be available for OTPs.
3. **Razorpay test keys:** Razorpay → Account & Settings → API Keys → Generate **Test** keys. Use these until KYC is approved.
4. **GitHub:** push this repo.

---

## Option A: Vercel + Turso, step by step

### 1. Create the database (Turso)
1. Sign up at turso.tech.
2. **Create Database:** name `abc-mumbai`, location **Mumbai (aws-ap-south-1)**.
3. Copy the **database URL** (`libsql://abc-mumbai-….turso.io`) and **create a token**.

### 2. Deploy on Vercel
1. vercel.com → **Add New → Project** → import the GitHub repo.
2. **Root Directory:** `web`
3. **Settings → Functions → Region:** **Mumbai (bom1)**, so the backend sits next to the database.
4. **Environment Variables:**

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://abcgroupmumbai.org` |
| `DATABASE_URL` | the `libsql://…` URL |
| `DATABASE_AUTH_TOKEN` | the Turso token |
| `AUTH_SECRET` | 64 random characters (see the command in `web/.env.example`) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | from Razorpay |
| `RAZORPAY_WEBHOOK_SECRET` | any long random string, also typed into Razorpay in step 5 |

5. Click **Deploy**. The database tables are created automatically on first use.

### 3. Create the admin logins
On your computer, inside `web/`, put the same `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in `.env.local`, then run:
```bash
npm run admin:create -- secretary 'a-long-password-here'
```
Repeat for each committee member who needs access. Running it again with the same name resets that password.

### 4. Connect the domain
Vercel → Project → **Settings → Domains** → add `abcgroupmumbai.org` and `www.abcgroupmumbai.org`, then add the DNS records Vercel shows at your registrar. HTTPS turns on automatically.

### 5. Razorpay webhook
Razorpay → **Settings → Webhooks → Add new webhook**
- URL: `https://abcgroupmumbai.org/api/razorpay/webhook`
- Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `payment.failed`, `order.paid`

### 6. Test, then go live
1. With **test keys**, make one donation and one membership payment using Razorpay's test UPI or card details. Check both appear in **Admin → Donations / Members**.
2. Once KYC is approved, generate **Live** keys, replace the two key variables in Vercel, and create a **live** webhook (step 5 again in Live mode).
3. **Redeploy** (Vercel → Deployments → Redeploy).
4. Make one real ₹1 donation, confirm it in Admin, and refund it from the Razorpay dashboard.

---

## Option B: VPS, step by step

### 1. Create the server
- DigitalOcean → Droplet → **Bangalore**, Ubuntu 24.04, Basic $6 plan (1 GB). Turn on backups if you want them.
- Or Hostinger VPS **KVM 1** in India.

### 2. Install (as root on the server)
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs git caddy
adduser --disabled-password --gecos "" abc && su - abc
git clone https://github.com/arjunmudaliyar99-design/ASSOCIATION-OF-BENEVOLENT-CHAUFFEUR-ABC-GROUP-MUMBAI.git site
cd site/web && cp .env.example .env.local   # then edit .env.local: keep DATABASE_URL=file:./data/abc.db
npm ci && npm run build
npm run admin:create -- secretary 'a-long-password-here'
```

### 3. Keep it running (systemd)
Create `/etc/systemd/system/abc.service`:
```ini
[Unit]
Description=ABC website
After=network.target
[Service]
User=abc
WorkingDirectory=/home/abc/site/web
ExecStart=/usr/bin/npm run start
Restart=always
Environment=NODE_ENV=production PORT=3000
[Install]
WantedBy=multi-user.target
```
```bash
systemctl enable --now abc
```

### 4. HTTPS (Caddy)
`/etc/caddy/Caddyfile`:
```
abcgroupmumbai.org, www.abcgroupmumbai.org {
  encode zstd gzip
  reverse_proxy localhost:3000
}
```
```bash
systemctl reload caddy
```
Point the domain's `A` record at the server IP. Caddy gets the SSL certificate by itself. For extra speed, put the domain on **Cloudflare (free)** with proxy on and SSL mode **Full (strict)**.

### 5. Daily database backup
```bash
crontab -e   # as user abc, add:
0 2 * * * cp /home/abc/site/web/data/abc.db /home/abc/backups/abc-$(date +\%F).db && find /home/abc/backups -mtime +30 -delete
```
Also download **Members** and **Donations** CSVs from Admin once a month and keep them in the trust's Google Drive.

### 6. Updating later
```bash
cd ~/site && git pull && cd web && npm ci && npm run build && sudo systemctl restart abc
```

Then do the Razorpay webhook and go-live steps (Option A, steps 5–6).

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

## Automated tests

```bash
cd web && npm test
```
11 end-to-end tests cover:
- donations: validation and paying
- the webhook-only path, used when the browser closes before the payment finishes
- forged signatures being rejected
- membership pricing and renewals
- blocking rejected members
- Excel import: bad rows and repeat imports
- admin access protection

## Before launch: things to confirm with the association

- [ ] Final membership prices. Currently ₹365 for 1 year and ₹3,000 for 3 years, editable in **Admin → Plans & prices**.
- [ ] 80G status. Turn on with `features.has80G = true` in `web/src/data/site.ts`.
- [ ] Existing members list, for **Admin → Import members**.
- [ ] Names of the committee members who need admin logins.
