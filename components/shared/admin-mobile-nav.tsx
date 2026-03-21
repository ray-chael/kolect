"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/pickup-locations", label: "Pickup" },
  { href: "/admin/webhooks", label: "Webhooks" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/payment-proofs", label: "Proofs" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }
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

  return (
    <div
      ref={ref}
      className="relative lg:hidden"
      aria-label="Admin navigation menu"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border/60 bg-popover shadow-lg shadow-black/10 z-50 overflow-hidden"
          role="menu"
        >
          {adminLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              role="menuitem"
              className="flex items-center px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-border/40">
            <button
              onClick={handleSignOut}
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
