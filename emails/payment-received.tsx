import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface PaymentReceivedEmailProps {
  customerName: string;
  amountPaid: string;
  balanceRemaining: string;
  productName: string;
  orderId: string;
}

export function PaymentReceivedEmail({
  customerName,
  amountPaid,
  balanceRemaining,
  productName,
  orderId,
}: PaymentReceivedEmailProps) {
  return (
    <BaseLayout
      preview={`Payment of ${amountPaid} received — ${balanceRemaining} remaining`}
      heading="Payment Received"
    >
      <Text style={styles.paragraph}>Hi {customerName},</Text>
      <Text style={styles.paragraph}>
        We&apos;ve received your payment for <strong>{productName}</strong>.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Amount Paid</Text>
        <Text style={styles.highlightValue}>{amountPaid}</Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Remaining Balance</Text>
        <Text style={styles.highlightValue}>{balanceRemaining}</Text>
      </Section>

      <Text style={styles.paragraph}>
        Keep making instalment payments to complete your order.
      </Text>

      <Link href={`${APP_URL}/orders/${orderId}`} style={styles.ctaButton}>
        View Order
      </Link>

      <Text style={styles.mutedText}>
        If you have any questions, reply to this email or contact our support team.
      </Text>
    </BaseLayout>
  );
}
