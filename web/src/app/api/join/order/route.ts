import { NextResponse } from "next/server";
import { client } from "@/lib/razorpay";
import { limited, one, run } from "@/lib/db";
import { clientIp } from "@/lib/auth";
import { firstError, joinSchema } from "@/lib/validate";
import { checkDoc, DOC_KINDS, saveDoc, type DocKind } from "@/lib/docs";

export async function POST(req: Request) {
  const rp = client();
  if (!rp) return NextResponse.json({ error: "Online membership payments are not switched on yet. Please contact us." }, { status: 503 });
  if (await limited(`order:${await clientIp()}`, 20, 600)) return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const d = parsed.data;

  // Price always comes from the database, never from the browser.
  const plan = await one<{ id: string; price_paise: number; label: string }>("SELECT id, price_paise, label FROM plans WHERE id = ? AND active = 1", [d.planId]);
  if (!plan) return NextResponse.json({ error: "That plan isn't available. Please pick another." }, { status: 400 });
  const rejected = await one("SELECT 1 FROM members WHERE phone = ? AND status = 'rejected'", [d.phone]);
  if (rejected) return NextResponse.json({ error: "Please contact the association before renewing this membership." }, { status: 409 });

  // Documents: required for new members, optional when an existing member renews.
  const hasDocs = await one("SELECT 1 FROM documents d JOIN members m ON m.id = d.member_id WHERE m.phone = ? LIMIT 1", [d.phone]);
  const raw = (body?.docs ?? {}) as Record<string, unknown>;
  const docs: { kind: DocKind; mime: string; buf: Uint8Array }[] = [];
  for (const kind of Object.keys(DOC_KINDS) as DocKind[]) {
    const v = raw[kind];
    if (typeof v !== "string" || !v) {
      if (!hasDocs) return NextResponse.json({ error: `Please upload your ${DOC_KINDS[kind]}.` }, { status: 400 });
      continue;
    }
    const c = checkDoc(kind, new Uint8Array(Buffer.from(v.replace(/^data:[^,]*,/, ""), "base64")));
    if ("error" in c) return NextResponse.json({ error: c.error }, { status: 400 });
    docs.push({ kind, ...c });
  }

  try {
    const order = await rp.orders.create({ amount: Number(plan.price_paise), currency: "INR", receipt: `mem_${Date.now()}`, notes: { kind: "membership", plan: plan.label, phone: d.phone } });
    const meta = { name: d.name, phone: d.phone, email: d.email, licence_no: d.licence_no, pan: d.pan, area: d.area };
    await run("INSERT INTO payments (order_id, kind, amount_paise, name, email, phone, plan_id, meta) VALUES (?, 'membership', ?, ?, ?, ?, ?, ?)",
      [order.id, plan.price_paise, d.name, d.email ?? null, d.phone, plan.id, JSON.stringify(meta)]);
    for (const doc of docs) await saveDoc({ ...doc, orderId: order.id });
    // Clean up documents from payments that were started but never finished.
    await run("DELETE FROM documents WHERE member_id IS NULL AND order_id IN (SELECT order_id FROM payments WHERE status != 'paid' AND created_at < datetime('now', '-2 days'))");
    return NextResponse.json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID, label: plan.label });
  } catch (e) {
    console.error("membership order failed", e);
    return NextResponse.json({ error: "Couldn't start the payment. Please try again in a minute." }, { status: 502 });
  }
}
