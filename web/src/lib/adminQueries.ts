export function donationWhere(sp: Record<string, string | undefined>) {
  const where = ["kind = 'donation'"], args: string[] = [];
  const status = sp.status ?? "paid";
  if (status !== "all") { where.push("status = ?"); args.push(status); }
  if (sp.q) { where.push("(name LIKE ? OR email LIKE ? OR phone LIKE ? OR payment_id LIKE ?)"); const l = `%${sp.q}%`; args.push(l, l, l, l); }
  if (sp.cause) { where.push("cause = ?"); args.push(sp.cause); }
  if (sp.from) { where.push("date(created_at) >= ?"); args.push(sp.from); }
  if (sp.to) { where.push("date(created_at) <= ?"); args.push(sp.to); }
  return { sql: where.join(" AND "), args };
}

export function memberWhere(sp: Record<string, string | undefined>, t: string, a = "") {
  const where: string[] = ["1 = 1"], args: string[] = [];
  const s = sp.status ?? "all";
  if (s === "expired") { where.push(`${a}status = 'active' AND ${a}expires_on < ?`); args.push(t); }
  else if (s === "active") { where.push(`${a}status = 'active' AND ${a}expires_on >= ?`); args.push(t); }
  else if (s !== "all") { where.push(`${a}status = ?`); args.push(s); }
  if (sp.q) { where.push(`(${a}name LIKE ? OR ${a}phone LIKE ? OR ${a}licence_no LIKE ? OR printf('ABC-%04d', ${a}id) LIKE ?)`); const l = `%${sp.q}%`; args.push(l, l, l, l.toUpperCase()); }
  if (sp.group === "no") where.push(`${a}in_group = 0`);
  if (sp.group === "yes") where.push(`${a}in_group = 1`);
  if (sp.source) { where.push(`${a}source = ?`); args.push(sp.source); }
  return { sql: where.join(" AND "), args };
}
