import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Get the current session on the server side.
 * Use in Server Components and Server Actions.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Require an authenticated session. Throws if not authenticated.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Require a specific role. Throws if not authorized.
 */
export async function requireRole(role: string) {
  const session = await requireSession();
  if (session.user.role !== role) {
    throw new Error("Forbidden");
  }
  return session;
}
