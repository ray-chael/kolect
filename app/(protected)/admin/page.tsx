import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeProducts, pendingOrders, readyToProcure, revenueResult] =
    await Promise.all([
      prisma.product.count({ where: { status: "AVAILABLE" } }),
      prisma.order.count({ where: { status: { in: ["PENDING", "PARTIAL"] } } }),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: "SUCCESS",
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

  const revenueKobo = revenueResult._sum.amount ?? 0;
  const revenueNaira = revenueKobo / 100;
  const revenueFormatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(revenueNaira);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
        Overview
      </p>
      <h1 className="font-display text-4xl tracking-tight">Admin Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Manage products, orders, and procurement.
      </p>

      <div className="mt-10 grid gap-5 grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
            Active Products
          </p>
          <p className="mt-2 font-display text-4xl text-foreground">
            {activeProducts}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
            Pending Orders
          </p>
          <p className="mt-2 font-display text-4xl text-foreground">
            {pendingOrders}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
            Ready to Procure
          </p>
          <p className="mt-2 font-display text-4xl text-foreground">
            {readyToProcure}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
            Revenue (This Month)
          </p>
          <p className="mt-2 font-display text-4xl text-foreground">
            {revenueFormatted}
          </p>
        </div>
      </div>
    </div>
  );
}
