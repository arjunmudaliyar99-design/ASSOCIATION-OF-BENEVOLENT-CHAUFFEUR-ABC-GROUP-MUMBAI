import Policy from "@/components/Policy";
import { pageCtx, pageMeta } from "@/i18n";
export const generateMetadata = ({ params }: { params: Promise<{ lang: string }> }) => pageMeta(params, (t) => ({ title: t.policy.privacy }), "/privacy");

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, t } = await pageCtx(params);
  return <Policy note={lang === "en" ? undefined : t.common.englishOnly} title={t.policy.privacy} sections={[
    { h: "What we collect", p: ["When you donate, we collect your name, email address, phone number, the amount and the cause you choose. If you ask for a tax receipt, we also collect your PAN.", "We do not see or store your card, UPI or bank details. Razorpay, our payment partner, handles them under its own security standards (PCI-DSS)."] },
    { h: "Membership documents", p: ["When you join the drivers' network, we collect copies of your Aadhaar card, PAN card and driving licence. They are stored privately, can be opened only by the association's committee after signing in, and are used only to verify your identity and membership. Ask us at any time to delete them if you leave the association."] },
    { h: "How we use it", p: ["To process your donation, send your receipt, keep accounts required by law, and occasionally tell you how donations were used. We never sell or rent your details."] },
    { h: "Who we share it with", p: ["Razorpay, to process the payment, and government authorities when the law requires it. No one else."] },
    { h: "How long we keep it", p: ["Donation records are kept for at least 8 years, as Indian tax law requires for trusts."] },
    { h: "Your choices", p: ["You can ask us to correct your details or stop sending you updates at any time by emailing us."] },
  ]} />;
}
