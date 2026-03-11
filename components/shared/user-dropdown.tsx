"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/auth-client";
import { LogOut, User, ShoppingBag } from "lucide-react";

interface UserDropdownProps {
  name: string;
  email: string;
}

export function UserDropdown({ name, email }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold ring-offset-background transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border/60 bg-popover shadow-lg shadow-black/10 ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150"
        >
          {/* User info */}
          <div className="border-b border-border/40 px-4 py-3">
            <p className="text-sm font-medium text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <a
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              My Profile
            </a>
            <a
              href="/orders"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              My Orders
            </a>
          </div>

          <div className="border-t border-border/40 py-1">
            <button
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
