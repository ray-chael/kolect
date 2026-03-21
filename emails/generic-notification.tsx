import { Section, Text } from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface GenericNotificationEmailProps {
  customerName: string;
  message: string;
  subject: string;
}

export function GenericNotificationEmail({
  customerName,
  message,
  subject,
}: GenericNotificationEmailProps) {
  return (
    <BaseLayout preview={subject} heading={subject}>
      <Section>
        <Text style={greeting}>Hi {customerName},</Text>
        <Text style={body}>{message}</Text>
        <Text style={footer}>
          Log in to your Ade&apos;s Kolekt account to view more details.
        </Text>
      </Section>
    </BaseLayout>
  );
}

const greeting: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#1a1a1a",
  marginBottom: "8px",
};

const body: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "26px",
  color: "#374151",
  marginBottom: "16px",
};

const footer: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "22px",
  color: "#6b7280",
  marginTop: "24px",
};
