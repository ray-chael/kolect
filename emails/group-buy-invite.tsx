import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.com.ng";

interface GroupBuyInviteEmailProps {
  creatorName: string;
  productName: string;
  targetAmount: string;
  groupBuySlug: string;
  splitType: "EQUAL" | "FLEXIBLE";
  memberCount: number;
}

export function GroupBuyInviteEmail({
  creatorName,
  productName,
  targetAmount,
  groupBuySlug,
  splitType,
  memberCount,
}: GroupBuyInviteEmailProps) {
  return (
    <BaseLayout
      preview={`${creatorName} invited you to a group buy for ${productName}`}
      heading="You've Been Added to a Group Buy"
    >
      <Text style={styles.paragraph}>Hi there,</Text>
      <Text style={styles.paragraph}>
        <strong>{creatorName}</strong> has added you to a group buy for{" "}
        <strong>{productName}</strong>.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Target Amount</Text>
        <Text style={styles.highlightValue}>{targetAmount}</Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Split Type</Text>
        <Text style={styles.highlightValue}>
          {splitType === "EQUAL" ? "Equal split" : "Flexible — pay any amount"}
        </Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Group Size</Text>
        <Text style={styles.highlightValue}>
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </Text>
      </Section>

      <Text style={styles.paragraph}>
        Visit the link below to make your contribution:
      </Text>

      <Link
        href={`${APP_URL}/group-buy/${groupBuySlug}`}
        style={styles.ctaButton}
      >
        View Group Buy &amp; Contribute
      </Link>

      <Text style={styles.paragraph}>
        Only invited members can contribute to this group buy.
      </Text>
    </BaseLayout>
  );
}
