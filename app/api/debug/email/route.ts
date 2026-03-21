import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import React from "react";
import { GenericNotificationEmail } from "@/emails/generic-notification";

/**
 * GET /api/debug/email?to=you@example.com
 *
 * Diagnostic: sends a test email via Resend to verify the API key and
 * sender domain are working. Only available in non-production environments.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const to = req.nextUrl.searchParams.get("to");
  if (!to || !to.includes("@")) {
    return NextResponse.json(
      { error: "Provide a valid ?to=email@address.com query param" },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || apiKey === "re_PLACEHOLDER") {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set" },
      { status: 500 },
    );
  }

  const messageId = await sendEmail({
    to,
    subject: "Ade's Kolekt — Email diagnostic test",
    react: React.createElement(GenericNotificationEmail, {
      customerName: "Test User",
      subject: "Ade's Kolekt — Email diagnostic test",
      message:
        "This is a diagnostic test email. If you received this, Resend is configured correctly and your sender domain is verified.",
    }),
  });

  if (!messageId) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "sendEmail returned null — check server logs for the Resend error. Most likely cause: sender domain not verified in Resend dashboard.",
        apiKey: `${apiKey.slice(0, 8)}...`,
        from: fromEmail,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    messageId,
    to,
    from: fromEmail,
    message: "Email sent successfully. Check your inbox (and spam folder).",
  });
}
