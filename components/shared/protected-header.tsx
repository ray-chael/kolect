import { getSession } from "@/lib/session";
import { getUnreadCount } from "@/actions/notifications";
import { ProtectedHeaderClient } from "./protected-header-client";

export async function ProtectedHeader() {
  const session = await getSession();
  if (!session) return null;

  const unreadCount = await getUnreadCount();

  return (
    <ProtectedHeaderClient
      userName={session.user.name}
      userEmail={session.user.email}
      initialUnreadCount={unreadCount}
    />
  );
}
