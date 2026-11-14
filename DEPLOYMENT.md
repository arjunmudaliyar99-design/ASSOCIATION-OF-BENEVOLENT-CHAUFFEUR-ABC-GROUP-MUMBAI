# ABC Group Mumbai website: launch plan

## Tech stack

| Part | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (React 19) + TypeScript** | Pages are pre-built as static HTML, so they open instantly |
| Styling | **Tailwind CSS** | Small CSS, consistent yellow/navy/red theme |
| Animation | **Framer Motion** | Smooth 60fps springs; turns off when the phone asks for reduced motion |
| Images | **next/image** | Serves WebP/AVIF at the right size for each phone, tablet or PC, with blurred previews |
| Payments | **Razorpay Checkout + Orders API + webhook** | UPI, cards, netbanking, wallets |
| Hosting | **Vercel** (free Hobby plan to start) | Global CDN with a Mumbai edge, HTTPS, auto-deploy from GitHub |

## Costs per year

| Item | Cost |
|---|---|
| Domain `.org` or `.in` | ₹800 – ₹1,200 |
| Vercel hosting | ₹0 (Hobby plan). The Pro plan ($20/month) only becomes worth it at very high traffic or when you need a team. |
| Razorpay | ₹0 setup, about 2% per donation (+18% GST on the fee) |
| Email (`info@yourdomain`) | ₹0 with Zoho Mail free plan (optional) |
| **Total** | **About ₹1,000 a year plus Razorpay fees** |

## Step 1: Buy the domain (about 15 minutes)

1. Pick a name: `abcgroupmumbai.org` (first choice), or `abcgroupmumbai.in`.
2. Buy it at **Cloudflare Registrar**, **GoDaddy** or **Hostinger**. Cloudflare sells at cost with no markup on renewals.
3. Turn on auto-renew, and register it in the **association's name and email**, not a personal one.

## Step 2: Razorpay account (2–7 days for approval)

1. Sign up at razorpay.com, choose **NGO / Trust**.
2. Upload: registration certificate (Public Trust + Society), the association's PAN, a cancelled cheque or bank statement in the association's name, and the authorised signatory's PAN and Aadhaar.
3. ⚠ The PAN spells the name **"CHAUFEUR"** (one F). The bank account and Razorpay must use **exactly** the same spelling.
4. Website URL for review: your new domain. The site already has the Privacy, Terms, Refund and Contact pages Razorpay checks for.
5. Until approved, use the **Test Mode** keys (`rzp_test_…`) to try everything.

## Step 3: Deploy on Vercel (about 20 minutes)

1. Push this repo to GitHub (it's already connected).
2. vercel.com → **Add New Project** → import the repo → set **Root Directory = `web`**.
3. Add environment variables (see `web/.env.example`):
   - `NEXT_PUBLIC_SITE_URL` = `https://abcgroupmumbai.org`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
4. Click **Deploy**. Every push to `main` now redeploys automatically, and every PR gets a preview link.

## Step 4: Connect the domain (10 minutes, plus up to a few hours for DNS)

1. Vercel → Project → **Settings → Domains** → add `abcgroupmumbai.org` and `www.abcgroupmumbai.org`.
2. At the registrar, add the DNS records Vercel shows (an `A` record to `76.76.21.21` and a `CNAME` for `www` to `cname.vercel-dns.com`).
3. HTTPS turns on by itself.

## Step 5: Switch on live donations

1. Razorpay → **Webhooks → Add**: URL `https://abcgroupmumbai.org/api/razorpay/webhook`, event `payment.captured`, and the same secret as `RAZORPAY_WEBHOOK_SECRET`.
2. Swap the test keys for **live** keys in Vercel and redeploy.
3. Make one real ₹1 donation, check it in the Razorpay dashboard, then refund it.

## Step 6: After launch

| Task | Where |
|---|---|
| Google listing | Search Console → add domain → submit `/sitemap.xml` |
| Google Maps | Create a Google Business Profile for the Santacruz office |
| Speed check | pagespeed.web.dev, aiming for 90+ on mobile |
| Visitor stats | Vercel → Analytics (free tier) |
| Share links | `/donate`, `/donate?cause=education`, `/donate?cause=ashram`, `/donate?cause=medical` |

## Speed and device support built in

- Every page except payment endpoints is **pre-built static HTML**, served from a CDN.
- Photos are resized per device and converted to **WebP/AVIF**. Each shows a blurred preview immediately, so there are no blank boxes.
- Fonts are self-hosted by Next.js with `display: swap`, so text never waits on a font.
- Layouts are tested at **phone (375px), tablet (768px) and PC (1280px)**, with no sideways scrolling.
- Animations use GPU transforms only, and turn off for users who ask for reduced motion.
- Razorpay's script loads **only when someone taps Donate**.

## Phase 2 (next)

- Database (Supabase) to store every donation, plus an admin page with CSV export
- Branded receipt emails (Resend), with 80G receipts if the trust has 80G
- News/blog with an editor trustees can use from a phone (Sanity CMS)
- Campaign pages with a progress bar
- Driver jobs board, Hindi/Marathi
