import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface SignInAlertEmailProps {
  customerName: string;
  signedInAt: string; // pre-formatted date/time string
}

export function SignInAlertEmail({
  customerName,
  signedInAt,
}: SignInAlertEmailProps) {
  return (
    <BaseLayout
      preview={`New sign-in to your Ade's Kolekt account on ${signedInAt}`}
      heading="New sign-in detected"
    >
      <Text style={styles.paragraph}>Hi {customerName},</Text>
      <Text style={styles.paragraph}>
        Your Ade&apos;s Kolekt account was just signed in to on{" "}
        <strong style={styles.strongText}>{signedInAt}</strong>.
      </Text>
      <Text style={styles.paragraph}>
        If this was you, no action is needed. If you don&apos;t recognise this
        sign-in, please secure your account immediately by changing your
        password.
      </Text>

      <Section style={{ margin: "28px 0" }}>
        <Link href={`${APP_URL}/profile`} style={styles.ctaButton}>
          Go to my account
        </Link>
      </Section>

      <Text style={styles.mutedText}>
        For your security, we send this alert every time a new session is
        created on your account. If you&apos;re seeing too many of these, check
        whether you&apos;re signed in on multiple devices.
      </Text>
    </BaseLayout>
  );
}
