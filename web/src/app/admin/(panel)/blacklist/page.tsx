import { memberCode, q } from "@/lib/db";
import { removeBlacklist } from "@/app/admin/actions";
import { date, Field, Filters, input, PageTitle } from "@/components/admin/ui";
import BlacklistForm from "@/components/admin/BlacklistForm";
import { adminDict } from "@/i18n";

export const metadata = { title: "Blacklist" };
export const dynamic = "force-dynamic";

type Entry = { id: number; name: string; phone: string | null; reason: string; details: string | null; member_id: number | null; added_by: string; created_at: string };
type File = { id: number; entry_id: number; kind: string; mime: string };

export default async function Blacklist({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: term } = await searchParams;
  const { lang, t } = await adminDict();
  const b = t.admin.bl;
  const like = `%${(term ?? "").trim()}%`;
  const rows = await q<Entry>(
    term?.trim() ? "SELECT * FROM blacklist WHERE name LIKE ? OR phone LIKE ? OR printf('ABC-%04d', member_id) LIKE ? ORDER BY created_at DESC" : "SELECT * FROM blacklist ORDER BY created_at DESC",
    term?.trim() ? [like, like, like.toUpperCase()] : [],
  );
  const files = rows.length
    ? await q<File>(`SELECT id, entry_id, kind, mime FROM blacklist_files WHERE entry_id IN (${rows.map(() => "?").join(",")}) ORDER BY id`, rows.map((r) => r.id))
    : [];
  const url = (id: number) => `/api/admin/blacklist-file/${id}`;

  return (
    <>
      <PageTitle title={b.title} sub={b.sub}>
        <a href={`/api/admin/export?type=${"blacklist"}`} download className="btn-ghost !px-5 !py-2.5 !text-base">{t.admin.csv}</a>
      </PageTitle>
      <div className="grid gap-8">
        <BlacklistForm t={{ admin: t.admin, join: t.join }} />

        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold">{b.count.replace("{n}", String(rows.length))}</h2>
            <Filters apply={t.admin.apply}><Field label={t.admin.search}><input name="q" defaultValue={term} placeholder={b.search} className={`${input} w-64`} /></Field></Filters>
          </div>
          {!rows.length && <p className="rounded-3xl bg-card p-6 text-ink/70 ring-1 ring-line">{b.empty}</p>}
          <ul className="grid gap-4 lg:grid-cols-2">
            {rows.map((r) => {
              const mine = files.filter((f) => f.entry_id === r.id);
              const photo = mine.find((f) => f.kind === "photo");
              const docs = mine.filter((f) => f.kind !== "photo");
              return (
                <li key={r.id} className="grid gap-4 rounded-3xl bg-card p-5 ring-1 ring-sindoor/30 sm:grid-cols-[7rem_1fr]">
                  {photo
                    ? <a href={url(photo.id)} target="_blank" rel="noopener noreferrer"><img src={url(photo.id)} alt={r.name} className="h-28 w-28 rounded-2xl object-cover ring-1 ring-line" /></a>
                    : <span className="grid h-28 w-28 place-items-center rounded-2xl bg-line text-sm text-ink/60">{b.noPhoto}</span>}
                  <div className="grid content-start gap-2">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      {r.member_id && <span className="rounded-full bg-ink px-2.5 py-0.5 font-mono text-xs font-bold text-sun">{memberCode(r.member_id)}</span>}
                      <h3 className="font-display text-xl font-extrabold">{r.name}</h3>
                      {r.phone && <a href={`tel:+91${r.phone}`} className="font-mono text-sm underline">{r.phone}</a>}
                    </div>
                    <p className="font-semibold text-sindoor">{r.reason}</p>
                    {r.details && <p className="whitespace-pre-line text-sm text-ink/80">{r.details}</p>}
                    {!!docs.length && (
                      <div className="flex flex-wrap gap-2">
                        {docs.map((d, i) => <a key={d.id} href={url(d.id)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-sun/50 px-3 py-1 text-xs font-bold hover:bg-sun">{b.docN.replace("{n}", String(i + 1))}{d.mime === "application/pdf" ? " (PDF)" : ""}</a>)}
                      </div>
                    )}
                    <p className="text-xs text-ink/60">{b.addedBy.replace("{who}", r.added_by).replace("{date}", date(r.created_at, lang))}</p>
                    <form action={removeBlacklist}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="rounded-full bg-sindoor/15 px-4 py-2 text-xs font-bold text-sindoor hover:bg-sindoor/25">{b.remove}</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
