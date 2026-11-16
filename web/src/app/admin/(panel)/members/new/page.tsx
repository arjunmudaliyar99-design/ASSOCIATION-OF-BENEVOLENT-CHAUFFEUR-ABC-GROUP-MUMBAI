import { addMonths, today } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import AddMemberForm from "@/components/admin/AddMemberForm";
import { adminDict } from "@/i18n";

export const metadata = { title: "Add member" };
export const dynamic = "force-dynamic";

export default async function NewMember() {
  const { t } = await adminDict();
  return (
    <>
      <PageTitle title={t.admin.addMember} sub={t.admin.addMemberSub} />
      <AddMemberForm defaultValidUntil={addMonths(today(), 12)} t={{ admin: t.admin, join: t.join }} />
    </>
  );
}
