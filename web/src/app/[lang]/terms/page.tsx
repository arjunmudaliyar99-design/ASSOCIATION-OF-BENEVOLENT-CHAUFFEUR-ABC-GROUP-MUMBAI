import Policy from "@/components/Policy";
import { pageCtx, pageMeta } from "@/i18n";
export const generateMetadata = ({ params }: { params: Promise<{ lang: string }> }) => pageMeta(params, (t) => ({ title: t.policy.terms }), "/terms");

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, t } = await pageCtx(params);
  return <Policy note={lang === "en" ? undefined : t.common.englishOnly} title={t.policy.terms} sections={[
    { h: "About this website", p: ["This website is run by the Association of Benevolent Chauffeur Group Mumbai, a registered public trust (Reg. No. MU/000566/2023). By using it, you agree to these terms."] },
    { h: "Donations", p: ["Donations are voluntary contributions to support the association's charitable work. Donations are not payment for any goods or services.", "The association decides how funds are used within its stated objectives. A cause you pick is treated as your preference and honoured wherever possible."] },
    { h: "Payments", p: ["Payments are processed by Razorpay Software Pvt. Ltd. Amounts are in Indian Rupees (INR)."] },
    { h: "Content", p: ["Photos and text on this site belong to the association. Please ask before reusing them."] },
    { h: "Law", p: ["These terms are governed by the laws of India. Courts in Mumbai have jurisdiction."] },
  ]} />;
}
