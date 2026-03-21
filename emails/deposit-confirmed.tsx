import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.com.ng";

interface DepositConfirmedEmailProps {
  customerName: string;
  depositAmount: string;
  productName: string;
  priceLockExpiresAt: string;
  orderId: string;
}

export function DepositConfirmedEmail({
  customerName,
  depositAmount,
  productName,
  priceLockExpiresAt,
  orderId,
}: DepositConfirmedEmailProps) {
  return (
    <BaseLayout
      preview={`Deposit confirmed — your price for ${productName} is now locked!`}
      heading="Deposit Confirmed — Price Locked 🔒"
    >
      <Text style={styles.paragraph}>Hi {customerName},</Text>
      <Text style={styles.paragraph}>
        Your deposit has been confirmed and your price for{" "}
        <strong>{productName}</strong> is now locked in.
        Continue your instalment payments at your own pace.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Deposit Paid</Text>
        <Text style={styles.highlightValue}>{depositAmount}</Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Price Lock Expires</Text>
        <Text style={styles.highlightValue}>{priceLockExpiresAt}</Text>
      </Section>

      <Link href={`${APP_URL}/orders/${orderId}`} style={styles.ctaButton}>
        View Order
      </Link>

      <Text style={styles.mutedText}>
        Make sure to complete your payments before the price lock expires to keep your rate.
      </Text>
    </BaseLayout>
  );
}
