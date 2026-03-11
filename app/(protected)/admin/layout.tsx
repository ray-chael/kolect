import { requireRole } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("CRIMSON").catch(() => null);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="/admin" className="font-display text-lg tracking-tight">
            Ade&apos;s Kolekt <span className="text-primary">Admin</span>
          </a>
          <nav className="flex items-center gap-6">
            <a
              href="/admin"
              className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/admin/products"
              className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              Products
            </a>
            <a
              href="/admin/categories"
              className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              Categories
            </a>
            <a
              href="/admin/orders"
              className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              Orders
            </a>
            <a
              href="/admin/pickup-locations"
              className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              Pickup
            </a>
            <a
              href="/admin/settings"
              className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              Settings
            </a>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
