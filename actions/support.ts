"use server";

import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import type { ActionResult } from "@/lib/types";
import React from "react";
import { PaymentProofStatus, SupportTicketStatus } from "@/app/generated/prisma/enums";

// ─── Support Tickets ─────────────────────────────────────────────

/**
 * List support tickets, optionally filtered by status.
 */
export async function getTickets(status?: SupportTicketStatus) {
  await requireRole("CRIMSON");
  return prisma.supportTicket.findMany({
    where: status ? { status } : undefined,
    include: { messages: true, user: { select: { id: true, name: true, email: true } } },
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
 * Update a ticket's status.
 */
export async function updateTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(status === "CLOSED" ? { closedAt: new Date() } : {}),
      },
    });
    return { success: true, message: "Ticket status updated." };
  } catch {
    return { success: false, message: "Failed to update status." };
  }
}

/**
 * Reply to a support ticket. Creates a SupportMessage and sends an email.
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

    await sendEmail({
      to: ticket.fromEmail,
      subject: `Re: ${ticket.subject}`,
      react: React.createElement("div", {}, [
        React.createElement("p", { key: "greeting" }, `Hi ${ticket.fromName ?? "there"},`),
        React.createElement("p", { key: "body" }, body),
        React.createElement(
          "p",
          { key: "sig" },
          "— Ade's Kolekt Support",
        ),
      ]),
      replyTo: "support@kolekt.ng",
    });

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
