import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.com.ng";

interface SupportReplyNotificationEmailProps {
  fromName: string;
  subject: string;
  body: string;
  ticketId: string;
  isFromAdmin: boolean;
}

export function SupportReplyNotificationEmail({
  fromName,
  subject,
  body,
  ticketId,
  isFromAdmin,
}: SupportReplyNotificationEmailProps) {
  const heading = isFromAdmin
    ? "New Reply to Your Ticket"
    : "New Customer Reply";
  const preview = isFromAdmin
    ? `Our team replied to your ticket: ${subject}`
    : `${fromName} replied to ticket: ${subject}`;

  return (
    <BaseLayout preview={preview} heading={heading}>
      <Text style={styles.paragraph}>
        {isFromAdmin
          ? `Hi ${fromName}, our support team has replied to your ticket.`
          : `${fromName} has sent a new reply on their support ticket.`}
      </Text>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Subject</Text>
        <Text style={styles.highlightValue}>{subject}</Text>
      </Section>

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>Ticket Reference</Text>
        <Text style={styles.highlightValue}>
          #{ticketId.slice(-8).toUpperCase()}
        </Text>
      </Section>

      <Section
        style={{
          background: "#1a1a1a",
          borderRadius: "8px",
          padding: "16px 20px",
          margin: "16px 0",
          border: "1px solid #2a2a2a",
        }}
      >
        <Text
          style={{
            fontFamily: "sans-serif",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#b3b3b3",
            margin: 0,
            whiteSpace: "pre-wrap" as const,
          }}
        >
          {body}
        </Text>
      </Section>

      <Link
        href={
          isFromAdmin
            ? `${APP_URL}/support/${ticketId}`
            : `${APP_URL}/admin/support/${ticketId}`
        }
        style={styles.ctaButton}
      >
        {isFromAdmin ? "View Ticket" : "View & Reply in Admin"}
      </Link>

      <Text style={styles.mutedText}>
        You can reply directly to this email to continue the conversation.
      </Text>
    </BaseLayout>
  );
}
