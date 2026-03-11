import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface OutForDeliveryEmailProps {
  customerName: string;
  productName: string;
  riderName?: string;
  riderPhone?: string;
  trackingNote?: string;
  orderId: string;
}

export function OutForDeliveryEmail({
  customerName,
  productName,
  riderName,
  riderPhone,
  trackingNote,
  orderId,
}: OutForDeliveryEmailProps) {
  return (
    <BaseLayout
      preview={`Your ${productName} is out for delivery!`}
      heading="Out for Delivery 🚴"
    >
      <Text style={styles.paragraph}>Hi {customerName},</Text>
      <Text style={styles.paragraph}>
        Your <strong>{productName}</strong> is on its
        way to you right now!
      </Text>

      {(riderName || riderPhone) && (
        <Section style={styles.highlight}>
          <Text style={styles.highlightLabel}>Rider Details</Text>
          {riderName && (
            <Text style={styles.riderRow}>
              <strong>Name:</strong> {riderName}
            </Text>
          )}
          {riderPhone && (
            <Text style={styles.riderRow}>
              <strong>Phone:</strong>{" "}
              <Link href={`tel:${riderPhone}`} style={styles.greenLink}>
                {riderPhone}
              </Link>
            </Text>
          )}
        </Section>
      )}

      {trackingNote && (
        <Section style={styles.highlight}>
          <Text style={styles.highlightLabel}>Note from Team</Text>
          <Text style={styles.noMarginText}>{trackingNote}</Text>
        </Section>
      )}

      <Text style={styles.paragraph}>
        Please ensure someone is available to receive the package.
      </Text>

      <Link href={`${APP_URL}/orders/${orderId}`} style={styles.ctaButton}>
        View Order
      </Link>
    </BaseLayout>
  );
}
