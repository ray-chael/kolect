/**
 * Resend Inbound Email API helpers.
 * Used to fetch email body and attachments after receiving a webhook event.
 * Webhooks only contain metadata; full content must be fetched separately.
 */

const RESEND_API_BASE = "https://api.resend.com";

export interface ResendReceivedEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  html_body: string | null;
  text_body: string | null;
  created_at: string;
  attachments: ResendInboundAttachment[];
}

export interface ResendInboundAttachment {
  id: string;
  filename: string;
  content_type: string;
  content_disposition: string;
  content_id?: string;
}

/**
 * Fetch the full content of a received email (body + attachment metadata).
 * Returns null on any error — never throws.
 */
export async function getReceivedEmail(
  emailId: string,
): Promise<ResendReceivedEmail | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${RESEND_API_BASE}/emails/received/${emailId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<ResendReceivedEmail>;
  } catch {
    return null;
  }
}

/**
 * Download an attachment as a Buffer by its ID.
 * Returns null on any error — never throws.
 */
export async function getAttachmentBuffer(
  emailId: string,
  attachmentId: string,
): Promise<{ buffer: Buffer; filename: string; contentType: string } | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  try {
    // Get attachment metadata to find filename
    const emailData = await getReceivedEmail(emailId);
    const att = emailData?.attachments.find((a) => a.id === attachmentId);

    const res = await fetch(
      `${RESEND_API_BASE}/emails/received/${emailId}/attachments/${attachmentId}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { content: string };
    return {
      buffer: Buffer.from(data.content, "base64"),
      filename: att?.filename ?? attachmentId,
      contentType: att?.content_type ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

/**
 * Extract plain text from an email (prefers text_body, strips HTML tags from html_body as fallback).
 */
export function extractPlainText(email: ResendReceivedEmail): string {
  if (email.text_body) return email.text_body.trim();
  if (email.html_body) {
    return email.html_body
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return "";
}

/**
 * Extract the first order ID found in a string (e.g. subject line).
 * Looks for CUID-shaped or hash-prefixed IDs like "#clxabc123" or "clxabc123abc" (26 chars).
 */
export function extractOrderId(text: string): string | null {
  // CUID format: starts with 'c', 25 chars total
  const cuidMatch = text.match(/\bc[a-z0-9]{24}\b/i);
  return cuidMatch?.[0] ?? null;
}
