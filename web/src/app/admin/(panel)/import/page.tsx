import { PageTitle } from "@/components/admin/ui";
import Importer from "@/components/admin/Importer";
import { adminDict } from "@/i18n";

export const metadata = { title: "Import members" };

export default async function ImportPage() {
  const { t } = await adminDict();
  const a = t.admin;
  return (
    <>
      <PageTitle section="import" title={a.importTitle} sub={a.importSub} />
      <ol className="mb-6 grid gap-3 rounded-3xl bg-card p-6 ring-1 ring-line md:grid-cols-3">
        <li><b className="block">{a.importStep1}</b><a href="/members-import-template.csv" download className="font-semibold underline">members-import-template.csv</a></li>
        <li><b className="block">{a.importStep2}</b><span className="text-ink/70">{a.importStep2Body}</span></li>
        <li><b className="block">{a.importStep3}</b><span className="text-ink/70">{a.importStep3Body}</span></li>
      </ol>
      <Importer t={a} />
    </>
  );
}
