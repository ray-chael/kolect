import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.com.ng";

interface OrderFullyPaidEmailProps {
  customerName: string;
  productName: string;
  totalAmount: string;
  orderId: string;
}

export function OrderFullyPaidEmail({
  customerName,
  productName,
  totalAmount,
  orderId,
}: OrderFullyPaidEmailProps) {
  return (
    <BaseLayout
      preview={`Order fully paid! We're beginning procurement for ${productName}`}
      heading="Order Fully Paid 🎉"
    >
      <Text style={styles.paragraph}>Hi {customerName},</Text>
      <Text style={styles.paragraph}>
        Congratulations! Your order for{" "}
        <strong>{productName}</strong> is fully paid.
        We will begin procurement shortly and keep you updated every step of the way.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Total Paid</Text>
        <Text style={styles.highlightValue}>{totalAmount}</Text>
      </Section>

      <Text style={styles.paragraph}>What happens next:</Text>
      <Text style={styles.listItem}>
        &bull; We place your order with our supplier<br />
        &bull; We notify you when your item is procured<br />
        &bull; We dispatch and deliver to your doorstep
      </Text>

      <Link href={`${APP_URL}/orders/${orderId}`} style={styles.ctaButton}>
        Track Order
      </Link>
    </BaseLayout>
  );
}
