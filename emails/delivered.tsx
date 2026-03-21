import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.com.ng";

interface DeliveredEmailProps {
  customerName: string;
  productName: string;
  orderId: string;
}

export function DeliveredEmail({
  customerName,
  productName,
  orderId,
}: DeliveredEmailProps) {
  return (
    <BaseLayout
      preview={`Your ${productName} has been delivered!`}
      heading="Order Delivered 📦"
    >
      <Text style={styles.paragraph}>Hi {customerName},</Text>
      <Text style={styles.paragraph}>
        Your <strong>{productName}</strong> has been
        successfully delivered. We hope you love it!
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.statusSuccess}>
          Thank you for shopping with Ade&apos;s Kolekt. 🙏
        </Text>
      </Section>

      <Text style={styles.paragraph}>
        If you have any issues with your order, please reach out to our support
        team and we&apos;ll make it right.
      </Text>

      <Link href={`${APP_URL}/orders/${orderId}`} style={styles.ctaButton}>
        View Order
      </Link>

      <Text style={styles.mutedText}>
        We&apos;d love to hear your feedback — feel free to reply to this email.
      </Text>
    </BaseLayout>
  );
}
