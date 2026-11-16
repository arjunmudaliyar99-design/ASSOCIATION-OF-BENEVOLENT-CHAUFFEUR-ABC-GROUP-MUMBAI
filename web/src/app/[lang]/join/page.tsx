import { permanentRedirect } from "next/navigation";
import { href, isLang } from "@/i18n/config";

/** Online joining was removed: admins now add members. Old /join links go to the contact page. */
export default async function Join({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  permanentRedirect(href(isLang(lang) ? lang : "en", "/contact"));
}
