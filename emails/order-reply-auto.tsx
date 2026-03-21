import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface OrderReplyAutoEmailProps {
  fromName: string;
  orderId: string;
  currentStatus: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting payment",
  PARTIAL: "Partially paid",
  PAID: "Fully paid — being procured",
  PROCURED: "Item procured",
  DISPATCHED: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export function OrderReplyAutoEmail({
  fromName,
  orderId,
  currentStatus,
}: OrderReplyAutoEmailProps) {
  const statusLabel = STATUS_LABELS[currentStatus] ?? currentStatus;

  return (
    <BaseLayout
      preview="Message received — we've notified the team about your order"
      heading="Message Received"
    >
      <Text style={styles.paragraph}>Hi {fromName},</Text>
      <Text style={styles.paragraph}>
        We received your message about your order. Our team has been notified
        and will follow up with you soon.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Order</Text>
        <Text style={styles.highlightValue}>#{orderId.slice(-8).toUpperCase()}</Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Current Status</Text>
        <Text style={styles.highlightValue}>{statusLabel}</Text>
      </Section>

      <Link href={`${APP_URL}/orders/${orderId}`} style={styles.ctaButton}>
        View Full Order
      </Link>

      <Text style={styles.mutedText}>
        You can also track your order progress in real time from the link above.
      </Text>
    </BaseLayout>
  );
}
