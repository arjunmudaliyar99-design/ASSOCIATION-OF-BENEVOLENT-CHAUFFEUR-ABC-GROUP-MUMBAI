import "server-only";
import { run } from "@/lib/db";

export const DOC_KINDS = { aadhaar: "Aadhaar card", pan: "PAN card", licence: "Driving licence" } as const;
export type DocKind = keyof typeof DOC_KINDS;
export const MAX_DOC_BYTES = 1_200_000; // phones compress photos to ~200–400 KB before upload

/** Identify the file from its first bytes. Never trust the file name or browser-sent type. */
export function sniff(buf: Uint8Array): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  return null;
}

/** Checks one uploaded document. Returns an error message, or the bytes and real type. */
export function checkDoc(kind: string, buf: Uint8Array): { error: string; code: string } | { mime: string; buf: Uint8Array } {
  const label = DOC_KINDS[kind as DocKind] ?? "Document";
  if (!buf.length) return { error: `${label}: the file is empty.`, code: "docEmpty" };
  if (buf.length > MAX_DOC_BYTES) return { error: `${label}: the file is too big. Use a photo or a PDF under 1 MB.`, code: "docBig" };
  const mime = sniff(buf);
  if (!mime) return { error: `${label}: upload a photo (JPG or PNG) or a PDF.`, code: "docType" };
  return { mime, buf };
}

export async function saveDoc(opts: { kind: DocKind; mime: string; buf: Uint8Array; orderId?: string; memberId?: number; by?: string }) {
  await run("INSERT INTO documents (order_id, member_id, kind, mime, size, data, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [opts.orderId ?? null, opts.memberId ?? null, opts.kind, opts.mime, opts.buf.length, opts.buf, opts.by ?? "member"]);
}
