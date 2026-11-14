/**
 * Creates (or resets the password of) an admin account.
 *   npm run admin:create -- <username> <password>
 * Uses DATABASE_URL / DATABASE_AUTH_TOKEN from the environment (.env.local is loaded automatically).
 */
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";

for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const [username, password] = process.argv.slice(2);
if (!username || !password) { console.error("Usage: npm run admin:create -- <username> <password>"); process.exit(1); }
if (password.length < 10) { console.error("Password must be at least 10 characters."); process.exit(1); }

const url = process.env.DATABASE_URL ?? "file:./data/abc.db";
if (url.startsWith("file:")) fs.mkdirSync("data", { recursive: true });
const db = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
await db.execute(`CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`);
await db.execute({
  sql: "INSERT INTO admins (username, password_hash) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash",
  args: [username.toLowerCase(), await bcrypt.hash(password, 12)],
});
console.log(`Admin "${username.toLowerCase()}" is ready.`);
