import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.com.ng";

interface CampaignMessageAutoEmailProps {
  fromName: string;
  campaignCreatorName: string;
  campaignSlug: string;
  productName: string;
}

export function CampaignMessageAutoEmail({
  fromName,
  campaignCreatorName,
  campaignSlug,
  productName,
}: CampaignMessageAutoEmailProps) {
  return (
    <BaseLayout
      preview={`Your message to ${campaignCreatorName} has been delivered`}
      heading="Message Delivered"
    >
      <Text style={styles.paragraph}>Hi {fromName},</Text>
      <Text style={styles.paragraph}>
        Your message about the <strong>{productName}</strong> campaign has been
        forwarded to <strong>{campaignCreatorName}</strong>. They will be in
        touch with you directly.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Campaign</Text>
        <Text style={styles.highlightValue}>{productName}</Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Campaign Creator</Text>
        <Text style={styles.highlightValue}>{campaignCreatorName}</Text>
      </Section>

      <Link
        href={`${APP_URL}/help-me-pay/${campaignSlug}`}
        style={styles.ctaButton}
      >
        View Campaign
      </Link>

      <Text style={styles.mutedText}>
        If you&apos;d like to contribute to this campaign, visit the link above.
      </Text>
    </BaseLayout>
  );
}
