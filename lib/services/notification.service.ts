import { prisma } from "@/lib/db";

export const notificationService = {
  /**
   * Queue a notification for sending
   */
  async queue(data: {
    userId: string;
    orderId?: string;
    channel: "WHATSAPP" | "SMS" | "EMAIL";
    type:
      | "PAYMENT_RECEIVED"
      | "DEPOSIT_CONFIRMED"
      | "ORDER_FULLY_PAID"
      | "ITEM_PROCURED"
      | "OUT_FOR_DELIVERY"
      | "DELIVERED"
      | "PRICE_LOCK_WARNING"
      | "ORDER_EXPIRED"
      | "CAMPAIGN_CONTRIBUTION"
      | "CAMPAIGN_FUNDED";
    message: string;
  }) {
    return prisma.notification.create({ data });
  },

  /**
   * Mark notification as sent
   */
  async markSent(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });
  },

  /**
   * Mark notification as failed
   */
  async markFailed(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: "FAILED" },
    });
  },

  /**
   * Get queued notifications for processing
   */
  async getQueued(limit: number = 50) {
    return prisma.notification.findMany({
      where: { status: "QUEUED" },
      include: { user: true, order: true },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  },
};
