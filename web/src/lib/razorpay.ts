import crypto from "node:crypto";

export const MIN_RUPEES = 1;
export const MAX_RUPEES = 1_000_000; // ₹10 lakh per payment; larger gifts by bank transfer

type OrderInput = { amount: number; currency: string; receipt: string; notes?: Record<string, string | undefined> };
type Order = { id: string; amount: number; currency: string };

/** Minimal Razorpay Orders API client over fetch (works on Node and Cloudflare Workers). */
export function client() {
  const key_id = process.env.RAZORPAY_KEY_ID, key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  const auth = "Basic " + Buffer.from(`${key_id}:${key_secret}`).toString("base64");
  return {
    orders: {
      async create(input: OrderInput): Promise<Order> {
        const res = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
        return res.json() as Promise<Order>;
      },
    },
  };
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Checkout signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPayment(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhook(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
