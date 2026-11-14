import Policy from "@/components/Policy";
export const metadata = { title: "Refund and cancellation policy" };

export default function Page() {
  return <Policy title="Refund and cancellation policy" sections={[
    { h: "Donations are usually final", p: ["Because donations go straight to charitable work, they are generally not refundable."] },
    { h: "Mistakes we will refund", p: ["If you were charged twice, entered a wrong amount, or a payment was made without your permission, email us within 7 days of the payment with your Razorpay payment ID.", "Approved refunds go back to the original payment method within 5–7 working days."] },
  ]} />;
}
