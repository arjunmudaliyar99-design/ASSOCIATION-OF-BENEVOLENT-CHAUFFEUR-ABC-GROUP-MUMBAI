export function donationWhere(sp: Record<string, string | undefined>, a = "") {
  const where = [`${a}kind = 'donation'`], args: string[] = [];
  const status = sp.status ?? "paid";
  if (status !== "all") { where.push(`${a}status = ?`); args.push(status); }
  if (sp.q) { where.push(`(${a}name LIKE ? OR ${a}email LIKE ? OR ${a}phone LIKE ? OR ${a}payment_id LIKE ?)`); const l = `%${sp.q}%`; args.push(l, l, l, l); }
  if (sp.cause) { where.push(`${a}cause = ?`); args.push(sp.cause); }
  if (sp.from) { where.push(`date(${a}created_at) >= ?`); args.push(sp.from); }
  if (sp.to) { where.push(`date(${a}created_at) <= ?`); args.push(sp.to); }
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

// Match a payment to a member by the last 10 digits of the mobile number (ignores +91, spaces, dashes).
const digits10 = (col: string) => `substr(replace(replace(replace(${col}, '+', ''), ' ', ''), '-', ''), -10)`;
export const memberJoin = (pay = "payments", mem = "mem") =>
  `LEFT JOIN members ${mem} ON length(${digits10(`${pay}.phone`)}) = 10 AND ${digits10(`${mem}.phone`)} = ${digits10(`${pay}.phone`)}`;
export const memberCols = (mem = "mem") =>
  `${mem}.id AS m_id, ${mem}.name AS m_name, ${mem}.phone AS m_phone, ${mem}.status AS m_status, ${mem}.expires_on AS m_expires, ${mem}.area AS m_area`;
