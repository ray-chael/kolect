import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface PriceLockWarningEmailProps {
  customerName: string;
  productName: string;
  daysLeft: number;
  balanceRemaining: string;
  priceLockExpiresAt: string;
  orderId: string;
}

export function PriceLockWarningEmail({
  customerName,
  productName,
  daysLeft,
  balanceRemaining,
  priceLockExpiresAt,
  orderId,
}: PriceLockWarningEmailProps) {
  return (
    <BaseLayout
      preview={`Action required: Your price lock expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
      heading="Price Lock Expiring Soon ⏰"
    >
      <Text style={styles.paragraph}>Hi {customerName},</Text>
      <Text style={styles.paragraph}>
        Your price lock for{" "}
        <strong>{productName}</strong> is expiring
        soon. Pay the remaining balance before it expires to keep your price.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Days Remaining</Text>
        <Text style={styles.highlightValueWarning}>
          {daysLeft} day{daysLeft !== 1 ? "s" : ""}
        </Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Balance Remaining</Text>
        <Text style={styles.highlightValue}>{balanceRemaining}</Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Price Lock Expires</Text>
        <Text style={styles.highlightValue}>{priceLockExpiresAt}</Text>
      </Section>

      <Text style={styles.paragraph}>
        If the price lock expires without full payment, your order may be
        cancelled and your deposit refunded, minus any applicable fees.
      </Text>

      <Link href={`${APP_URL}/orders/${orderId}`} style={styles.ctaButton}>
        Pay Now
      </Link>

      <Text style={styles.mutedText}>
        Questions? Reply to this email or contact our support team.
      </Text>
    </BaseLayout>
  );
}
