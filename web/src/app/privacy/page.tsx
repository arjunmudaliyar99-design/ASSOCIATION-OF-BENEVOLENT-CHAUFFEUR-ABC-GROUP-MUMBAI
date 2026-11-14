import Policy from "@/components/Policy";
export const metadata = { title: "Privacy policy" };

export default function Page() {
  return <Policy title="Privacy policy" sections={[
    { h: "What we collect", p: ["When you donate, we collect your name, email address, phone number, the amount and the cause you choose. If you ask for a tax receipt, we also collect your PAN.", "We do not see or store your card, UPI or bank details. Razorpay, our payment partner, handles them under its own security standards (PCI-DSS)."] },
    { h: "How we use it", p: ["To process your donation, send your receipt, keep accounts required by law, and occasionally tell you how donations were used. We never sell or rent your details."] },
    { h: "Who we share it with", p: ["Razorpay, to process the payment, and government authorities when the law requires it. No one else."] },
    { h: "How long we keep it", p: ["Donation records are kept for at least 8 years, as Indian tax law requires for trusts."] },
    { h: "Your choices", p: ["You can ask us to correct your details or stop sending you updates at any time by emailing us."] },
  ]} />;
}
