import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface OrderExpiredEmailProps {
  customerName: string;
  productName: string;
  orderId: string;
}

export function OrderExpiredEmail({
  customerName,
  productName,
  orderId,
}: OrderExpiredEmailProps) {
  return (
    <BaseLayout
      preview={`Your order for ${productName} has expired`}
      heading="Order Expired"
    >
      <Text style={styles.paragraph}>Hi {customerName},</Text>
      <Text style={styles.paragraph}>
        Unfortunately, your order for{" "}
        <strong>{productName}</strong> has expired
        because the price lock period ended without full payment being received.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.statusError}>
          This order has been cancelled.
        </Text>
      </Section>

      <Text style={styles.paragraph}>
        If a deposit was made, a refund will be processed within 5–7 business
        days to your original payment method.
      </Text>

      <Text style={styles.paragraph}>
        We understand this is disappointing. If you&apos;re still interested in
        the item, please contact us and we&apos;ll do our best to accommodate
        you.
      </Text>

      <Link href={`${APP_URL}/orders/${orderId}`} style={styles.ctaButton}>
        View Order Details
      </Link>

      <Text style={styles.mutedText}>
        Need help? Reply to this email or reach out to our support team.
      </Text>
    </BaseLayout>
  );
}
