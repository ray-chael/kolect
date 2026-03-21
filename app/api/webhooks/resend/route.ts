import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
    getReceivedEmail,
    getAttachmentBuffer,
    extractPlainText,
    extractOrderId,
} from "@/lib/resend-inbound";
import { uploadMedia } from "@/lib/cloudinary";
import { notificationService } from "@/lib/services/notification.service";
import React from "react";
import { SupportTicketReceivedEmail } from "@/emails/support-ticket-received";
import { SupportTicketNotificationEmail } from "@/emails/support-ticket-notification";
import { PaymentProofReceivedEmail } from "@/emails/payment-proof-received";
import { OrderReplyAutoEmail } from "@/emails/order-reply-auto";
import { CampaignMessageAutoEmail } from "@/emails/campaign-message-auto";

// ─── Svix-compatible HMAC-SHA256 signature verification ─────────
// Resend uses the Svix webhook infrastructure. The secret is base64 encoded
// and prefixed with "whsec_". The signed content is `svix-id.svix-timestamp.body`.

function verifyResendSignature(
  body: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null,
): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret || !svixId || !svixTimestamp || !svixSignature) return false;

  // Reject timestamps older than 5 minutes (replay attack protection)
  const tsSec = parseInt(svixTimestamp, 10);
  if (isNaN(tsSec) || Math.abs(Date.now() / 1000 - tsSec) > 300) return false;

  const toSign = `${svixId}.${svixTimestamp}.${body}`;
  const secretBytes = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice(6) : secret,
    "base64",
  );
  const computedSig = crypto
    .createHmac("sha256", secretBytes)
    .update(toSign)
    .digest("base64");

  // Header can contain multiple sigs separated by spaces: "v1,<sig1> v1,<sig2>"
  const signatures = svixSignature.split(" ").map((s) => s.replace(/^v1,/, ""));
  return signatures.some((sig) => {
    const a = Buffer.from(sig, "base64");
    const b = Buffer.from(computedSig, "base64");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

// ─── Inbound event shape ─────────────────────────────────────────

interface ResendInboundEvent {
  type: "email.received";
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    bcc?: string[];
    cc?: string[];
    message_id: string;
    subject: string;
    attachments?: {
      id: string;
      filename: string;
      content_type: string;
      content_disposition: string;
      content_id?: string;
    }[];
  };
}

// ─── POST handler ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.text();

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!verifyResendSignature(body, svixId, svixTimestamp, svixSignature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: ResendInboundEvent;
  try {
    event = JSON.parse(body) as ResendInboundEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ received: true });
  }

  const { data } = event;

  // Persist raw webhook
  prisma.webhookLog
    .create({
      data: {
        source: "resend",
        event: event.type,
        reference: data.email_id,
        rawBody: body,
        payload: JSON.parse(body),
      },
    })
    .catch(console.error);

  // Route based on the first `to` address
  const toAddress = (data.to[0] ?? "").toLowerCase();

  if (toAddress.includes("receipts@")) {
    await handlePaymentProof(data);
  } else if (toAddress.includes("support@")) {
    await handleSupportTicket(data);
  } else if (toAddress.includes("orders@")) {
    await handleOrderReply(data);
  } else if (toAddress.includes("campaigns@")) {
    await handleCampaignMessage(data);
  }

  return NextResponse.json({ received: true });
}

// ─── Helpers: extract sender name ───────────────────────────────

function parseSenderName(from: string): { name: string; email: string } {
  // "John Doe <john@example.com>" or "john@example.com"
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: from.split("@")[0], email: from };
}

// ─── Admin email helper ──────────────────────────────────────────

async function getAdminEmail(): Promise<string | null> {
  const admin = await prisma.user.findFirst({
    where: { role: "CRIMSON" },
    select: { id: true, email: true },
  });
  return admin?.email ?? null;
}

// ─── 1. Payment Proof ────────────────────────────────────────────

async function handlePaymentProof(
  data: ResendInboundEvent["data"],
): Promise<void> {
  const { name: fromName, email: fromEmail } = parseSenderName(data.from);

  // Extract order ID from subject
  const orderId = extractOrderId(data.subject) ?? extractOrderId(data.from);
  if (!orderId) {
    // Can't link without an order ID — still create a support ticket fallback
    await handleSupportTicket(data);
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    await handleSupportTicket(data);
    return;
  }

  // Upload all image/PDF attachments to Cloudinary
  const rawAttachments = data.attachments ?? [];
  const attachmentUrls: string[] = [];

  for (const att of rawAttachments) {
    const isImage = att.content_type.startsWith("image/");
    const isPdf = att.content_type === "application/pdf";
    if (!isImage && !isPdf) continue;

    const result = await getAttachmentBuffer(data.email_id, att.id);
    if (!result) continue;

    try {
      const asset = await uploadMedia(result.buffer, {
        folder: "ades-collection/payment-proofs",
        resourceType: isImage ? "image" : "image", // Cloudinary handles PDFs as images
        filename: att.filename,
      });
      attachmentUrls.push(asset.url);
    } catch (err) {
      console.error("[ResendWebhook] Cloudinary upload failed:", err);
    }
  }

  const proof = await prisma.paymentProof.create({
    data: {
      orderId,
      fromEmail,
      subject: data.subject,
      resendEmailId: data.email_id,
      attachmentUrls,
      rawAttachments: rawAttachments,
    },
  });

  // Auto-reply to sender
  sendEmail({
    to: fromEmail,
    subject: "Payment proof received — Ade's Kolekt",
    react: React.createElement(PaymentProofReceivedEmail, {
      fromName,
      orderId,
      attachmentCount: attachmentUrls.length,
    }),
    replyTo: "support@kolekt.ng",
  }).catch(console.error);

  // Notify admin
  const adminEmail = await getAdminEmail();
  const admin = await prisma.user.findFirst({ where: { role: "CRIMSON" } });

  if (admin) {
    notificationService
      .queue({
        userId: admin.id,
        orderId,
        channel: "EMAIL",
        type: "PAYMENT_PROOF_SUBMITTED",
        message: `Payment proof submitted by ${fromEmail} for order #${orderId.slice(-8).toUpperCase()}.`,
      })
      .catch(console.error);
  }

  if (adminEmail) {
    sendEmail({
      to: adminEmail,
      subject: `Payment proof submitted — Order #${orderId.slice(-8).toUpperCase()}`,
      react: React.createElement("div", {}, [
        React.createElement("p", { key: "1" }, `From: ${fromEmail}`),
        React.createElement("p", { key: "2" }, `Subject: ${data.subject}`),
        React.createElement("p", { key: "3" }, `Proof ID: ${proof.id}`),
        React.createElement(
          "p",
          { key: "4" },
          `Attachments uploaded: ${attachmentUrls.length}`,
        ),
        React.createElement(
          "a",
          {
            key: "5",
            href: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://kolekt.ng"}/admin/payment-proofs/${proof.id}`,
          },
          "Review Payment Proof",
        ),
      ]),
    }).catch(console.error);
  }
}

// ─── 2. Support Ticket ───────────────────────────────────────────

async function handleSupportTicket(
  data: ResendInboundEvent["data"],
): Promise<void> {
  const { name: fromName, email: fromEmail } = parseSenderName(data.from);

  // Fetch full email body
  const emailContent = await getReceivedEmail(data.email_id);
  const body = emailContent ? extractPlainText(emailContent) : "";

  // Try to link to an order if mentioned in subject
  const mentionedOrderId = extractOrderId(data.subject);
  const order = mentionedOrderId
    ? await prisma.order.findUnique({ where: { id: mentionedOrderId } })
    : null;

  // Try to link to a known user
  const user = await prisma.user.findUnique({ where: { email: fromEmail } });

  // Check if a ticket with this email_id already exists (idempotency)
  const existing = await prisma.supportTicket.findUnique({
    where: { resendEmailId: data.email_id },
  });
  if (existing) return;

  const ticket = await prisma.supportTicket.create({
    data: {
      fromEmail,
      fromName,
      subject: data.subject,
      body: body || null,
      resendEmailId: data.email_id,
      orderId: order?.id ?? null,
      userId: user?.id ?? null,
    },
  });

  // Auto-reply to sender
  sendEmail({
    to: fromEmail,
    subject: `Re: ${data.subject}`,
    react: React.createElement(SupportTicketReceivedEmail, {
      fromName,
      subject: data.subject,
      ticketId: ticket.id,
    }),
    replyTo: "support@kolekt.ng",
  }).catch(console.error);

  // Notify admin
  const adminEmail = await getAdminEmail();
  const admin = await prisma.user.findFirst({ where: { role: "CRIMSON" } });

  if (admin) {
    notificationService
      .queue({
        userId: admin.id,
        channel: "EMAIL",
        type: "SUPPORT_TICKET_OPENED",
        message: `New support ticket from ${fromEmail}: "${data.subject}"`,
      })
      .catch(console.error);
  }

  if (adminEmail) {
    sendEmail({
      to: adminEmail,
      subject: `New support ticket: ${data.subject}`,
      react: React.createElement(SupportTicketNotificationEmail, {
        fromEmail,
        fromName,
        subject: data.subject,
        body,
        ticketId: ticket.id,
        orderId: order?.id ?? null,
      }),
      replyTo: fromEmail,
    }).catch(console.error);
  }
}

// ─── 3. Order Reply ──────────────────────────────────────────────

async function handleOrderReply(
  data: ResendInboundEvent["data"],
): Promise<void> {
  const { name: fromName, email: fromEmail } = parseSenderName(data.from);

  const orderId = extractOrderId(data.subject) ?? extractOrderId(data.message_id);
  if (!orderId) {
    // Fall through to support ticket
    await handleSupportTicket(data);
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });
  if (!order) {
    await handleSupportTicket(data);
    return;
  }

  const emailContent = await getReceivedEmail(data.email_id);
  const body = emailContent ? extractPlainText(emailContent) : "(no body)";

  // Idempotency check
  const existing = await prisma.orderMessage.findUnique({
    where: { resendEmailId: data.email_id },
  });
  if (existing) return;

  await prisma.orderMessage.create({
    data: {
      orderId,
      fromEmail,
      body,
      resendEmailId: data.email_id,
    },
  });

  // Auto-reply to sender
  sendEmail({
    to: fromEmail,
    subject: `Re: Order #${orderId.slice(-8).toUpperCase()}`,
    react: React.createElement(OrderReplyAutoEmail, {
      fromName,
      orderId,
      currentStatus: order.status,
    }),
    replyTo: "orders@kolekt.ng",
  }).catch(console.error);

  // Notify admin
  const admin = await prisma.user.findFirst({ where: { role: "CRIMSON" } });
  if (admin) {
    notificationService
      .queue({
        userId: admin.id,
        orderId,
        channel: "EMAIL",
        type: "ORDER_MESSAGE_RECEIVED",
        message: `Message from ${fromEmail} about order #${orderId.slice(-8).toUpperCase()}.`,
      })
      .catch(console.error);
  }
}

// ─── 4. Campaign Message ─────────────────────────────────────────

async function handleCampaignMessage(
  data: ResendInboundEvent["data"],
): Promise<void> {
  const { name: fromName, email: fromEmail } = parseSenderName(data.from);

  // Try to identify campaign by slug or ID in subject
  const campaignSlugOrId =
    extractOrderId(data.subject) ??
    data.subject.split(" ").find((w) => w.length > 10) ??
    "";

  const emailContent = await getReceivedEmail(data.email_id);
  const body = emailContent ? extractPlainText(emailContent) : "(no body)";

  // Try Help Me Pay first, then Group Buy
  let campaignType: "help_me_pay" | "group_buy" = "help_me_pay";
  let campaignId = "unknown";
  let creatorId: string | null = null;
  let creatorEmail: string | null = null;
  let creatorName: string | null = null;
  let productName = "the campaign";
  let campaignSlug = "";

  const hmp = campaignSlugOrId
    ? await prisma.helpMePay.findFirst({
        where: {
          OR: [{ id: campaignSlugOrId }, { slug: campaignSlugOrId }],
        },
        include: { creator: true, product: true },
      })
    : null;

  if (hmp) {
    campaignType = "help_me_pay";
    campaignId = hmp.id;
    creatorId = hmp.creatorId;
    creatorEmail = hmp.creator.email;
    creatorName = hmp.creator.name;
    productName = hmp.product?.name ?? "the campaign";
    campaignSlug = hmp.slug;
  } else {
    const gb = campaignSlugOrId
      ? await prisma.groupBuy.findFirst({
          where: {
            OR: [{ id: campaignSlugOrId }, { slug: campaignSlugOrId }],
          },
          include: { creator: true, product: true },
        })
      : null;

    if (gb) {
      campaignType = "group_buy";
      campaignId = gb.id;
      creatorId = gb.creatorId;
      creatorEmail = gb.creator.email;
      creatorName = gb.creator.name;
      productName = gb.product.name;
      campaignSlug = gb.slug;
    }
  }

  // Idempotency check
  const existing = await prisma.campaignMessage.findUnique({
    where: { resendEmailId: data.email_id },
  });
  if (existing) return;

  await prisma.campaignMessage.create({
    data: {
      campaignType,
      campaignId,
      fromEmail,
      fromName,
      body,
      resendEmailId: data.email_id,
    },
  });

  // Auto-reply to sender if we identified the campaign
  if (creatorName && campaignSlug) {
    sendEmail({
      to: fromEmail,
      subject: `Re: ${data.subject}`,
      react: React.createElement(CampaignMessageAutoEmail, {
        fromName,
        campaignCreatorName: creatorName,
        campaignSlug,
        productName,
      }),
      replyTo: "campaigns@kolekt.ng",
    }).catch(console.error);
  }

  // Forward to campaign creator
  if (creatorEmail && creatorName) {
    sendEmail({
      to: creatorEmail,
      subject: `Message about your campaign: ${productName}`,
      react: React.createElement("div", {}, [
        React.createElement("p", { key: "1" }, `From: ${fromName} <${fromEmail}>`),
        React.createElement("p", { key: "2" }, body),
      ]),
      replyTo: fromEmail,
    }).catch(console.error);
  }

  // Notify creator in-app
  if (creatorId) {
    notificationService
      .queue({
        userId: creatorId,
        channel: "EMAIL",
        type: "CAMPAIGN_MESSAGE_RECEIVED",
        message: `${fromName} sent a message about your campaign "${productName}".`,
      })
      .catch(console.error);
  }
}
