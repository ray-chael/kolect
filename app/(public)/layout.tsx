import { AuthNav } from "@/components/shared/auth-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CartIcon } from "@/components/shared/cart-icon";
import { WishlistIcon } from "@/components/shared/wishlist-icon";
import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
          <Link
            href="/"
            className="font-display text-lg sm:text-xl tracking-tight text-foreground"
          >
            Ade&apos;s Kolekt
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-5">
            <Link
              href="/collection"
              className="hidden sm:inline text-sm tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Collection
            </Link>
            <AuthNav />
            <WishlistIcon />
            <CartIcon />
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="font-display text-lg">Ade&apos;s Kolekt</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Curated goods, flexible payments. Pay at your pace, we deliver
              with care.
            </p>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <Link
                href="/collection"
                className="hover:text-foreground transition-colors"
              >
                Collection
              </Link>
              <Link
                href="/register"
                className="hover:text-foreground transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
