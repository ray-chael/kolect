"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

/**
 * Fetch the current user's last 30 notifications, newest first.
 */
export async function getMyNotifications() {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized", data: [] };

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      type: true,
      message: true,
      orderId: true,
      readAt: true,
      createdAt: true,
    },
  });

  return { success: true, message: "OK", data: notifications };
}

/**
 * Get count of unread in-app notifications for the current user.
 */
export async function getUnreadCount(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;

  return prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { readAt: new Date() },
  });

  return { success: true, message: "Marked as read" };
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return { success: true, message: "All marked as read" };
}
