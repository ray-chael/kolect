import { Resend } from "resend";
import type { ReactElement } from "react";
import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Ade's Kolekt <no-reply@kolekt.ng>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
}

/**
 * Send a transactional email via Resend.
 * Returns the message ID on success, null on failure (never throws).
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<string | null> {
  try {
    const html = await render(options.react);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html,
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
    });

    if (error) {
      console.error("[sendEmail] Resend error:", error);
      return null;
    }

    return data?.id ?? null;
  } catch (err) {
    console.error("[sendEmail] unexpected error:", err);
    return null;
  }
}
