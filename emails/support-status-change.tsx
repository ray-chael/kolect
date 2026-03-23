import { Link, Section, Text } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.com.ng";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "#facc15" },
  IN_PROGRESS: { label: "In Progress", color: "#60a5fa" },
  CLOSED: { label: "Closed", color: "#a3e635" },
};

interface SupportStatusChangeEmailProps {
  fromName: string;
  subject: string;
  ticketId: string;
  newStatus: string;
}

export function SupportStatusChangeEmail({
  fromName,
  subject,
  ticketId,
  newStatus,
}: SupportStatusChangeEmailProps) {
  const statusInfo = STATUS_LABELS[newStatus] ?? {
    label: newStatus,
    color: "#888888",
  };

  return (
    <BaseLayout
      preview={`Your support ticket status has been updated to ${statusInfo.label}`}
      heading="Ticket Status Updated"
    >
      <Text style={styles.paragraph}>Hi {fromName},</Text>
      <Text style={styles.paragraph}>
        The status of your support ticket has been updated.
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

      <Section style={styles.highlight}>
        <Text style={styles.highlightLabel}>New Status</Text>
        <Text
          style={{
            ...styles.highlightValue,
            color: statusInfo.color,
          }}
        >
          {statusInfo.label}
        </Text>
      </Section>

      {newStatus === "CLOSED" && (
        <Text style={styles.paragraph}>
          Your ticket has been marked as resolved. If you still need assistance,
          you can reopen it by replying to this email or creating a new ticket.
        </Text>
      )}

      <Link href={`${APP_URL}/support/${ticketId}`} style={styles.ctaButton}>
        View Ticket
      </Link>

      <Text style={styles.mutedText}>
        If you have any questions, feel free to reach out to us at
        support@kolekt.ng.
      </Text>
    </BaseLayout>
  );
}
