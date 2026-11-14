import { NextResponse } from "next/server";
import { client, MAX_RUPEES, MIN_RUPEES } from "@/lib/razorpay";
import { causes } from "@/data/site";

export async function POST(req: Request) {
  const rp = client();
  if (!rp) return NextResponse.json({ error: "Online donations are not switched on yet. Please contact us to donate." }, { status: 503 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const rupees = Number(b.amount);
  const name = String(b.name ?? "").trim().slice(0, 80);
  const email = String(b.email ?? "").trim().slice(0, 120);
  const phone = String(b.phone ?? "").replace(/[^\d+]/g, "").slice(0, 15);
  const cause = causes.some((c) => c.id === b.cause) ? String(b.cause) : "general";

  if (!Number.isFinite(rupees) || rupees < MIN_RUPEES || rupees > MAX_RUPEES || Math.round(rupees * 100) !== rupees * 100)
    return NextResponse.json({ error: `Enter an amount between ₹${MIN_RUPEES} and ₹${MAX_RUPEES.toLocaleString("en-IN")}.` }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address for your receipt." }, { status: 400 });

  try {
    const order = await rp.orders.create({
      amount: Math.round(rupees * 100),
      currency: "INR",
      receipt: `abc_${Date.now()}`,
      notes: { name, email, phone, cause },
    });
    return NextResponse.json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) {
    console.error("razorpay order failed", e);
    return NextResponse.json({ error: "Couldn't start the payment. Please try again in a minute." }, { status: 502 });
  }
}
