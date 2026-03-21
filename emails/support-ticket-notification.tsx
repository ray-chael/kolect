import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.com.ng";

interface SupportTicketNotificationEmailProps {
  fromEmail: string;
  fromName: string | null;
  subject: string;
  body: string;
  ticketId: string;
  orderId: string | null;
}

export function SupportTicketNotificationEmail({
  fromEmail,
  fromName,
  subject,
  body,
  ticketId,
  orderId,
}: SupportTicketNotificationEmailProps) {
  return (
    <BaseLayout
      preview={`New support ticket from ${fromName ?? fromEmail}: ${subject}`}
      heading="New Support Ticket"
    >
      <Text style={styles.paragraph}>A new support request has arrived.</Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>From</Text>
        <Text style={styles.highlightValue}>
          {fromName ? `${fromName} <${fromEmail}>` : fromEmail}
        </Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Subject</Text>
        <Text style={styles.highlightValue}>{subject}</Text>
      </Section>

      {orderId && (
        <Section style={styles.highlight}>
          <Text style={styles.highlightLabel}>Related Order</Text>
          <Text style={styles.highlightValue}>#{orderId.slice(-8).toUpperCase()}</Text>
        </Section>
      )}

      <Section
        style={{
          background: "#f4f4f5",
          borderRadius: "8px",
          padding: "16px 20px",
          margin: "16px 0",
        }}
      >
        <Text
          style={{
            fontFamily: "sans-serif",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#3f3f46",
            margin: 0,
            whiteSpace: "pre-wrap" as const,
          }}
        >
          {body}
        </Text>
      </Section>

      <Link
        href={`${APP_URL}/admin/support/${ticketId}`}
        style={styles.ctaButton}
      >
        View &amp; Reply in Admin
      </Link>
    </BaseLayout>
  );
}
