import { Link, Section, Text, Row, Column, Hr } from "@react-email/components";
import { BaseLayout, styles } from "./base-layout";

interface PendingOrder {
  id: string;
  shortId: string;
}

interface PaymentProofNoOrderIdEmailProps {
  fromName: string;
  pendingOrders: PendingOrder[];
}

export function PaymentProofNoOrderIdEmail({
  fromName,
  pendingOrders,
}: PaymentProofNoOrderIdEmailProps) {
  return (
    <BaseLayout
      preview="Action needed — we couldn't link your receipt to an order"
      heading="We Couldn't Match Your Receipt"
    >
      <Text style={styles.paragraph}>Hi {fromName},</Text>
      <Text style={styles.paragraph}>
        Thank you for sending your payment receipt. Unfortunately, we
        couldn&apos;t find an order ID in your subject line, so we were unable
        to link your payment to an order automatically.
      </Text>

      <Text style={styles.paragraph}>
        Please <strong>reply to this email</strong> or resend your receipt to{" "}
        <strong>receipts@kolekt.com.ng</strong> with your order ID in the
        subject line, like this:
      </Text>

      <Section
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          padding: "14px 20px",
          margin: "20px 0",
        }}
      >
        <Text
          style={{
            color: "#e2e8f0",
            fontFamily: "monospace",
            fontSize: "13px",
            margin: 0,
          }}
        >
          Payment for Order YOUR_ORDER_ID
        </Text>
      </Section>

      {pendingOrders.length > 0 && (
        <>
          <Text style={{ ...styles.paragraph, marginBottom: "8px" }}>
            We found these pending orders on your account:
          </Text>
          {pendingOrders.map((order) => (
            <Row key={order.id} style={{ margin: "4px 0" }}>
              <Column>
                <Text
                  style={{
                    color: "#b3b3b3",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    margin: 0,
                    padding: "6px 12px",
                    backgroundColor: "#1a1a1a",
                    borderRadius: "4px",
                    display: "inline-block",
                  }}
                >
                  #{order.shortId} — full ID: {order.id}
                </Text>
              </Column>
            </Row>
          ))}
          <Text style={{ ...styles.mutedText, marginTop: "12px" }}>
            Copy the full order ID from the list above and paste it into your
            subject line.
          </Text>
        </>
      )}

      {pendingOrders.length === 0 && (
        <Text style={styles.paragraph}>
          You can find your order ID in the{" "}
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.com.ng"}/orders`} style={{ color: "#888888" }}>
            orders section
          </Link>{" "}
          of your account.
        </Text>
      )}

      <Hr style={{ borderColor: "#1f1f1f", margin: "24px 0" }} />

      <Text style={styles.mutedText}>
        If you&apos;re not sure what your order ID is, reply to this email and
        we&apos;ll help you sort it out.
      </Text>
    </BaseLayout>
  );
}
