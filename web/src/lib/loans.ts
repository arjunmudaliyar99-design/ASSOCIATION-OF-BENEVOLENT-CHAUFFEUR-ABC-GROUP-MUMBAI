export type LoanRow = {
  id: number; member_id: number | null; name: string; phone: string | null; amount_paise: number; given_on: string;
  scheme: string; status: string; repaid: number; interest: number; penalty: number;
};

/** Each loan with what has been paid against it. */
export const LOAN_SELECT = `SELECT l.id, l.member_id, l.name, l.phone, l.amount_paise, l.given_on, l.scheme, l.status,
  COALESCE(SUM(CASE WHEN p.kind = 'repayment' THEN p.amount_paise END),0) AS repaid,
  COALESCE(SUM(CASE WHEN p.kind = 'interest' THEN p.amount_paise END),0) AS interest,
  COALESCE(SUM(CASE WHEN p.kind = 'penalty' THEN p.amount_paise END),0) AS penalty
  FROM loans l LEFT JOIN loan_payments p ON p.loan_id = l.id`;

/** "2026-08-14" → "Aug 26", like the month headings in the loan sheet. */
export const shortMonth = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(/(\w+)\s(\d+)/, "$1 $2");

/** Whole months from the loan date to `to` (a loan given 10 Jan owes its first interest by 10 Feb). */
export function monthsBetween(from: string, to: string) {
  const a = new Date(`${from}T00:00:00Z`), b = new Date(`${to.slice(0, 10)}T00:00:00Z`);
  let m = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth();
  if (b.getUTCDate() < a.getUTCDate()) m--;
  return Math.max(0, m);
}

export const loanStatus = { open: "Running", closed: "Repaid", written_off: "Written off" } as const;
export const schemes = { small: "Short loan (₹2,000–₹5,000)", "10000": "₹10,000 loan (₹300/month interest)" } as const;
