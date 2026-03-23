"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserDropdown } from "@/components/shared/user-dropdown";
import { NotificationBell } from "@/components/shared/notification-bell";
import { CartIcon } from "@/components/shared/cart-icon";
import { WishlistIcon } from "@/components/shared/wishlist-icon";

interface ProtectedHeaderClientProps {
  userName: string;
  userEmail: string;
  initialUnreadCount: number;
}

export function ProtectedHeaderClient({
  userName,
  userEmail,
  initialUnreadCount,
}: ProtectedHeaderClientProps) {
  const pathname = usePathname();

  // Admin routes have their own header/layout
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        <a
          href="/dashboard"
          className="font-display text-lg sm:text-xl tracking-tight text-foreground"
        >
          Ade&apos;s Kolekt
        </a>
        <nav className="flex items-center gap-1.5 sm:gap-5">
          <a
            href="/collection"
            className="hidden sm:inline text-sm tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            Shop
          </a>
          <a
            href="/campaigns"
            className="hidden sm:inline text-sm tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            My Campaigns
          </a>
          <a
            href="/support"
            className="hidden sm:inline text-sm tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            Support
          </a>
          <ThemeToggle />
          <WishlistIcon />
          <CartIcon />
          <NotificationBell initialUnreadCount={initialUnreadCount} />
          <UserDropdown name={userName} email={userEmail} />
        </nav>
      </div>
    </header>
  );
}
