import { redirect } from "next/navigation";

/** Plans were removed from the admin: members are added manually with a valid-until date. */
export default function Plans() {
  redirect("/admin/members/new");
}
