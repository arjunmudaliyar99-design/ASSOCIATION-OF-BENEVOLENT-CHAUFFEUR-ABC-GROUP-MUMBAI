import { z } from "zod";

export const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
export const phone = z.string().transform((s) => s.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "")).pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."));
const text = (max: number) => z.string().trim().max(max);
const optional = (max: number) => text(max).optional().transform((s) => (s ? s : undefined));

export const joinSchema = z.object({
  planId: z.string().min(1).max(20),
  name: text(80).min(2, "Enter your full name."),
  phone,
  email: z.string().trim().max(120).email("Enter a valid email.").optional().or(z.literal("")).transform((s) => s || undefined),
  licence_no: text(30).min(5, "Enter your driving licence number."),
  pan: z.string().trim().toUpperCase().regex(PAN, "Enter a valid PAN, like ABCDE1234F.").optional().or(z.literal("")).transform((s) => s || undefined),
  area: optional(80),
});

export const lookupSchema = z.object({ phone, member: z.string().trim().toUpperCase().regex(/^(ABC-?)?\d{1,6}$/, "Enter your member number, like ABC-00012.") });

/** One row of the import sheet. Dates accept DD-MM-YYYY, DD/MM/YYYY or YYYY-MM-DD. */
export const importRow = z.object({
  name: text(80).min(2, "Name is missing"),
  mobile: phone,
  plan: z.string().trim().min(1, "Plan is missing"),
  amount: z.coerce.number({ invalid_type_error: "Amount must be a number" }).min(0).max(1_000_000),
  paid_on: z.string().trim().transform(toIso).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Paid date must look like 15-03-2025")),
  payment_mode: z.string().trim().max(20).optional().transform((s) => s || "cash"),
  expires_on: z.string().trim().optional().transform((s) => (s ? toIso(s) : undefined)).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must look like 14-03-2026").optional()),
  licence_no: optional(30),
  pan: z.string().trim().toUpperCase().optional().transform((s) => s || undefined).pipe(z.string().regex(PAN, "PAN looks wrong").optional()),
  area: optional(80),
  notes: optional(200),
});
export type ImportRow = z.infer<typeof importRow>;

export function toIso(s: string) {
  const t = s.trim();
  let m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return t;
}

export const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Please check the form.";

/** Short code for the first problem, so the browser can show it in the visitor's language. */
export function errorCode(e: z.ZodError) {
  const f = String(e.issues[0]?.path[0] ?? "");
  const map: Record<string, string> = { amount: "amount", name: "name", email: "email", phone: "phone", licence_no: "licence", pan: "pan", planId: "plan" };
  return map[f] ?? "invalid";
}
