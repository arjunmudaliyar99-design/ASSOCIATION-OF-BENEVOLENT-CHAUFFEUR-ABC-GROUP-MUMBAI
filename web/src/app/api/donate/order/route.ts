import { NextResponse } from "next/server";
import { z } from "zod";
import { client, MAX_RUPEES, MIN_RUPEES } from "@/lib/razorpay";
import { limited, run } from "@/lib/db";
import { clientIp } from "@/lib/auth";
import { causes } from "@/data/site";
import { errorCode, firstError, PAN } from "@/lib/validate";

const schema = z.object({
  amount: z.coerce.number().refine((n) => Number.isFinite(n) && n >= MIN_RUPEES && n <= MAX_RUPEES && Math.round(n * 100) === n * 100,
    `Enter an amount between ₹${MIN_RUPEES} and ₹${MAX_RUPEES.toLocaleString("en-IN")}.`),
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: z.string().trim().max(120).email("Enter a valid email address for your receipt."),
  phone: z.string().optional().transform((s) => (s ?? "").replace(/[^\d+]/g, "").slice(0, 15)),
  pan: z.string().optional().transform((s) => (s ?? "").toUpperCase()).refine((s) => !s || PAN.test(s), "Enter a valid PAN, like ABCDE1234F."),
  cause: z.string().optional().transform((s) => (causes.some((c) => c.id === s) ? s! : "general")),
});

export async function POST(req: Request) {
  const rp = client();
  if (!rp) return NextResponse.json({ error: "Online donations are not switched on yet. Please contact us to donate.", code: "notOn" }, { status: 503 });
  if (await limited(`order:${await clientIp()}`, 20, 600)) return NextResponse.json({ error: "Too many attempts. Please wait a few minutes.", code: "tooMany" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error), code: errorCode(parsed.error) }, { status: 400 });
  const d = parsed.data;
  const paise = Math.round(d.amount * 100);

  try {
    const order = await rp.orders.create({ amount: paise, currency: "INR", receipt: `don_${Date.now()}`, notes: { kind: "donation", name: d.name, email: d.email, cause: d.cause } });
    await run("INSERT INTO payments (order_id, kind, amount_paise, name, email, phone, cause, pan) VALUES (?, 'donation', ?, ?, ?, ?, ?, ?)",
      [order.id, paise, d.name, d.email, d.phone || null, d.cause, d.pan || null]);
    return NextResponse.json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) {
    console.error("donation order failed", e);
    return NextResponse.json({ error: "Couldn't start the payment. Please try again in a minute.", code: "startFail" }, { status: 502 });
  }
}
