"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function ProtectedHeader() {
  const pathname = usePathname();

  // Admin routes have their own header/layout
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="/dashboard" className="font-display text-xl tracking-tight text-foreground">
          Ade&apos;s Kolekt
        </a>
        <nav className="flex items-center gap-6">
          <a
            href="/products"
            className="text-sm tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            Shop
          </a>
          <a
            href="/orders"
            className="text-sm tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            My Orders
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
