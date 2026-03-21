import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface HelpMePayFundedEmailProps {
  creatorName: string;
  productName: string;
  totalAmount: string;
  orderId: string | null;
  campaignSlug: string;
}

export function HelpMePayFundedEmail({
  creatorName,
  productName,
  totalAmount,
  orderId,
  campaignSlug,
}: HelpMePayFundedEmailProps) {
  return (
    <BaseLayout
      preview={`Your Help Me Pay campaign for ${productName} is fully funded!`}
      heading="Campaign Fully Funded 🎉"
    >
      <Text style={styles.paragraph}>Hi {creatorName},</Text>
      <Text style={styles.paragraph}>
        Amazing news! Your Help Me Pay campaign for{" "}
        <strong>{productName}</strong> has reached its funding target.
        Your order has been placed and we will begin procurement shortly.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Total Raised</Text>
        <Text style={styles.highlightValue}>{totalAmount}</Text>
      </Section>

      <Text style={styles.paragraph}>What happens next:</Text>
      <Text style={styles.listItem}>
        &bull; We place your order with the supplier<br />
        &bull; We notify you when your item is procured<br />
        &bull; We dispatch and deliver to your doorstep
      </Text>

      {orderId ? (
        <Link href={`${APP_URL}/orders/${orderId}`} style={styles.ctaButton}>
          Track Your Order
        </Link>
      ) : (
        <Link
          href={`${APP_URL}/help-me-pay/${campaignSlug}`}
          style={styles.ctaButton}
        >
          View Campaign
        </Link>
      )}

      <Text style={styles.mutedText}>
        Thank you to everyone who contributed to your campaign!
      </Text>
    </BaseLayout>
  );
}
