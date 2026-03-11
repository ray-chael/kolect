import { getSession } from "@/lib/session";
import { ProtectedHeaderClient } from "./protected-header-client";

export async function ProtectedHeader() {
  const session = await getSession();
  if (!session) return null;

  return (
    <ProtectedHeaderClient
      userName={session.user.name}
      userEmail={session.user.email}
    />
  );
}
