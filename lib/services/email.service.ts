import React from "react";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { formatNaira } from "@/lib/types";
import type { NotificationType } from "@/app/generated/prisma/client";
import { PaymentReceivedEmail } from "@/emails/payment-received";
import { DepositConfirmedEmail } from "@/emails/deposit-confirmed";
import { OrderFullyPaidEmail } from "@/emails/order-fully-paid";
import { ItemProcuredEmail } from "@/emails/item-procured";
import { OutForDeliveryEmail } from "@/emails/out-for-delivery";
import { DeliveredEmail } from "@/emails/delivered";
import { PriceLockWarningEmail } from "@/emails/price-lock-warning";
import { OrderExpiredEmail } from "@/emails/order-expired";
import { GenericNotificationEmail } from "@/emails/generic-notification";

const SUBJECTS: Record<NotificationType, string> = {
  PAYMENT_RECEIVED: "Payment received on your order",
  DEPOSIT_CONFIRMED: "Deposit confirmed — price locked!",
  ORDER_FULLY_PAID: "Your order is fully paid",
  ITEM_PROCURED: "Your item has been procured",
  OUT_FOR_DELIVERY: "Your order is on its way",
  DELIVERED: "Your order has been delivered",
  PRICE_LOCK_WARNING: "Action required: price lock expiring soon",
  ORDER_EXPIRED: "Your order has expired",
  CAMPAIGN_CONTRIBUTION: "Someone contributed to your campaign",
  CAMPAIGN_FUNDED: "Your Help Me Pay campaign is fully funded!",
  SUPPORT_TICKET_OPENED: "New support ticket",
  ORDER_MESSAGE_RECEIVED: "New message about an order",
  CAMPAIGN_MESSAGE_RECEIVED: "New message about a campaign",
  PAYMENT_PROOF_SUBMITTED: "Payment proof submitted",
};

export const emailService = {
  /**
   * Send a transactional email for a notification type.
   * Looks up user email and order details automatically.
   * amountKobo is required for PAYMENT_RECEIVED and DEPOSIT_CONFIRMED.
   */
  async send(
    type: NotificationType,
    userId: string,
    orderId?: string,
    extras?: { amountKobo?: number },
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) return;

    const order = orderId
      ? await prisma.order.findUnique({
          where: { id: orderId },
          include: { product: true },
        })
      : null;

    const customerName = user.name ?? user.email.split("@")[0];
    const amountKobo = extras?.amountKobo ?? 0;

    const formatDate = (d: Date) =>
      new Intl.DateTimeFormat("en-NG", { dateStyle: "long" }).format(d);

    let react: React.ReactElement;

    switch (type) {
      case "PAYMENT_RECEIVED": {
        if (!order) return;
        react = React.createElement(PaymentReceivedEmail, {
          customerName,
          amountPaid: formatNaira(amountKobo),
          balanceRemaining: formatNaira(order.totalAmount - order.amountPaid),
          productName: order.product.name,
          orderId: order.id,
        });
        break;
      }

      case "DEPOSIT_CONFIRMED": {
        if (!order) return;
        react = React.createElement(DepositConfirmedEmail, {
          customerName,
          depositAmount: formatNaira(amountKobo),
          productName: order.product.name,
          priceLockExpiresAt: formatDate(order.priceLockExpiresAt),
          orderId: order.id,
        });
        break;
      }

      case "ORDER_FULLY_PAID": {
        if (!order) return;
        react = React.createElement(OrderFullyPaidEmail, {
          customerName,
          productName: order.product.name,
          totalAmount: formatNaira(order.totalAmount),
          orderId: order.id,
        });
        break;
      }

      case "ITEM_PROCURED": {
        if (!order) return;
        react = React.createElement(ItemProcuredEmail, {
          customerName,
          productName: order.product.name,
          orderId: order.id,
        });
        break;
      }

      case "OUT_FOR_DELIVERY": {
        if (!order) return;
        react = React.createElement(OutForDeliveryEmail, {
          customerName,
          productName: order.product.name,
          riderName: order.riderName ?? undefined,
          riderPhone: order.riderPhone ?? undefined,
          trackingNote: order.trackingNote ?? undefined,
          orderId: order.id,
        });
        break;
      }

      case "DELIVERED": {
        if (!order) return;
        react = React.createElement(DeliveredEmail, {
          customerName,
          productName: order.product.name,
          orderId: order.id,
        });
        break;
      }

      case "PRICE_LOCK_WARNING": {
        if (!order) return;
        const daysLeft = Math.max(
          0,
          Math.ceil(
            (order.priceLockExpiresAt.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        );
        react = React.createElement(PriceLockWarningEmail, {
          customerName,
          productName: order.product.name,
          daysLeft,
          balanceRemaining: formatNaira(order.totalAmount - order.amountPaid),
          priceLockExpiresAt: formatDate(order.priceLockExpiresAt),
          orderId: order.id,
        });
        break;
      }

      case "ORDER_EXPIRED": {
        if (!order) return;
        react = React.createElement(OrderExpiredEmail, {
          customerName,
          productName: order.product.name,
          orderId: order.id,
        });
        break;
      }

      case "CAMPAIGN_CONTRIBUTION":
      case "CAMPAIGN_FUNDED":
      case "SUPPORT_TICKET_OPENED":
      case "ORDER_MESSAGE_RECEIVED":
      case "CAMPAIGN_MESSAGE_RECEIVED":
      case "PAYMENT_PROOF_SUBMITTED": {
        // Look up the most recent notification of this type to get the message text
        const notification = await prisma.notification.findFirst({
          where: { userId, type },
          orderBy: { createdAt: "desc" },
          select: { message: true },
        });
        const message = notification?.message ?? SUBJECTS[type];
        react = React.createElement(GenericNotificationEmail, {
          customerName,
          message,
          subject: SUBJECTS[type],
        });
        break;
      }

      default:
        return;
    }

    await sendEmail({ to: user.email, subject: SUBJECTS[type], react });
  },
};
