import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface PaymentProofReceivedEmailProps {
  fromName: string;
  orderId: string;
  attachmentCount: number;
}

export function PaymentProofReceivedEmail({
  fromName,
  orderId,
  attachmentCount,
}: PaymentProofReceivedEmailProps) {
  return (
    <BaseLayout
      preview="Payment proof received — we'll verify and update your order shortly"
      heading="Payment Proof Received"
    >
      <Text style={styles.paragraph}>Hi {fromName},</Text>
      <Text style={styles.paragraph}>
        We&apos;ve received your bank transfer receipt and will verify your
        payment shortly. Your order will be updated once the payment is
        confirmed.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Order</Text>
        <Text style={styles.highlightValue}>#{orderId.slice(-8).toUpperCase()}</Text>
      </Section>

      {attachmentCount > 0 && (
        <Section style={styles.highlight}>
          <Text style={styles.highlightLabel}>Attachments Received</Text>
          <Text style={styles.highlightValue}>
            {attachmentCount} file{attachmentCount !== 1 ? "s" : ""}
          </Text>
        </Section>
      )}

      <Text style={styles.paragraph}>
        We typically verify payments within a few hours. You&apos;ll receive
        another email as soon as your order is confirmed.
      </Text>

      <Link href={`${APP_URL}/orders/${orderId}`} style={styles.ctaButton}>
        View Order Status
      </Link>

      <Text style={styles.mutedText}>
        If your order isn&apos;t updated within 24 hours, please contact us at{" "}
        support@kolekt.ng.
      </Text>
    </BaseLayout>
  );
}
