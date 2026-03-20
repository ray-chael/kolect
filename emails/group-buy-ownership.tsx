import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface GroupBuyOwnershipEmailProps {
  contributorName: string;
  productName: string;
  amountContributed: string;
  ownershipPercent: number;
  groupBuySlug: string;
}

export function GroupBuyOwnershipEmail({
  contributorName,
  productName,
  amountContributed,
  ownershipPercent,
  groupBuySlug,
}: GroupBuyOwnershipEmailProps) {
  return (
    <BaseLayout
      preview={`You own ${ownershipPercent}% of ${productName}`}
      heading="Ownership Proof"
    >
      <Text style={styles.paragraph}>Hi {contributorName},</Text>
      <Text style={styles.paragraph}>
        The group buy for <strong>{productName}</strong> has been fully funded!
        Here is your proof of co-ownership.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Your Contribution</Text>
        <Text style={styles.highlightValue}>{amountContributed}</Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Ownership Percentage</Text>
        <Text style={styles.highlightValue}>{ownershipPercent}%</Text>
      </Section>

      <Text style={styles.paragraph}>
        This email serves as your digital certificate of co-ownership.
        Keep it safe for your records.
      </Text>

      <Link
        href={`${APP_URL}/group-buy/${groupBuySlug}`}
        style={styles.ctaButton}
      >
        View Group Buy
      </Link>

      <Text style={styles.mutedText}>
        If you have any questions, reply to this email or contact our support
        team.
      </Text>
    </BaseLayout>
  );
}
