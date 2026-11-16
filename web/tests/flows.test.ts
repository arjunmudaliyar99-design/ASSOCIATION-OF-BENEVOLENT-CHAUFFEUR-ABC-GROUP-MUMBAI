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
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }), headers: async () => new Headers() }));

const sign = (s: string, secret: string) => crypto.createHmac("sha256", secret).update(s).digest("hex");
const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://localhost${url}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });

let donateOrder: typeof import("@/app/api/donate/order/route").POST;
let verify: typeof import("@/app/api/donate/verify/route").POST;
let webhook: typeof import("@/app/api/razorpay/webhook/route").POST;
let dbm: typeof import("@/lib/db");

beforeAll(async () => {
  fs.rmSync("data/test.db", { force: true });
  dbm = await import("@/lib/db");
  donateOrder = (await import("@/app/api/donate/order/route")).POST;
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

describe("admin adds a member (no payment)", () => {
  // Smallest valid JPEG / PDF headers are enough: the server checks the real file type from its bytes.
  const jpg = "data:image/jpeg;base64," + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]).toString("base64");
  const pdf = Buffer.from("%PDF-1.4 test").toString("base64");
  const until = () => dbm.addMonths(dbm.today(), 12);
  const person = () => ({ name: "Suresh Patil", phone: "+91 98200 11111", email: "suresh@example.com", area: "Andheri", expires_on: until() });

  it("creates an active member valid until the chosen date, with documents", async () => {
    const { createMember } = await import("@/app/admin/actions");
    const r = await createMember({ ...person(), docs: { aadhaar_front: jpg, pan_front: pdf } });
    expect("id" in r).toBe(true);
    const id = (r as { id: number }).id;
    const m = await dbm.one<{ status: string; phone: string; source: string; amount_paise: number; plan_id: string | null; expires_on: string }>("SELECT * FROM members WHERE id = ?", [id]);
    expect(m).toMatchObject({ status: "active", phone: "9820011111", source: "admin", amount_paise: 0, plan_id: null, expires_on: until() });
    const kinds = await dbm.q<{ kind: string }>("SELECT kind FROM documents WHERE member_id = ? ORDER BY kind", [id]);
    expect(kinds.map((d) => d.kind)).toEqual(["aadhaar_front", "pan_front"]);
  });

  it("works without documents, and rejects duplicates, bad input, past dates and fake files", async () => {
    const { createMember } = await import("@/app/admin/actions");
    expect("id" in (await createMember({ ...person(), phone: "9820022222", docs: {} }))).toBe(true);
    expect(await createMember({ ...person(), docs: {} })).toHaveProperty("error");
    expect(await createMember({ ...person(), phone: "12345" })).toHaveProperty("error");
    expect(await createMember({ ...person(), phone: "9820033333", expires_on: "2020-01-01" })).toHaveProperty("error");
    const fake = await createMember({ ...person(), phone: "9820044444", docs: { licence_back: Buffer.from("<script>alert(1)</script>").toString("base64") } });
    expect(fake).toHaveProperty("error");
    expect(await dbm.one("SELECT 1 FROM members WHERE phone = '9820044444'")).toBeUndefined();
  });
});

describe("blacklist", () => {
  const jpg = "data:image/jpeg;base64," + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]).toString("base64");
  const pdf = Buffer.from("%PDF-1.4 test").toString("base64");

  it("adds a person with photo and documents, blocks them from being added as a member, and removes them", async () => {
    const { addBlacklist, removeBlacklist, createMember } = await import("@/app/admin/actions");
    const r = await addBlacklist({ name: "Ramesh K", phone: "98200 55555", reason: "Took advance and left the duty", details: "Complaint from Andheri client", photo: jpg, docs: [pdf, jpg, undefined] });
    expect("id" in r).toBe(true);
    const id = (r as { id: number }).id;
    const files = await dbm.q<{ kind: string }>("SELECT kind FROM blacklist_files WHERE entry_id = ? ORDER BY id", [id]);
    expect(files.map((f) => f.kind)).toEqual(["photo", "document", "document"]);

    const blocked = await createMember({ name: "Ramesh K", phone: "9820055555", expires_on: dbm.addMonths(dbm.today(), 12) });
    expect(blocked).toHaveProperty("error");

    const fd = new FormData(); fd.set("id", String(id));
    await removeBlacklist(fd);
    expect(await dbm.one("SELECT 1 FROM blacklist WHERE id = ?", [id])).toBeUndefined();
    expect(await dbm.one("SELECT 1 FROM blacklist_files WHERE entry_id = ?", [id])).toBeUndefined();
  });

  it("rejects missing reason, bad phone and a PDF as photo", async () => {
    const { addBlacklist } = await import("@/app/admin/actions");
    expect(await addBlacklist({ name: "A B", reason: "" })).toHaveProperty("error");
    expect(await addBlacklist({ name: "A B", reason: "Misconduct", phone: "123" })).toHaveProperty("error");
    expect(await addBlacklist({ name: "A B", reason: "Misconduct", photo: pdf })).toHaveProperty("error");
    expect("id" in (await addBlacklist({ name: "Name Only", reason: "Misconduct" }))).toBe(true);
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
