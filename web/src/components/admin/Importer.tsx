"use client";
import { useState, useTransition } from "react";
import Papa from "papaparse";
import { commitImport, previewImport, type RowResult } from "@/app/admin/actions";
import type { Dict } from "@/i18n/en";

export default function Importer({ t }: { t: Dict["admin"] }) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  function onFile(f: File | undefined) {
    setMsg(""); setResults(null);
    if (!f) return;
    if (f.size > 5_000_000) return setMsg(t.tooBig);
    Papa.parse<Record<string, string>>(f, {
      header: true, skipEmptyLines: "greedy",
      complete: (r) => {
        setRows(r.data);
        start(async () => {
          const p = await previewImport(r.data);
          if ("error" in p) setMsg(p.error!); else setResults(p.results!);
        });
      },
      error: () => setMsg(t.badFile),
    });
  }

  const good = results?.filter((r) => r.ok) ?? [];
  const bad = results?.filter((r) => !r.ok) ?? [];

  return (
    <div className="grid gap-5">
      <label htmlFor="csv" className="grid cursor-pointer place-items-center gap-2 rounded-3xl border-2 border-dashed border-ink/30 bg-card p-10 text-center transition hover:border-ink hover:bg-sun/20">
        <span className="font-display text-2xl font-extrabold">{t.chooseCsv}</span>
        <span className="text-ink/70">{t.orDrop}</span>
        <input id="csv" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {pending && <p className="font-semibold">{t.checking}</p>}
      {msg && <p role="status" className="rounded-xl bg-sun/40 px-4 py-3 font-semibold">{msg}</p>}

      {results && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-card p-5 ring-1 ring-line">
            <span className="rounded-full bg-ink px-3 py-1 font-bold text-sun">{t.ready.replace("{n}", String(good.length))}</span>
            <span className="rounded-full bg-line px-3 py-1 font-bold">{t.willUpdate.replace("{n}", String(good.filter((g) => g.duplicate).length))}</span>
            <span className="rounded-full bg-sindoor/15 px-3 py-1 font-bold text-sindoor">{t.problems.replace("{n}", String(bad.length))}</span>
            <button disabled={!good.length || pending} className="btn-primary ml-auto !px-6 !py-2.5 !text-base disabled:opacity-50"
              onClick={() => start(async () => {
                const r = await commitImport(rows);
                if ("error" in r) setMsg(r.error!);
                else { setMsg(t.importDone.replace("{a}", String(r.imported)).replace("{u}", String(r.updated)).replace("{s}", String(r.skipped))); setResults(null); setRows([]); }
              })}>{t.importN.replace("{n}", String(good.length))}</button>
          </div>
          <div className="max-h-[60vh] overflow-auto rounded-3xl bg-card ring-1 ring-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 bg-sun"><tr>{[t.th.row, t.th.name, t.th.mobile, t.th.plan, t.th.amount, t.th.paidOn, t.th.result].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {results.map((r) => (
                  <tr key={r.row} className={r.ok ? "" : "bg-sindoor/5"}>
                    <td className="px-4 py-2">{r.row}</td>
                    <td className="px-4 py-2">{r.data?.name ?? rows[r.row - 2]?.["Full name"] ?? "–"}</td>
                    <td className="px-4 py-2">{r.data?.mobile ?? "–"}</td>
                    <td className="px-4 py-2">{r.data?.plan ?? "–"}</td>
                    <td className="px-4 py-2">{r.data ? `₹${r.data.amount}` : "–"}</td>
                    <td className="px-4 py-2">{r.data?.paid_on ?? "–"}</td>
                    <td className={`px-4 py-2 font-semibold ${r.ok ? "" : "text-sindoor"}`}>{r.ok ? (r.duplicate ? t.rowUpdate : t.rowNew) : r.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
