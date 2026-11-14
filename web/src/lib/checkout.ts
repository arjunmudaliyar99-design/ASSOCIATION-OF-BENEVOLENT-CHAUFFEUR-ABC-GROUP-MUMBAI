"use client";
import { site } from "@/data/site";

type RzpResponse = Record<string, string>;
type Rzp = { open: () => void; on: (e: string, cb: (r: { error: { description: string } }) => void) => void };
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => Rzp } }

let loading: Promise<boolean> | null = null;
let warmed = false;
/** Loads Razorpay's script once. Call early (on focus/hover) so the payment window opens instantly. */
export function preloadCheckout() {
  if (typeof window === "undefined") return Promise.resolve(false);
  // Wake the server and database once while the visitor fills the form, so Pay has no cold start.
  if (!warmed) { warmed = true; void fetch("/api/health", { cache: "no-store" }).catch(() => {}); }
  if (window.Razorpay) return Promise.resolve(true);
  loading ??= new Promise<boolean>((res) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => res(true);
    s.onerror = () => { loading = null; res(false); };
    document.body.appendChild(s);
  });
  return loading;
}

/**
 * Creates the order on our server, opens Razorpay, verifies the signature.
 * Resolves with the verify response, or rejects with a readable message.
 */
export async function pay(opts: { endpoint: string; body: unknown; description: string; prefill: { name?: string; email?: string; contact?: string } }) {
  const [ok, r] = await Promise.all([
    preloadCheckout(),
    fetch(opts.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(opts.body) }),
  ]);
  const data = await r.json().catch(() => ({ error: "Something went wrong. Please try again." }));
  if (!r.ok) throw Object.assign(new Error(data.error), { code: data.code, doc: data.doc });
  if (!ok || !window.Razorpay) throw Object.assign(new Error("Couldn't load the payment window."), { code: "loadFail" });

  return new Promise<{ ok: boolean; paymentId: string; token?: string; dismissed?: boolean }>((resolve, reject) => {
    const rz = new window.Razorpay!({
      key: data.keyId, order_id: data.orderId, amount: data.amount, currency: "INR",
      name: site.name, description: opts.description, image: `${location.origin}/logo.jpg`,
      prefill: opts.prefill, theme: { color: "#1F1D6B" }, retry: { enabled: true, max_count: 3 },
      modal: { ondismiss: () => resolve({ ok: false, paymentId: "", dismissed: true }), confirm_close: true },
      handler: async (resp: RzpResponse) => {
        // Retry verify a couple of times on flaky mobile networks. The webhook also records the payment.
        for (let i = 0; i < 3; i++) {
          try {
            const v = await fetch("/api/donate/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) }).then((x) => x.json());
            return resolve({ ok: !!v.ok, paymentId: resp.razorpay_payment_id, token: v.token });
          } catch { await new Promise((w) => setTimeout(w, 800 * (i + 1))); }
        }
        resolve({ ok: false, paymentId: resp.razorpay_payment_id });
      },
    });
    // Failed attempts are shown and retried inside Razorpay's own window.
    void reject;
    rz.open();
  });
}

/** Turns a payment error into a message in the visitor's language. */
export function errorText(x: unknown, errors: Record<string, string>, docs: Record<string, string> = {}, fallback = "") {
  const e = x as { code?: string; doc?: string; message?: string };
  const tpl = e.code ? errors[e.code] : undefined;
  if (tpl) return tpl.replace("{doc}", e.doc ? docs[e.doc] ?? e.doc : "");
  return e.message || fallback;
}
