/**
 * End-to-end tests of the money flows, run against a real local database.
 * Razorpay's network call (orders.create) is replaced with a fake; signatures are computed exactly as Razorpay does.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

let orderSeq = 0;
vi.mock("@/lib/razorpay", async (orig) => {
  const real = await orig<typeof import("@/lib/razorpay")>();
  return { ...real, client: () => ({ orders: { create: async (o: { amount: number }) => ({ id: `order_T${++orderSeq}`, amount: o.amount }) } }) };
});
vi.mock("@/lib/auth", async (orig) => {
  const real = await orig<typeof import("@/lib/auth")>();
  return { ...real, clientIp: async () => "127.0.0.1", requireAdmin: async () => "tester", currentAdmin: async () => "tester", audit: async () => {} };
});
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const sign = (s: string, secret: string) => crypto.createHmac("sha256", secret).update(s).digest("hex");
const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://localhost${url}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });

let donateOrder: typeof import("@/app/api/donate/order/route").POST;
let joinOrder: typeof import("@/app/api/join/order/route").POST;
let verify: typeof import("@/app/api/donate/verify/route").POST;
let webhook: typeof import("@/app/api/razorpay/webhook/route").POST;
let dbm: typeof import("@/lib/db");

beforeAll(async () => {
  fs.rmSync("data/test.db", { force: true });
  dbm = await import("@/lib/db");
  donateOrder = (await import("@/app/api/donate/order/route")).POST;
  joinOrder = (await import("@/app/api/join/order/route")).POST;
  verify = (await import("@/app/api/donate/verify/route")).POST;
  webhook = (await import("@/app/api/razorpay/webhook/route")).POST;
});

async function payViaBrowser(orderId: string, paymentId: string) {
  return verify(post("/api/donate/verify", { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sign(`${orderId}|${paymentId}`, "test_secret_for_signatures") }));
}
async function payViaWebhook(orderId: string, paymentId: string, event = "payment.captured") {
  const raw = JSON.stringify({ event, payload: { payment: { entity: { id: paymentId, order_id: orderId } } } });
  return webhook(post("/api/razorpay/webhook", raw, { "x-razorpay-signature": sign(raw, "test_webhook_secret") }));
}

describe("dates", () => {
  it("adds months inclusively and clamps month ends", () => {
    expect(dbm.addMonths("2025-01-01", 12)).toBe("2025-12-31");
    expect(dbm.addMonths("2025-03-15", 36)).toBe("2028-03-14");
    expect(dbm.addMonths("2024-01-31", 1)).toBe("2024-02-28");
  });
});

describe("donations", () => {
  it("rejects bad input", async () => {
    for (const body of [{ amount: 0, name: "A", email: "a@b.in" }, { amount: 100, name: "", email: "a@b.in" }, { amount: 100, name: "A", email: "nope" },
      { amount: 100.555, name: "A", email: "a@b.in" }, { amount: 100, name: "A", email: "a@b.in", pan: "BAD" }]) {
      expect((await donateOrder(post("/api/donate/order", body))).status).toBe(400);
    }
  });

  it("records an order, then marks it paid once with a valid signature", async () => {
    const r = await donateOrder(post("/api/donate/order", { amount: 501, name: "Asha", email: "asha@example.in", cause: "education", pan: "abcde1234f" }));
    expect(r.status).toBe(200);
    const { orderId, amount } = await r.json();
    expect(amount).toBe(50100);
    let row = await dbm.one<{ status: string; pan: string }>("SELECT * FROM payments WHERE order_id = ?", [orderId]);
    expect(row).toMatchObject({ status: "created", pan: "ABCDE1234F" });

    const bad = await verify(post("/api/donate/verify", { razorpay_order_id: orderId, razorpay_payment_id: "pay_X", razorpay_signature: "deadbeef" }));
    expect(bad.status).toBe(400);
    expect((await dbm.one<{ status: string }>("SELECT status FROM payments WHERE order_id = ?", [orderId]))!.status).toBe("created");

    expect((await (await payViaBrowser(orderId, "pay_A1")).json()).ok).toBe(true);
    expect((await payViaWebhook(orderId, "pay_A1")).status).toBe(200); // duplicate notification is harmless
    row = await dbm.one("SELECT * FROM payments WHERE order_id = ?", [orderId]);
    expect(row).toMatchObject({ status: "paid", payment_id: "pay_A1" });
  });

  it("saves the payment from the webhook alone (browser closed)", async () => {
    const { orderId } = await (await donateOrder(post("/api/donate/order", { amount: 100, name: "Ravi", email: "ravi@example.in" }))).json();
    expect((await payViaWebhook(orderId, "pay_W1")).status).toBe(200);
    expect((await dbm.one<{ status: string }>("SELECT status FROM payments WHERE order_id = ?", [orderId]))!.status).toBe("paid");
  });

  it("ignores webhooks with a forged signature", async () => {
    const { orderId } = await (await donateOrder(post("/api/donate/order", { amount: 100, name: "Eve", email: "eve@example.in" }))).json();
    const raw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_F", order_id: orderId } } } });
    expect((await webhook(post("/api/razorpay/webhook", raw, { "x-razorpay-signature": "0".repeat(64) }))).status).toBe(400);
    expect((await dbm.one<{ status: string }>("SELECT status FROM payments WHERE order_id = ?", [orderId]))!.status).toBe("created");
  });
});

describe("membership", () => {
  // Smallest valid JPEG / PDF headers are enough: the server checks the real file type from its bytes.
  const jpg = "data:image/jpeg;base64," + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]).toString("base64");
  const pdf = Buffer.from("%PDF-1.4 test").toString("base64");
  const docs = { aadhaar_front: jpg, aadhaar_back: jpg, pan_front: pdf, pan_back: jpg, licence_front: jpg, licence_back: jpg };
  const driver = { planId: "1y", name: "Suresh Patil", phone: "+91 98200 11111", docs };

  it("requires all three documents from new members and rejects fake files", async () => {
    const noDocs = await joinOrder(post("/api/join/order", { ...driver, phone: "9820099999", docs: { aadhaar_front: jpg, aadhaar_back: jpg } }));
    expect(noDocs.status).toBe(400);
    expect((await noDocs.json()).error).toContain("PAN card");
    const fake = await joinOrder(post("/api/join/order", { ...driver, phone: "9820099999", docs: { ...docs, licence_back: Buffer.from("<script>alert(1)</script>").toString("base64") } }));
    expect(fake.status).toBe(400);
    expect((await fake.json()).error).toContain("photo");
    const huge = await joinOrder(post("/api/join/order", { ...driver, phone: "9820099999", docs: { ...docs, aadhaar_front: Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1_300_000)]).toString("base64") } }));
    expect(huge.status).toBe(400);
  });

  it("charges the plan price from the database, not from the browser", async () => {
    const r = await joinOrder(post("/api/join/order", { ...driver, amount: 1, price_paise: 100 }));
    expect((await r.json()).amount).toBe(36500);
  });

  it("validates phone and licence", async () => {
    expect((await joinOrder(post("/api/join/order", { ...driver, phone: "12345" }))).status).toBe(400);
    expect((await joinOrder(post("/api/join/order", { ...driver, planId: "nope" }))).status).toBe(400);
  });

  it("creates a pending member with a 1-year expiry after payment, then extends on renewal", async () => {
    const { orderId } = await (await joinOrder(post("/api/join/order", driver))).json();
    const v = await (await payViaBrowser(orderId, "pay_M1")).json();
    expect(v.ok).toBe(true);
    expect(v.token).toMatch(/^[a-f0-9]{32}$/);
    const m1 = await dbm.one<{ id: number; status: string; phone: string; paid_on: string; expires_on: string }>("SELECT * FROM members WHERE token = ?", [v.token]);
    expect(m1).toMatchObject({ status: "pending", phone: "9820011111" });
    const linked = await dbm.q<{ kind: string; mime: string }>("SELECT kind, mime FROM documents WHERE member_id = ? ORDER BY kind", [m1!.id]);
    expect(linked.map((d) => d.kind)).toEqual(["aadhaar_back", "aadhaar_front", "licence_back", "licence_front", "pan_back", "pan_front"]);
    expect(linked.find((d) => d.kind === "pan_front")?.mime).toBe("application/pdf");
    expect(m1!.expires_on).toBe(dbm.addMonths(dbm.today(), 12));

    // Admin approves, driver renews early with the 10-year plan: new period starts the day after current expiry.
    await dbm.run("UPDATE members SET status = 'active' WHERE id = ?", [m1!.id]);
    const renew = await joinOrder(post("/api/join/order", { ...driver, planId: "10y", docs: {} })); // renewing: documents already on file
    expect(renew.status).toBe(200);
    const { orderId: o2 } = await renew.json();
    await payViaWebhook(o2, "pay_M2");
    const m2 = await dbm.one<{ id: number; status: string; expires_on: string }>("SELECT * FROM members WHERE id = ?", [m1!.id]);
    const next = new Date(Date.parse(`${m1!.expires_on}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);
    expect(m2).toMatchObject({ status: "active", expires_on: dbm.addMonths(next, 120) });
    expect(Number((await dbm.one<{ n: number }>("SELECT COUNT(*) AS n FROM members WHERE phone = '9820011111'"))!.n)).toBe(1);
  });

  it("blocks rejected members from paying again", async () => {
    await dbm.run("UPDATE members SET status = 'rejected' WHERE phone = '9820011111'");
    expect((await joinOrder(post("/api/join/order", driver))).status).toBe(409);
  });
});

describe("import", () => {
  it("previews, skips bad rows, and imports without duplicates", async () => {
    const { previewImport, commitImport } = await import("@/app/admin/actions");
    const rows: Record<string, string>[] = [
      { "Full name": "Imran Shaikh", "Mobile number": "9876500001", Plan: "1 year", "Amount paid": "365", "Paid on": "15-03-2025", "Payment mode": "Cash" },
      { "Full name": "Kiran Rao", "Mobile number": "9876500002", Plan: "10 years", "Amount paid": "3000", "Paid on": "2024/01/10", "Payment mode": "UPI" },
      { "Full name": "No Phone", "Mobile number": "", Plan: "1 year", "Amount paid": "365", "Paid on": "15-03-2025" },
      { "Full name": "Bad Plan", "Mobile number": "9876500003", Plan: "5 years", "Amount paid": "365", "Paid on": "15-03-2025" },
      { "Full name": "Dup", "Mobile number": "9876500001", Plan: "1 year", "Amount paid": "365", "Paid on": "15-03-2025" },
      { "Full name": "=HYPERLINK(\"x\")", "Mobile number": "9876500004", Plan: "1y", "Amount paid": "365", "Paid on": "01-04-2025", "Expiry date": "31-03-2026" },
    ];
    const p = await previewImport(rows);
    expect(p.results!.map((r) => r.ok)).toEqual([true, false, false, false, false, true]); // "2024/01/10" is not a supported date
    const c = await commitImport(rows);
    expect(c).toMatchObject({ imported: 2, skipped: 4 });
    const m = await dbm.one<{ expires_on: string; status: string; source: string; in_group: number }>("SELECT * FROM members WHERE phone = '9876500001'");
    expect(m).toMatchObject({ expires_on: "2026-03-14", status: "active", source: "imported", in_group: 1 });

    const again = await commitImport(rows);
    expect(again).toMatchObject({ imported: 2, updated: 2 });
    expect(Number((await dbm.one<{ n: number }>("SELECT COUNT(*) AS n FROM members WHERE source = 'imported'"))!.n)).toBe(2);
  });
});

describe("admin protection", () => {
  it("redirects anonymous visitors and rejects forged cookies", async () => {
    const { middleware } = await import("@/middleware");
    const anon = await middleware(new NextRequest("http://localhost/admin/members"));
    expect(anon.status).toBe(307);
    expect(anon.headers.get("location")).toContain("/admin/login");
    const api = await middleware(new NextRequest("http://localhost/api/admin/export", { headers: { cookie: "abc_admin=forged.token.value" } }));
    expect(api.status).toBe(401);
    const { SignJWT } = await import("jose");
    const good = await new SignJWT({ sub: "tester" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode("a".repeat(48)));
    const ok = await middleware(new NextRequest("http://localhost/admin", { headers: { cookie: `abc_admin=${good}` } }));
    expect(ok.status).toBe(200);
    const doc = await middleware(new NextRequest("http://localhost/api/admin/doc/1"));
    expect(doc.status).toBe(401);
  });
});
