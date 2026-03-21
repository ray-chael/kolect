import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.com.ng";

interface BaseEmailProps {
  preview: string;
  heading: string;
  children: ReactNode;
}

export function BaseLayout({ preview, heading, children }: BaseEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Brand header */}
          <Section style={header}>
            <Text style={brandName}>Ade&apos;s Kolekt</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={headingStyle}>{heading}</Heading>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you placed an order with{" "}
              <Link href={APP_URL} style={footerLink}>
                Ade&apos;s Kolekt
              </Link>
              .
            </Text>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} Ade&apos;s Kolekt. All rights
              reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  margin: 0,
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#111111",
  border: "1px solid #1f1f1f",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  borderBottom: "1px solid #1f1f1f",
  padding: "20px 32px",
};

const brandName: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "700",
  letterSpacing: "0.05em",
  margin: 0,
};

const content: React.CSSProperties = {
  padding: "32px",
};

const headingStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 16px",
};

const divider: React.CSSProperties = {
  borderColor: "#1f1f1f",
  margin: "0 32px",
};

const footer: React.CSSProperties = {
  padding: "20px 32px 28px",
};

const footerText: React.CSSProperties = {
  color: "#555555",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "0 0 4px",
};

const footerLink: React.CSSProperties = {
  color: "#888888",
  textDecoration: "underline",
};

// ─── Shared helper styles (exported for templates) ───────────

export const styles = {
  paragraph: {
    color: "#b3b3b3",
    fontSize: "15px",
    lineHeight: "1.7",
    margin: "0 0 16px",
  } as React.CSSProperties,

  highlight: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "16px 20px",
    margin: "20px 0",
  } as React.CSSProperties,

  highlightLabel: {
    color: "#888888",
    fontSize: "11px",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    margin: "0 0 4px",
  } as React.CSSProperties,

  highlightValue: {
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "700",
    margin: "0",
  } as React.CSSProperties,

  ctaButton: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    color: "#000000",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "600",
    padding: "12px 28px",
    textDecoration: "none",
  } as React.CSSProperties,

  mutedText: {
    color: "#666666",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "16px 0 0",
  } as React.CSSProperties,

  pill: (color: string) =>
    ({
      backgroundColor: color,
      borderRadius: "100px",
      display: "inline-block",
      fontSize: "11px",
      fontWeight: "600",
      letterSpacing: "0.08em",
      padding: "4px 12px",
      textTransform: "uppercase" as const,
    }) as React.CSSProperties,

  strongText: {
    color: "#ffffff",
  } as React.CSSProperties,

  statusSuccess: {
    color: "#a3e635",
    fontSize: "15px",
    lineHeight: "1.7",
    margin: 0,
    fontWeight: "600",
  } as React.CSSProperties,

  statusError: {
    color: "#ef4444",
    fontSize: "15px",
    lineHeight: "1.7",
    margin: 0,
    fontWeight: "600",
  } as React.CSSProperties,

  highlightValueWarning: {
    color: "#f97316",
    fontSize: "20px",
    fontWeight: "700",
    margin: "0",
  } as React.CSSProperties,

  statusLabel: {
    color: "#888888",
    fontSize: "11px",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    marginBottom: "6px",
    margin: "0 0 6px",
  } as React.CSSProperties,

  riderRow: {
    color: "#ffffff",
    fontSize: "15px",
    lineHeight: "1.7",
    margin: "4px 0",
  } as React.CSSProperties,

  greenLink: {
    color: "#a3e635",
  } as React.CSSProperties,

  noMarginText: {
    color: "#b3b3b3",
    fontSize: "15px",
    lineHeight: "1.7",
    margin: 0,
  } as React.CSSProperties,

  listItem: {
    color: "#b3b3b3",
    fontSize: "15px",
    lineHeight: "1.7",
    margin: "0 0 16px",
    paddingLeft: "16px",
  } as React.CSSProperties,
};