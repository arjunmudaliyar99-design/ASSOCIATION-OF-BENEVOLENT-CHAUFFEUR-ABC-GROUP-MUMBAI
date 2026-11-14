import Policy from "@/components/Policy";
import { pageCtx, pageMeta } from "@/i18n";
export const generateMetadata = ({ params }: { params: Promise<{ lang: string }> }) => pageMeta(params, (t) => ({ title: t.policy.refund }), "/refund-policy");

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, t } = await pageCtx(params);
  return <Policy note={lang === "en" ? undefined : t.common.englishOnly} title={t.policy.refund} sections={[
    { h: "Donations are usually final", p: ["Because donations go straight to charitable work, they are generally not refundable."] },
    { h: "Mistakes we will refund", p: ["If you were charged twice, entered a wrong amount, or a payment was made without your permission, email us within 7 days of the payment with your Razorpay payment ID.", "Approved refunds go back to the original payment method within 5–7 working days."] },
  ]} />;
}
