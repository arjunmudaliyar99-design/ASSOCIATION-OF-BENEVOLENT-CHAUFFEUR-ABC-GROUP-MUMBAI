import { NextResponse } from "next/server";
import { verifyPayment } from "@/lib/razorpay";
import { markPaid } from "@/lib/payments";

/** Called by the browser right after Razorpay Checkout succeeds (donations and memberships). */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const o = String(b.razorpay_order_id ?? ""), p = String(b.razorpay_payment_id ?? ""), s = String(b.razorpay_signature ?? "");
  if (!o || !p || !s || !verifyPayment(o, p, s)) return NextResponse.json({ ok: false }, { status: 400 });
  const r = await markPaid(o, p);
  if (!r) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, paymentId: p, kind: r.kind, token: r.token });
}
