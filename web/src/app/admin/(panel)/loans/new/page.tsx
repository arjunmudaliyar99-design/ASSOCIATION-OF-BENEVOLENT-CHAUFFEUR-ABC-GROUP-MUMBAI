import { today } from "@/lib/db";
import { input, PageTitle } from "@/components/admin/ui";
import { createLoan } from "@/app/admin/loanActions";
import { schemes } from "@/lib/loans";

export const metadata = { title: "Give a loan" };
export const dynamic = "force-dynamic";

const box = "grid content-start gap-5 rounded-3xl bg-card p-6 ring-1 ring-line sm:p-8";
const lab = "grid gap-1 text-sm font-semibold";

export default async function NewLoan({ searchParams }: { searchParams: Promise<{ err?: string; member?: string }> }) {
  const { err, member } = await searchParams;
  return (
    <>
      <PageTitle title="Give a loan" sub="Enter the member ID and the name and mobile fill in from the member list. For someone who is not a member, leave the ID empty." />
      <form action={createLoan} className="grid gap-6">
        <div className={box}>
          <h2 className="font-display text-2xl font-extrabold">Borrower</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={lab}>Member ID<input name="member" defaultValue={member} placeholder="ABC-0123" className={input} /></label>
            <label className={lab}>Name (if not a member)<input name="name" maxLength={80} className={input} /></label>
            <label className={lab}>Mobile (if not a member)<input name="phone" inputMode="numeric" maxLength={13} className={input} /></label>
          </div>
          <h3 className="font-display text-xl font-extrabold">Reference person</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={lab}>Name<input name="ref_name" maxLength={80} className={input} /></label>
            <label className={lab}>Relation<input name="ref_relation" maxLength={40} placeholder="Wife, brother…" className={input} /></label>
            <label className={lab}>Mobile<input name="ref_phone" inputMode="numeric" maxLength={13} className={input} /></label>
          </div>
        </div>
        <div className={box}>
          <h2 className="font-display text-2xl font-extrabold">Loan</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={lab}>Loan type
              <select name="scheme" defaultValue="small" className={input}>
                {Object.entries(schemes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className={lab}>Amount (₹)<input name="amount" type="number" min={1} step="1" required className={input} /></label>
            <label className={lab}>Given on<input name="given_on" type="date" defaultValue={today()} required className={input} /></label>
          </div>
          <label className={lab}>Notes (optional)<textarea name="notes" rows={3} maxLength={500} className={input} /></label>
        </div>
        {err && <p role="alert" className="rounded-2xl bg-sindoor/10 px-4 py-3 font-semibold text-sindoor">{err}</p>}
        <div><button className="btn-primary !px-8 !py-3">Save loan</button></div>
      </form>
    </>
  );
}
