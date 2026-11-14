import { PageTitle } from "@/components/admin/ui";
import Importer from "@/components/admin/Importer";

export const metadata = { title: "Import members" };

export default function ImportPage() {
  return (
    <>
      <PageTitle title="Import existing members" sub="Add drivers who already paid before the website existed. Nothing is saved until you check the preview and press Import." />
      <ol className="mb-6 grid gap-3 rounded-3xl bg-card p-6 ring-1 ring-line md:grid-cols-3">
        <li><b className="block">1. Download the template</b><a href="/members-import-template.csv" download className="font-semibold underline">members-import-template.csv</a></li>
        <li><b className="block">2. Fill it in Excel or Google Sheets</b><span className="text-ink/70">Required: name, mobile, plan (e.g. “1 year”), amount, paid date (e.g. 15-03-2025). Save as CSV.</span></li>
        <li><b className="block">3. Upload and check the preview</b><span className="text-ink/70">Rows with problems are shown in red and skipped.</span></li>
      </ol>
      <Importer />
    </>
  );
}
