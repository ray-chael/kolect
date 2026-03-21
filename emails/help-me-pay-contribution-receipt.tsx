import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface HelpMePayContributionReceiptEmailProps {
  contributorName: string;
  productName: string;
  amountContributed: string;
  campaignSlug: string;
  creatorName: string;
}

export function HelpMePayContributionReceiptEmail({
  contributorName,
  productName,
  amountContributed,
  campaignSlug,
  creatorName,
}: HelpMePayContributionReceiptEmailProps) {
  return (
    <BaseLayout
      preview={`Thank you for contributing to ${creatorName}'s campaign`}
      heading="Contribution Received"
    >
      <Text style={styles.paragraph}>Hi {contributorName},</Text>
      <Text style={styles.paragraph}>
        Thank you for your generous contribution to{" "}
        <strong>{creatorName}</strong>&apos;s Help Me Pay campaign for{" "}
        <strong>{productName}</strong>!
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Your Contribution</Text>
        <Text style={styles.highlightValue}>{amountContributed}</Text>
      </Section>

      <Link
        href={`${APP_URL}/help-me-pay/${campaignSlug}`}
        style={styles.ctaButton}
      >
        View Campaign
      </Link>

      <Text style={styles.mutedText}>
        This email is your receipt. Keep it for your records.
      </Text>
    </BaseLayout>
  );
}
