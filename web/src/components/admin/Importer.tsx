"use client";
import { useState, useTransition } from "react";
import Papa from "papaparse";
import { commitImport, previewImport, type RowResult } from "@/app/admin/actions";

export default function Importer() {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  function onFile(f: File | undefined) {
    setMsg(""); setResults(null);
    if (!f) return;
    if (f.size > 5_000_000) return setMsg("That file is too big. Keep it under 5 MB.");
    Papa.parse<Record<string, string>>(f, {
      header: true, skipEmptyLines: "greedy",
      complete: (r) => {
        setRows(r.data);
        start(async () => {
          const p = await previewImport(r.data);
          if ("error" in p) setMsg(p.error!); else setResults(p.results!);
        });
      },
      error: () => setMsg("Couldn't read that file. Save it as CSV from Excel and try again."),
    });
  }

  const good = results?.filter((r) => r.ok) ?? [];
  const bad = results?.filter((r) => !r.ok) ?? [];

  return (
    <div className="grid gap-5">
      <label htmlFor="csv" className="grid cursor-pointer place-items-center gap-2 rounded-3xl border-2 border-dashed border-ink/30 bg-card p-10 text-center transition hover:border-ink hover:bg-sun/20">
        <span className="font-display text-2xl font-extrabold">Choose the CSV file</span>
        <span className="text-ink/70">or drop it here</span>
        <input id="csv" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {pending && <p className="font-semibold">Checking…</p>}
      {msg && <p role="status" className="rounded-xl bg-sun/40 px-4 py-3 font-semibold">{msg}</p>}

      {results && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-card p-5 ring-1 ring-line">
            <span className="rounded-full bg-ink px-3 py-1 font-bold text-sun">{good.length} ready</span>
            <span className="rounded-full bg-line px-3 py-1 font-bold">{good.filter((g) => g.duplicate).length} will update existing members</span>
            <span className="rounded-full bg-sindoor/15 px-3 py-1 font-bold text-sindoor">{bad.length} with problems (skipped)</span>
            <button disabled={!good.length || pending} className="btn-primary ml-auto !px-6 !py-2.5 !text-base disabled:opacity-50"
              onClick={() => start(async () => {
                const r = await commitImport(rows);
                if ("error" in r) setMsg(r.error!);
                else { setMsg(`Done. ${r.imported} imported (${r.updated} updated), ${r.skipped} skipped.`); setResults(null); setRows([]); }
              })}>Import {good.length} members</button>
          </div>
          <div className="max-h-[60vh] overflow-auto rounded-3xl bg-card ring-1 ring-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 bg-sun"><tr>{["Row", "Name", "Mobile", "Plan", "Amount", "Paid on", "Result"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {results.map((r) => (
                  <tr key={r.row} className={r.ok ? "" : "bg-sindoor/5"}>
                    <td className="px-4 py-2">{r.row}</td>
                    <td className="px-4 py-2">{r.data?.name ?? rows[r.row - 2]?.["Full name"] ?? "–"}</td>
                    <td className="px-4 py-2">{r.data?.mobile ?? "–"}</td>
                    <td className="px-4 py-2">{r.data?.plan ?? "–"}</td>
                    <td className="px-4 py-2">{r.data ? `₹${r.data.amount}` : "–"}</td>
                    <td className="px-4 py-2">{r.data?.paid_on ?? "–"}</td>
                    <td className={`px-4 py-2 font-semibold ${r.ok ? "" : "text-sindoor"}`}>{r.ok ? (r.duplicate ? "Update" : "New") : r.error}</td>
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
