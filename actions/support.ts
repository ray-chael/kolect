"use server";

import { requireRole, requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import type { ActionResult } from "@/lib/types";
import React from "react";
import {
  PaymentProofStatus,
  SupportTicketStatus,
} from "@/app/generated/prisma/enums";

// ─── Shopper-Facing Ticket Actions ───────────────────────────────

/**
 * Create a new support ticket from the logged-in shopper.
 */
export async function createTicket(
  subject: string,
  body: string,
  orderId?: string,
): Promise<ActionResult<{ ticketId: string }>> {
  try {
    const session = await requireSession();
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    if (!trimmedSubject || trimmedSubject.length < 3) {
      return {
        success: false,
        message: "Subject must be at least 3 characters.",
      };
    }
    if (!trimmedBody || trimmedBody.length < 10) {
      return {
        success: false,
        message: "Message must be at least 10 characters.",
      };
    }

    // If orderId provided, verify it belongs to this user
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId: session.user.id },
      });
      if (!order) {
        return { success: false, message: "Order not found." };
      }
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        fromEmail: session.user.email,
        fromName: session.user.name,
        subject: trimmedSubject,
        body: trimmedBody,
        userId: session.user.id,
        orderId: orderId ?? null,
      },
    });

    // Send confirmation email to shopper
    const { SupportTicketReceivedEmail } =
      await import("@/emails/support-ticket-received");
    await sendEmail({
      to: session.user.email,
      subject: `We've received your support request — #${ticket.id.slice(-8).toUpperCase()}`,
      react: React.createElement(SupportTicketReceivedEmail, {
        fromName: session.user.name,
        subject: trimmedSubject,
        ticketId: ticket.id,
      }),
      replyTo: "support@kolekt.ng",
    });

    // Notify admin
    const { SupportTicketNotificationEmail } =
      await import("@/emails/support-ticket-notification");
    await sendEmail({
      to: process.env.ADMIN_EMAIL ?? "support@kolekt.ng",
      subject: `New support ticket from ${session.user.name}: ${trimmedSubject}`,
      react: React.createElement(SupportTicketNotificationEmail, {
        fromEmail: session.user.email,
        fromName: session.user.name,
        subject: trimmedSubject,
        body: trimmedBody,
        ticketId: ticket.id,
        orderId: orderId ?? null,
      }),
    });

    // In-app notification for admin
    const admins = await prisma.user.findMany({
      where: { role: "CRIMSON" },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: "SUPPORT_TICKET_OPENED",
          channel: "EMAIL",
          message: `New support ticket from ${session.user.name}: ${trimmedSubject}`,
        })),
      });
    }

    return {
      success: true,
      message: "Ticket created.",
      data: { ticketId: ticket.id },
    };
  } catch {
    return { success: false, message: "Failed to create ticket." };
  }
}

/**
 * List the current shopper's support tickets.
 */
export async function getMyTickets() {
  const session = await requireSession();
  return prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { messages: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single ticket owned by the current shopper, with all messages.
 */
export async function getMyTicket(ticketId: string) {
  const session = await requireSession();
  return prisma.supportTicket.findFirst({
    where: { id: ticketId, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

/**
 * Shopper replies to their own ticket.
 */
export async function replyToMyTicket(
  ticketId: string,
  body: string,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const trimmedBody = body.trim();
    if (!trimmedBody || trimmedBody.length < 2) {
      return { success: false, message: "Reply cannot be empty." };
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, userId: session.user.id },
    });
    if (!ticket) return { success: false, message: "Ticket not found." };
    if (ticket.status === "CLOSED") {
      return {
        success: false,
        message: "This ticket is closed. Please open a new one.",
      };
    }

    await prisma.supportMessage.create({
      data: {
        ticketId,
        fromEmail: session.user.email,
        body: trimmedBody,
        isFromAdmin: false,
      },
    });

    // Re-open ticket if it was in-progress (shopper responded)
    if (ticket.status === "IN_PROGRESS") {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "OPEN" },
      });
    }

    // Notify admin about new shopper reply
    const { SupportReplyNotificationEmail } =
      await import("@/emails/support-reply-notification");
    const admins = await prisma.user.findMany({
      where: { role: "CRIMSON" },
      select: { id: true, email: true },
    });
    if (admins.length > 0) {
      // Email first admin
      await sendEmail({
        to: admins[0].email,
        subject: `Re: ${ticket.subject} — New reply from ${session.user.name}`,
        react: React.createElement(SupportReplyNotificationEmail, {
          fromName: session.user.name,
          subject: ticket.subject,
          body: trimmedBody,
          ticketId: ticket.id,
          isFromAdmin: false,
        }),
      });

      // In-app notification for all admins
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: "SUPPORT_TICKET_REPLY",
          channel: "EMAIL",
          message: `${session.user.name} replied to ticket: ${ticket.subject}`,
        })),
      });
    }

    return { success: true, message: "Reply sent." };
  } catch {
    return { success: false, message: "Failed to send reply." };
  }
}

// ─── Admin Ticket Actions ────────────────────────────────────────

/**
 * List support tickets, optionally filtered by status.
 */
export async function getTickets(status?: SupportTicketStatus) {
  await requireRole("CRIMSON");
  return prisma.supportTicket.findMany({
    where: status ? { status } : undefined,
    include: {
      messages: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single ticket with all its messages.
 */
export async function getTicket(ticketId: string) {
  await requireRole("CRIMSON");
  return prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Update a ticket's status. Sends email to the shopper on status change.
 */
export async function updateTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(status === "CLOSED" ? { closedAt: new Date() } : {}),
      },
    });

    // Email the shopper about the status change
    const { SupportStatusChangeEmail } =
      await import("@/emails/support-status-change");
    await sendEmail({
      to: ticket.fromEmail,
      subject: `Your support ticket has been updated — #${ticketId.slice(-8).toUpperCase()}`,
      react: React.createElement(SupportStatusChangeEmail, {
        fromName: ticket.fromName ?? "there",
        subject: ticket.subject,
        ticketId,
        newStatus: status,
      }),
      replyTo: "support@kolekt.ng",
    });

    // In-app notification for shopper
    if (ticket.userId) {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: "SUPPORT_TICKET_STATUS",
          channel: "EMAIL",
          message: `Your support ticket "${ticket.subject}" is now ${status.replace("_", " ").toLowerCase()}.`,
        },
      });
    }

    return { success: true, message: "Ticket status updated." };
  } catch {
    return { success: false, message: "Failed to update status." };
  }
}

/**
 * Reply to a support ticket. Creates a SupportMessage and sends an email to the shopper.
 */
export async function replyToTicket(
  ticketId: string,
  body: string,
): Promise<ActionResult> {
  try {
    const session = await requireRole("CRIMSON");

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) return { success: false, message: "Ticket not found." };

    await prisma.supportMessage.create({
      data: {
        ticketId,
        fromEmail: session.user.email,
        body,
        isFromAdmin: true,
      },
    });

    // Mark as in-progress if it was still open
    if (ticket.status === "OPEN") {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Email the shopper with proper template
    const { SupportReplyNotificationEmail } =
      await import("@/emails/support-reply-notification");
    await sendEmail({
      to: ticket.fromEmail,
      subject: `Re: ${ticket.subject}`,
      react: React.createElement(SupportReplyNotificationEmail, {
        fromName: ticket.fromName ?? "there",
        subject: ticket.subject,
        body,
        ticketId,
        isFromAdmin: true,
      }),
      replyTo: "support@kolekt.ng",
    });

    // In-app notification for shopper
    if (ticket.userId) {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: "SUPPORT_TICKET_REPLY",
          channel: "EMAIL",
          message: `Support team replied to your ticket: ${ticket.subject}`,
        },
      });
    }

    return { success: true, message: "Reply sent." };
  } catch {
    return { success: false, message: "Failed to send reply." };
  }
}

/**
 * Add internal admin notes to a ticket (not sent to customer).
 */
export async function updateTicketNotes(
  ticketId: string,
  notes: string,
): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { adminNotes: notes },
    });
    return { success: true, message: "Notes saved." };
  } catch {
    return { success: false, message: "Failed to save notes." };
  }
}

// ─── Payment Proofs ──────────────────────────────────────────────

/**
 * List payment proofs, optionally filtered by status.
 */
export async function getPaymentProofs(status?: PaymentProofStatus) {
  await requireRole("CRIMSON");
  return prisma.paymentProof.findMany({
    where: status ? { status } : undefined,
    include: { order: { include: { user: true, product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single payment proof.
 */
export async function getPaymentProof(proofId: string) {
  await requireRole("CRIMSON");
  return prisma.paymentProof.findUnique({
    where: { id: proofId },
    include: { order: { include: { user: true, product: true } } },
  });
}

/**
 * Approve or reject a payment proof.
 * On APPROVED: credits the full order's amountPaid with the proof amount
 * (represented as totalAmount − amountPaid, or treated as a manual credit flag).
 * Sends notification email to the submitter.
 */
export async function reviewPaymentProof(
  proofId: string,
  status: "APPROVED" | "REJECTED",
  notes?: string,
): Promise<ActionResult> {
  try {
    const session = await requireRole("CRIMSON");

    const proof = await prisma.paymentProof.findUnique({
      where: { id: proofId },
      include: { order: { include: { user: true, product: true } } },
    });
    if (!proof) return { success: false, message: "Proof not found." };

    await prisma.paymentProof.update({
      where: { id: proofId },
      data: {
        status,
        adminNotes: notes ?? null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    if (status === "APPROVED") {
      // Mark order as fully paid and update amountPaid
      const order = proof.order;
      await prisma.order.update({
        where: { id: order.id },
        data: {
          amountPaid: order.totalAmount,
          status: "PAID",
          isDepositPaid: true,
        },
      });
    }

    // Notify submitter
    const subject =
      status === "APPROVED"
        ? "Your payment proof has been approved — Ade's Kolekt"
        : "Your payment proof could not be verified — Ade's Kolekt";

    const bodyText =
      status === "APPROVED"
        ? `Your payment proof for order #${proof.orderId.slice(-8).toUpperCase()} has been reviewed and approved. Your order is now fully paid.`
        : `Unfortunately we could not verify your payment proof for order #${proof.orderId.slice(-8).toUpperCase()}. Please contact support or submit a clearer proof.${notes ? `\n\nAdmin note: ${notes}` : ""}`;

    await sendEmail({
      to: proof.fromEmail,
      subject,
      react: React.createElement("div", {}, [
        React.createElement("p", { key: "b" }, bodyText),
        React.createElement(
          "p",
          { key: "s" },
          "— Ade's Kolekt",
        ),
      ]),
      replyTo: "support@kolekt.ng",
    });

    return { success: true, message: `Proof ${status.toLowerCase()}.` };
  } catch {
    return { success: false, message: "Failed to review proof." };
  }
}
