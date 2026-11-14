import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/razorpay";

/**
 * Razorpay calls this for every payment, even if the donor closed the browser.
 * Phase 1 logs captured payments (visible in Vercel logs and the Razorpay dashboard).
 * Phase 2 saves them to the database and emails a receipt.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhook(raw, sig)) return NextResponse.json({ ok: false }, { status: 400 });

  const evt = JSON.parse(raw);
  if (evt.event === "payment.captured") {
    const p = evt.payload.payment.entity;
    console.log("donation captured", { id: p.id, order: p.order_id, amount: p.amount / 100, method: p.method, cause: p.notes?.cause });
  }
  return NextResponse.json({ ok: true });
}
