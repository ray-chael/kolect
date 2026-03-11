import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/services/order.service";
import { notificationService } from "@/lib/services/notification.service";
import { emailService } from "@/lib/services/email.service";
import { formatNaira } from "@/lib/types";
import { PRICE_LOCK_WARNING_DAYS } from "@/lib/consts";
import { prisma } from "@/lib/db";

/**
 * Cron job to handle scheduled tasks:
 * 1. Flag expired price locks
 * 2. Send price lock warning notifications
 * 3. Process queued notifications
 *
 * Secured by CRON_SECRET header check.
 * Schedule via Vercel Cron or external scheduler.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    expiredOrders: 0,
    warningsSent: 0,
    notificationsProcessed: 0,
  };

  // 1. Mark expired price locks
  const expiredOrders = await orderService.getExpiredPriceLocks();
  if (expiredOrders.length > 0) {
    await orderService.markExpired(expiredOrders.map((o) => o.id));
    results.expiredOrders = expiredOrders.length;

    // Notify users about expired orders
    for (const order of expiredOrders) {
      await notificationService.queue({
        userId: order.userId,
        orderId: order.id,
        channel: "WHATSAPP",
        type: "ORDER_EXPIRED",
        message: `Your order for ${order.product.name} has expired. Price lock period ended. Please contact us to discuss options.`,
      });
      emailService
        .send("ORDER_EXPIRED", order.userId, order.id)
        .catch(console.error);
    }
  }

  // 2. Send price lock warnings (7 days before expiry)
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + PRICE_LOCK_WARNING_DAYS);

  const ordersNearExpiry = await prisma.order.findMany({
    where: {
      priceLockExpiresAt: { lte: warningDate, gt: new Date() },
      status: { in: ["PENDING", "PARTIAL"] },
      priceLocked: true,
    },
    include: { product: true, user: true },
  });

  for (const order of ordersNearExpiry) {
    const daysLeft = Math.ceil(
      (order.priceLockExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    // Check if we already sent a warning for this order recently
    const existingWarning = await prisma.notification.findFirst({
      where: {
        orderId: order.id,
        type: "PRICE_LOCK_WARNING",
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existingWarning) {
      await notificationService.queue({
        userId: order.userId,
        orderId: order.id,
        channel: "WHATSAPP",
        type: "PRICE_LOCK_WARNING",
        message: `Your price lock for ${order.product.name} expires in ${daysLeft} days. Balance remaining: ${formatNaira(order.totalAmount - order.amountPaid)}. Pay now to keep your locked price!`,
      });
      emailService
        .send("PRICE_LOCK_WARNING", order.userId, order.id)
        .catch(console.error);
      results.warningsSent++;
    }
  }

  // 3. Process queued notifications (TODO: Integrate with Termii/WhatsApp Business API)
  const queuedNotifications = await notificationService.getQueued(50);
  results.notificationsProcessed = queuedNotifications.length;

  return NextResponse.json({
    success: true,
    ...results,
    timestamp: new Date().toISOString(),
  });
}
