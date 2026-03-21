import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng";

interface SupportTicketReceivedEmailProps {
  fromName: string;
  subject: string;
  ticketId: string;
}

export function SupportTicketReceivedEmail({
  fromName,
  subject,
  ticketId,
}: SupportTicketReceivedEmailProps) {
  return (
    <BaseLayout
      preview={`We've received your support request — ticket #${ticketId.slice(-8)}`}
      heading="Support Request Received"
    >
      <Text style={styles.paragraph}>Hi {fromName},</Text>
      <Text style={styles.paragraph}>
        Thank you for reaching out. We&apos;ve received your message and our
        team will get back to you shortly.
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Subject</Text>
        <Text style={styles.highlightValue}>{subject}</Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Ticket Reference</Text>
        <Text style={styles.highlightValue}>#{ticketId.slice(-8).toUpperCase()}</Text>
      </Section>

      <Text style={styles.paragraph}>
        We typically respond within 24 hours on business days. You can reply
        directly to this email to add more information to your request.
      </Text>

      <Link href={`${APP_URL}/dashboard`} style={styles.ctaButton}>
        View Dashboard
      </Link>

      <Text style={styles.mutedText}>
        If this was sent in error, you can safely ignore this email.
      </Text>
    </BaseLayout>
  );
}
