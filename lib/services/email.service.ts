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

const SUBJECTS: Record<NotificationType, string> = {
  PAYMENT_RECEIVED: "Payment received on your order",
  DEPOSIT_CONFIRMED: "Deposit confirmed — price locked!",
  ORDER_FULLY_PAID: "Your order is fully paid",
  ITEM_PROCURED: "Your item has been procured",
  OUT_FOR_DELIVERY: "Your order is on its way",
  DELIVERED: "Your order has been delivered",
  PRICE_LOCK_WARNING: "Action required: price lock expiring soon",
  ORDER_EXPIRED: "Your order has expired",
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
    extras?: { amountKobo?: number }
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) return;

    const order = orderId
      ? await prisma.order.findUnique({
          where: { id: orderId },
          include: { product: true },
        })
      : null;

    if (!order) return;

    const customerName = user.name ?? user.email.split("@")[0];
    const productName = order.product.name;
    const amountKobo = extras?.amountKobo ?? 0;

    const formatDate = (d: Date) =>
      new Intl.DateTimeFormat("en-NG", { dateStyle: "long" }).format(d);

    let react: React.ReactElement;

    switch (type) {
      case "PAYMENT_RECEIVED":
        react = React.createElement(PaymentReceivedEmail, {
          customerName,
          amountPaid: formatNaira(amountKobo),
          balanceRemaining: formatNaira(order.totalAmount - order.amountPaid),
          productName,
          orderId: order.id,
        });
        break;

      case "DEPOSIT_CONFIRMED":
        react = React.createElement(DepositConfirmedEmail, {
          customerName,
          depositAmount: formatNaira(amountKobo),
          productName,
          priceLockExpiresAt: formatDate(order.priceLockExpiresAt),
          orderId: order.id,
        });
        break;

      case "ORDER_FULLY_PAID":
        react = React.createElement(OrderFullyPaidEmail, {
          customerName,
          productName,
          totalAmount: formatNaira(order.totalAmount),
          orderId: order.id,
        });
        break;

      case "ITEM_PROCURED":
        react = React.createElement(ItemProcuredEmail, {
          customerName,
          productName,
          orderId: order.id,
        });
        break;

      case "OUT_FOR_DELIVERY":
        react = React.createElement(OutForDeliveryEmail, {
          customerName,
          productName,
          riderName: order.riderName ?? undefined,
          riderPhone: order.riderPhone ?? undefined,
          trackingNote: order.trackingNote ?? undefined,
          orderId: order.id,
        });
        break;

      case "DELIVERED":
        react = React.createElement(DeliveredEmail, {
          customerName,
          productName,
          orderId: order.id,
        });
        break;

      case "PRICE_LOCK_WARNING": {
        const daysLeft = Math.max(
          0,
          Math.ceil(
            (order.priceLockExpiresAt.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        );
        react = React.createElement(PriceLockWarningEmail, {
          customerName,
          productName,
          daysLeft,
          balanceRemaining: formatNaira(order.totalAmount - order.amountPaid),
          priceLockExpiresAt: formatDate(order.priceLockExpiresAt),
          orderId: order.id,
        });
        break;
      }

      case "ORDER_EXPIRED":
        react = React.createElement(OrderExpiredEmail, {
          customerName,
          productName,
          orderId: order.id,
        });
        break;

      default:
        return;
    }

    await sendEmail({ to: user.email, subject: SUBJECTS[type], react });
  },
};
