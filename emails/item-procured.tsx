import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface ItemProcuredEmailProps {
  customerName: string;
  productName: string;
  orderId: string;
}

export function ItemProcuredEmail({
  customerName,
  productName,
  orderId,
}: ItemProcuredEmailProps) {
  return (
    <BaseLayout
      preview={`Great news — your ${productName} has been procured!`}
      heading="Item Procured ✅"
    >
      <Text style={styles.paragraph}>Hi {customerName},</Text>
      <Text style={styles.paragraph}>
        Great news! Your{" "}
        <strong>{productName}</strong> has been
        successfully procured and is being prepared for dispatch.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.statusLabel}>Status Update</Text>
        <Text style={styles.statusSuccess}>
          Your item is in our hands — dispatch coming soon.
        </Text>
      </Section>

      <Text style={styles.paragraph}>
        We&apos;ll send you another notification with your rider details once we
        dispatch your order.
      </Text>

      <Link href={`${APP_URL}/orders/${orderId}`} style={styles.ctaButton}>
        Track Order
      </Link>
    </BaseLayout>
  );
}
