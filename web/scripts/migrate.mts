/**
 * Creates any missing tables in the live database. Safe to run any number of times.
 *   npx tsx scripts/migrate.mts .env.mumbai
 * The live site skips this check on every request (SCHEMA_READY=1), so run it whenever the schema changes.
 */
import fs from "node:fs";

const file = process.argv[2] ?? ".env.mumbai";
for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
delete process.env.SCHEMA_READY;
const { migrate } = await import("../src/lib/db.ts");
await migrate();
console.log(`Schema is up to date in ${process.env.DATABASE_URL}`);
