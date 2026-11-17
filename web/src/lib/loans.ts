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

export const loanStatus = { open: "Running", closed: "Repaid", written_off: "Written off" } as const;
export const schemes = { small: "Short loan (₹2,000–₹5,000)", "10000": "₹10,000 loan (₹300/month interest)" } as const;
