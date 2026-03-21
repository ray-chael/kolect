"use server";

import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

export interface SessionInfo {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

/** Return all active (non-expired) sessions for the signed-in user. */
export async function getActiveSessions(): Promise<SessionInfo[]> {
  const session = await requireSession();

  const sessions = await prisma.session.findMany({
    where: {
      userId: session.user.id,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    isCurrent: s.token === session.session.token,
  }));
}

/** Revoke a specific session by id (must belong to the current user). */
export async function revokeSession(sessionId: string): Promise<ActionResult> {
  const session = await requireSession();

  // Guard: cannot delete a session you don't own
  const target = await prisma.session.findFirst({
    where: { id: sessionId, userId: session.user.id },
  });
  if (!target) return { success: false, message: "Session not found" };

  // Prevent revoking current session via this action (use sign-out instead)
  if (target.token === session.session.token) {
    return { success: false, message: "Use sign out to end your current session" };
  }

  await prisma.session.delete({ where: { id: sessionId } });
  revalidatePath("/profile");
  return { success: true, message: "Session revoked" };
}

/** Revoke every session except the current one. */
export async function revokeAllOtherSessions(): Promise<ActionResult> {
  const session = await requireSession();

  await prisma.session.deleteMany({
    where: {
      userId: session.user.id,
      token: { not: session.session.token },
    },
  });

  revalidatePath("/profile");
  return { success: true, message: "All other sessions revoked" };
}
