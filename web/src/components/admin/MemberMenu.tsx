import { moveToBlacklist } from "@/app/admin/actions";
import type { Dict } from "@/i18n/en";

/** The ⋮ menu on a member row: Move to Blacklist (asks for a reason). Works without JavaScript (native <details>). */
export default function MemberMenu({ id, name, t }: { id: number; name: string; t: Dict["admin"]["bl"] }) {
  return (
    <details className="group relative">
      <summary aria-label={`${t.more}: ${name}`} title={t.more}
        className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-full bg-line text-lg font-black leading-none hover:bg-sun focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">⋮</summary>
      <form action={moveToBlacklist} className="absolute right-0 top-10 z-20 grid w-64 gap-2 rounded-2xl bg-paper p-3 text-left shadow-[0_20px_50px_-15px_rgb(var(--ink)/.45)] ring-1 ring-line">
        <input type="hidden" name="id" value={id} />
        <p className="text-sm font-bold">{t.move}</p>
        <label className="grid gap-1 text-xs font-semibold">{t.moveReason}
          <input name="reason" required minLength={3} maxLength={200} className="rounded-xl border border-line bg-card px-3 py-2 text-sm font-normal" />
        </label>
        <button className="rounded-full bg-sindoor px-4 py-2 text-sm font-bold text-paper hover:opacity-90">{t.moveConfirm}</button>
      </form>
    </details>
  );
}
