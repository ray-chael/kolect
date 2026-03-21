import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.com.ng";

interface WelcomeEmailProps {
  customerName: string;
}

export function WelcomeEmail({ customerName }: WelcomeEmailProps) {
  return (
    <BaseLayout
      preview={`Welcome to Ade's Kolekt, ${customerName}!`}
      heading="Welcome to Ade's Kolekt 🛍️"
    >
      <Text style={styles.paragraph}>Hi {customerName} 👋</Text>
      <Text style={styles.paragraph}>
        Your account is ready. Here&apos;s what you can do on Ade&apos;s
        Kolekt:
      </Text>

      <Section style={styles.highlight}>
        <Text style={featureTitle}>Pay Small Small</Text>
        <Text style={featureDesc}>
          Spread the cost of any item with flexible instalments. Pay a deposit
          to lock your price and complete over time.
        </Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={featureTitle}>Group Buy</Text>
        <Text style={featureDesc}>
          Pool contributions with friends or family to buy together and share
          the cost.
        </Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={featureTitle}>Help Me Pay</Text>
        <Text style={featureDesc}>
          Pick any item, create a campaign, share the link, and let the people
          you love contribute towards it.
        </Text>
      </Section>

      <Section style={{ margin: "28px 0" }}>
        <Link href={`${APP_URL}/collection`} style={styles.ctaButton}>
          Start shopping →
        </Link>
      </Section>

      <Text style={styles.mutedText}>
        Questions? Just reply to this email — we&apos;re happy to help.
      </Text>
    </BaseLayout>
  );
}

const featureTitle: React.CSSProperties = {
  ...styles.highlightLabel,
  color: "#d4d4d4",
  fontSize: "13px",
  fontWeight: "600",
  letterSpacing: "0.05em",
  textTransform: "none",
  marginBottom: "4px",
};

const featureDesc: React.CSSProperties = {
  ...styles.paragraph,
  margin: 0,
  fontSize: "13px",
};
