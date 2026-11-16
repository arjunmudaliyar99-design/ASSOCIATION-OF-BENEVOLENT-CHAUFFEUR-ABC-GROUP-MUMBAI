import "server-only";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient, type Client, type InValue } from "@libsql/client";
// On Cloudflare the bundler resolves "@libsql/client" to its web (HTTP) build via the "workerd" export condition.

/**
 * One database for everything. DATABASE_URL can be:
 *  - file:./data/abc.db         (local dev, tests, or a VPS)
 *  - libsql://<db>.turso.io     (Turso, for Vercel) + DATABASE_AUTH_TOKEN
 */
let client: Client | null = null;
let ready: Promise<void> | null = null;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS plans (
     id TEXT PRIMARY KEY, label TEXT NOT NULL, months INTEGER NOT NULL,
     price_paise INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS members (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     token TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, email TEXT, licence_no TEXT, pan TEXT, area TEXT,
     plan_id TEXT, amount_paise INTEGER NOT NULL DEFAULT 0, paid_on TEXT, expires_on TEXT,
     status TEXT NOT NULL DEFAULT 'pending', source TEXT NOT NULL DEFAULT 'online', payment_mode TEXT,
     in_group INTEGER NOT NULL DEFAULT 0, notes TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS payments (
     order_id TEXT PRIMARY KEY, kind TEXT NOT NULL, amount_paise INTEGER NOT NULL,
     status TEXT NOT NULL DEFAULT 'created', payment_id TEXT,
     name TEXT, email TEXT, phone TEXT, cause TEXT, pan TEXT,
     plan_id TEXT, member_id INTEGER, meta TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now')), paid_at TEXT)`,
  `CREATE INDEX IF NOT EXISTS payments_kind_status ON payments(kind, status, paid_at)`,
  `CREATE INDEX IF NOT EXISTS members_expiry ON members(status, expires_on)`,
  `CREATE TABLE IF NOT EXISTS admins (
     id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
     created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS documents (
     id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT, member_id INTEGER, kind TEXT NOT NULL,
     mime TEXT NOT NULL, size INTEGER NOT NULL, data BLOB NOT NULL, uploaded_by TEXT NOT NULL DEFAULT 'member',
     created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS documents_member ON documents(member_id)`,
  `CREATE INDEX IF NOT EXISTS documents_order ON documents(order_id)`,
  `CREATE TABLE IF NOT EXISTS rate (key TEXT NOT NULL, at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS rate_key ON rate(key, at)`,
  `CREATE TABLE IF NOT EXISTS audit (
     id INTEGER PRIMARY KEY AUTOINCREMENT, admin TEXT, action TEXT NOT NULL, detail TEXT,
     at TEXT NOT NULL DEFAULT (datetime('now')))`,
  // People the association has blacklisted, with their photo and documents (admins only).
  `CREATE TABLE IF NOT EXISTS blacklist (
     id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT, reason TEXT NOT NULL, details TEXT,
     added_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS blacklist_phone ON blacklist(phone)`,
  `CREATE TABLE IF NOT EXISTS blacklist_files (
     id INTEGER PRIMARY KEY AUTOINCREMENT, entry_id INTEGER NOT NULL, kind TEXT NOT NULL,
     mime TEXT NOT NULL, size INTEGER NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  // Prices confirmed by the association. Editable in Admin > Plans.
  `INSERT OR IGNORE INTO plans (id, label, months, price_paise, sort) VALUES
     ('1y', '1 year', 12, 36500, 1), ('10y', '10 years', 120, 300000, 2)`,
];

export function db(): Client {
  if (!client) {
    const url = process.env.DATABASE_URL ?? "file:./data/abc.db";
    if (url.startsWith("file:")) mkdirSync(dirname(url.slice(5)), { recursive: true });
    client = createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return client;
}

export async function ensureSchema() {
  if (!ready) ready = db().batch(SCHEMA, "write").then(() => undefined).catch((e) => { ready = null; throw e; });
  return ready;
}

export async function q<T = Record<string, unknown>>(sql: string, args: InValue[] = []): Promise<T[]> {
  await ensureSchema();
  const r = await db().execute({ sql, args });
  return r.rows as unknown as T[];
}

export async function one<T = Record<string, unknown>>(sql: string, args: InValue[] = []): Promise<T | undefined> {
  return (await q<T>(sql, args))[0];
}

export async function run(sql: string, args: InValue[] = []) {
  await ensureSchema();
  return db().execute({ sql, args });
}

/** Simple sliding-window rate limit stored in the database (works across serverless instances). */
export async function limited(key: string, max: number, windowSec: number) {
  const now = Math.floor(Date.now() / 1000);
  await run("DELETE FROM rate WHERE at < ?", [now - 86400]);
  const r = await one<{ n: number }>("SELECT COUNT(*) AS n FROM rate WHERE key = ? AND at > ?", [key, now - windowSec]);
  if (Number(r?.n ?? 0) >= max) return true;
  await run("INSERT INTO rate (key, at) VALUES (?, ?)", [key, now]);
  return false;
}

export const memberCode = (id: number | bigint) => `ABC-${String(id).padStart(5, "0")}`;
export const today = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10); // IST date

export function addMonths(isoDate: string, months: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() < day) d.setUTCDate(0); // clamp e.g. 31 Jan + 1 month
  d.setUTCDate(d.getUTCDate() - 1); // inclusive: 1 Jan + 12 months = 31 Dec
  return d.toISOString().slice(0, 10);
}
