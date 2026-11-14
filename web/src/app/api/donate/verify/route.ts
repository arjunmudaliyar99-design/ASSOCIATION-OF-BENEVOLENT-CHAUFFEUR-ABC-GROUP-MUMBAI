import { NextResponse } from "next/server";
import { verifyPayment } from "@/lib/razorpay";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const { razorpay_order_id: o, razorpay_payment_id: p, razorpay_signature: s } = b as Record<string, string>;
  if (!o || !p || !s || !verifyPayment(o, p, s)) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true, paymentId: p });
}
