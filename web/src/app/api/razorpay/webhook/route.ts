import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/razorpay";
import { markFailed, markPaid } from "@/lib/payments";

/**
 * Razorpay calls this for every payment, even if the donor closed the browser.
 * It is the source of truth: the payment is saved here even if the browser step never ran.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhook(raw, sig)) return NextResponse.json({ ok: false }, { status: 400 });

  const evt = JSON.parse(raw);
  const p = evt?.payload?.payment?.entity;
  if (p?.order_id) {
    if (evt.event === "payment.captured" || evt.event === "order.paid") await markPaid(p.order_id, p.id);
    else if (evt.event === "payment.failed") await markFailed(p.order_id);
  }
  return NextResponse.json({ ok: true });
}
