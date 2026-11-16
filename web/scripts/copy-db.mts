/**
 * Copies every table (schema + rows, including document files) from one libSQL database to another.
 *   npx tsx scripts/copy-db.mts <from.env> <to.env>
 * Each env file holds DATABASE_URL and DATABASE_AUTH_TOKEN. The target must be empty.
 */
import { createClient, type Client, type InValue } from "@libsql/client";
import fs from "node:fs";

function load(file: string) {
  const v: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) v[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return createClient({ url: v.DATABASE_URL, authToken: v.DATABASE_AUTH_TOKEN });
}

const [fromFile, toFile] = process.argv.slice(2);
if (!fromFile || !toFile) { console.error("Usage: copy-db.mts <from.env> <to.env>"); process.exit(1); }
const src: Client = load(fromFile), dst: Client = load(toFile);

const objs = (await src.execute("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END")).rows;
const existing = (await dst.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")).rows;
const filled: string[] = [];
for (const r of existing) if (Number((await dst.execute(`SELECT COUNT(*) AS n FROM "${r.name}"`)).rows[0].n) > 0) filled.push(String(r.name));
if (filled.length) { console.error(`Target is not empty (${filled.join(", ")}). Stopping.`); process.exit(1); }

for (const o of objs) {
  const sql = String(o.sql).replace(/^CREATE (UNIQUE )?(TABLE|INDEX)\s+(?!IF NOT EXISTS)/i, (m, u, t) => `CREATE ${u ?? ""}${t} IF NOT EXISTS `);
  await dst.execute(sql);
}

const report: string[] = [];
for (const t of objs.filter((o) => o.type === "table")) {
  const name = String(t.name);
  const rows = (await src.execute(`SELECT * FROM "${name}"`)).rows;
  if (rows.length) {
    const cols = Object.keys(rows[0]);
    const ins = `INSERT INTO "${name}" (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${cols.map(() => "?").join(",")})`;
    for (let i = 0; i < rows.length; i += 50) {
      await dst.batch(rows.slice(i, i + 50).map((r) => ({ sql: ins, args: cols.map((c) => r[c] as InValue) })), "write");
    }
  }
  const n = Number((await dst.execute(`SELECT COUNT(*) AS n FROM "${name}"`)).rows[0].n);
  report.push(`${name}: ${rows.length} -> ${n}${n === rows.length ? "" : "  MISMATCH"}`);
}
console.log(report.join("\n"));
