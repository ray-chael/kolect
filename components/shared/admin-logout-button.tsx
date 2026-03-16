"use client";

import { signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-destructive transition-colors"
    >
      <LogOut className="h-3.5 w-3.5" />
      Logout
    </button>
  );
}
