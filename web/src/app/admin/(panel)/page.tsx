import Link from "next/link";
import { memberCode, one, q, today } from "@/lib/db";
import { currentAdmin } from "@/lib/auth";
import { date, inr, Pill, Stat, Table } from "@/components/admin/ui";
import { Icon, SECTION, type SectionKey } from "@/components/admin/sections";
import { adminDict } from "@/i18n";

export const metadata = { title: "Home" };

export default async function Overview() {
  const { lang, t: d } = await adminDict();
  const a = d.admin, st = a.stat, h = a.home;
  const admin = await currentAdmin();
  const t = today();
  const month = t.slice(0, 7);
  const in30 = new Date(Date.parse(`${t}T00:00:00Z`) + 30 * 864e5).toISOString().slice(0, 10);
  const [don, mem, recent, extra] = await Promise.all([
    one<{ month: number; month_n: number; all: number; all_n: number }>(`SELECT
        COALESCE(SUM(CASE WHEN substr(paid_at,1,7) = ? THEN amount_paise END),0) AS month, COUNT(CASE WHEN substr(paid_at,1,7) = ? THEN 1 END) AS month_n,
        COALESCE(SUM(amount_paise),0) AS "all", COUNT(*) AS all_n
      FROM payments WHERE kind = 'donation' AND status = 'paid'`, [month, month]),
    one<{ active: number; pending: number; expiring: number; expired: number; fees_month: number; fees_all: number; fees_all_n: number }>(`SELECT
        COUNT(CASE WHEN status = 'active' AND expires_on >= ? THEN 1 END) AS active,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'active' AND expires_on BETWEEN ? AND ? THEN 1 END) AS expiring,
        COUNT(CASE WHEN status = 'active' AND expires_on < ? THEN 1 END) AS expired,
        (SELECT COALESCE(SUM(amount_paise),0) FROM payments WHERE kind = 'membership' AND status = 'paid' AND substr(paid_at,1,7) = ?) AS fees_month,
        (SELECT COALESCE(SUM(amount_paise),0) FROM payments WHERE kind = 'membership' AND status = 'paid') AS fees_all,
        (SELECT COUNT(*) FROM payments WHERE kind = 'membership' AND status = 'paid') AS fees_all_n
      FROM members`, [t, t, in30, t, month]),
    q<{ order_id: string; kind: string; name: string; member_id: number | null; amount_paise: number; status: string; created_at: string }>(
      "SELECT order_id, kind, name, member_id, amount_paise, status, created_at FROM payments WHERE status = 'paid' ORDER BY paid_at DESC LIMIT 8"),
    one<{ members: number; loans: number; black: number }>(`SELECT
        (SELECT COUNT(*) FROM members WHERE status != 'rejected') AS members,
        (SELECT COUNT(*) FROM loans WHERE status = 'open') AS loans,
        (SELECT COUNT(*) FROM blacklist) AS black`),
  ]);
  const due = Number(mem?.expired ?? 0) + Number(mem?.expiring ?? 0);

  // The home screen: one tile per job, each with its picture, colour and a live count.
  const tiles: { k: SectionKey; title: string; note?: string }[] = [
    { k: "members", title: h.members, note: h.total.replace("{n}", String(Number(extra?.members ?? 0))) },
    { k: "add", title: h.add },
    { k: "renewals", title: h.renewals, note: h.due.replace("{n}", String(due)) },
    { k: "loans", title: h.loans, note: h.open.replace("{n}", String(Number(extra?.loans ?? 0))) },
    { k: "donations", title: h.donations, note: h.thisMonth.replace("{amount}", inr(don?.month)) },
    { k: "blacklist", title: h.blacklist, note: h.total.replace("{n}", String(Number(extra?.black ?? 0))) },
    { k: "import", title: h.upload },
  ];

  return (
    <>
      <section className="mb-8 grid gap-5">
        <div>
          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{h.hello.replace("{name}", admin ?? "")}</h1>
          <p className="mt-1 text-lg text-ink/70">{a.today.replace("{date}", date(t, lang))}</p>
        </div>

        <form action="/admin/members" role="search" className="grid gap-2 rounded-3xl bg-ink p-4 text-paper sm:p-5">
          <label htmlFor="home-q" className="font-display text-xl font-extrabold text-sun">{h.findTitle}</label>
          <div className="flex gap-2">
            <input id="home-q" name="q" inputMode="search" autoComplete="off" placeholder={h.findHint}
              className="min-h-14 min-w-0 flex-1 rounded-2xl border-2 border-transparent bg-paper px-4 text-lg text-ink placeholder:text-ink/50 focus:border-sun focus:outline-none" />
            <button className="flex min-h-14 shrink-0 items-center gap-2 rounded-2xl bg-sun px-5 text-lg font-extrabold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun">
              <Icon name="search" size={24} /><span className="hidden sm:inline">{h.find}</span>
            </button>
          </div>
        </form>
      </section>

      <h2 className="mb-3 font-display text-2xl font-extrabold">{h.ask}</h2>
      <ul className="mb-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
        {tiles.map(({ k, title, note }) => (
          <li key={k}>
            <Link href={SECTION[k].href}
              className={`group flex h-full min-h-36 flex-col justify-between gap-3 rounded-3xl p-4 transition-transform duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink sm:min-h-40 sm:p-5 ${SECTION[k].tile}`}>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
                <Icon name={k} size={34} />
              </span>
              <span className="grid gap-0.5">
                <span className="font-display text-xl font-extrabold leading-tight sm:text-2xl">{title}</span>
                {note && <span className="text-sm font-semibold opacity-85 sm:text-base">{note}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mb-3 font-display text-2xl font-extrabold">{h.numbers}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={st.donMonth} value={inr(don?.month)} hint={st.donCount.replace("{n}", String(don?.month_n ?? 0))} href="/admin/donations" />
        <Stat label={st.feesMonth} value={inr(mem?.fees_month)} href="/admin/members" />
        <Stat label={st.active} value={Number(mem?.active ?? 0)} href="/admin/members?status=active" />
        <Stat label={st.waiting} value={Number(mem?.pending ?? 0)} hint={st.waitingHint} href="/admin/members?status=pending" />
        <Stat label={st.expiring} value={Number(mem?.expiring ?? 0)} href="/admin/renewals" />
        <Stat label={st.expired} value={Number(mem?.expired ?? 0)} href="/admin/members?status=expired" />
        <Stat label={st.feesAll} value={inr(mem?.fees_all)} hint={st.feesCount.replace("{n}", String(mem?.fees_all_n ?? 0))} href="/admin/members" />
        <Stat label={st.donAll} value={inr(don?.all)} hint={st.donCount.replace("{n}", String(don?.all_n ?? 0))} href="/admin/donations" />
      </div>

      <h2 className="mb-3 mt-10 font-display text-2xl font-extrabold">{a.latest}</h2>
      <Table head={[a.th.date, a.th.type, a.th.id, a.th.name, a.th.amount, a.th.status]} empty={!recent.length} emptyText={a.empty}>
        {recent.map((r) => (
          <tr key={r.order_id}>
            <td className="px-4 py-3">{date(r.created_at, lang)}</td>
            <td className="px-4 py-3">{r.kind === "donation" ? a.kind.donation : a.kind.membership}</td>
            <td className="whitespace-nowrap px-4 py-3 font-bold">{r.member_id ? memberCode(Number(r.member_id)) : "–"}</td>
            <td className="px-4 py-3 font-semibold">{r.name}</td>
            <td className="px-4 py-3 font-bold tabular-nums">{inr(r.amount_paise)}</td>
            <td className="px-4 py-3"><Pill s={r.status} label={a.status[r.status as keyof typeof a.status]} /></td>
          </tr>
        ))}
      </Table>
      <p className="mt-4 text-base text-ink/60">{a.help} <Link href="/admin/import" className="font-semibold underline">{h.upload}</Link></p>
    </>
  );
}
