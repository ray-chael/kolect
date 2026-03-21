import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600",
  PARTIAL: "bg-blue-500/10 text-blue-600",
  PAID: "bg-emerald-500/10 text-emerald-600",
  PROCURED: "bg-violet-500/10 text-violet-600",
  DISPATCHED: "bg-sky-500/10 text-sky-600",
  DELIVERED: "bg-green-500/10 text-green-700",
  CANCELLED: "bg-red-500/10 text-red-600",
  EXPIRED: "bg-muted text-muted-foreground",
};

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeProducts,
    pendingOrders,
    readyToProcure,
    revenueResult,
    pendingProofsCount,
    openTicketsCount,
    activeFlashSalesCount,
    openGroupBuysCount,
    newCustomersCount,
    totalCustomersCount,
    recentOrders,
    recentPendingProofs,
    recentOpenTickets,
  ] = await Promise.all([
    prisma.product.count({ where: { status: "AVAILABLE" } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "PARTIAL"] } } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCESS", createdAt: { gte: startOfMonth } },
    }),
    prisma.paymentProof.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.flashSale.count({ where: { isActive: true, endsAt: { gt: now } } }),
    prisma.groupBuy.count({ where: { status: "OPEN" } }),
    prisma.user.count({
      where: { role: "EMERALD", createdAt: { gte: startOfMonth } },
    }),
    prisma.user.count({ where: { role: "EMERALD" } }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true } },
      },
    }),
    prisma.paymentProof.findMany({
      where: { status: "PENDING" },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: {
            user: { select: { name: true } },
            product: { select: { name: true } },
          },
        },
      },
    }),
    prisma.supportTicket.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const revenueKobo = revenueResult._sum.amount ?? 0;

  const dateLabel = now.toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div>
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
          Overview
        </p>
        <h1 className="font-display text-4xl tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Active Products */}
        <Link
          href="/admin/products"
          className="group rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
            Active Products
          </p>
          <p className="mt-2 font-display text-4xl text-foreground">
            {activeProducts}
          </p>
          <p className="mt-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            View all →
          </p>
        </Link>

        {/* Pending Orders */}
        <Link
          href="/admin/orders?status=PENDING"
          className="group rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 hover:border-amber-500/60 transition-colors"
        >
          <p className="text-[10px] tracking-[0.18em] uppercase text-amber-600">
            Pending Orders
          </p>
          <p className="mt-2 font-display text-4xl text-foreground">
            {pendingOrders}
          </p>
          <p className="mt-1 text-xs text-amber-600/70 group-hover:text-amber-600 transition-colors">
            Awaiting payment →
          </p>
        </Link>

        {/* Ready to Procure */}
        <Link
          href="/admin/orders?status=PAID"
          className="group rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 hover:border-emerald-500/60 transition-colors"
        >
          <p className="text-[10px] tracking-[0.18em] uppercase text-emerald-600">
            Ready to Procure
          </p>
          <p className="mt-2 font-display text-4xl text-foreground">
            {readyToProcure}
          </p>
          <p className="mt-1 text-xs text-emerald-600/70 group-hover:text-emerald-600 transition-colors">
            Fully paid →
          </p>
        </Link>

        {/* Revenue */}
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
            Revenue (This Month)
          </p>
          <p className="mt-2 font-display text-3xl text-foreground">
            {formatNaira(revenueKobo)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Successful payments
          </p>
        </div>
      </div>

      {/* ── Secondary Stats ── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {/* Pending Payment Proofs */}
        <Link
          href="/admin/payment-proofs?status=PENDING"
          className={`group rounded-2xl border p-5 transition-colors ${
            pendingProofsCount > 0
              ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70"
              : "border-border/60 bg-card hover:border-primary/40"
          }`}
        >
          <p
            className={`text-[10px] tracking-[0.18em] uppercase ${pendingProofsCount > 0 ? "text-amber-600" : "text-muted-foreground"}`}
          >
            Pending Proofs
          </p>
          <p className="mt-2 font-display text-3xl text-foreground">
            {pendingProofsCount}
          </p>
          <p
            className={`mt-1 text-xs ${pendingProofsCount > 0 ? "text-amber-600/70 group-hover:text-amber-600" : "text-muted-foreground"} transition-colors`}
          >
            Review →
          </p>
        </Link>

        {/* Open Support Tickets */}
        <Link
          href="/admin/support"
          className={`group rounded-2xl border p-5 transition-colors ${
            openTicketsCount > 0
              ? "border-blue-500/40 bg-blue-500/5 hover:border-blue-500/70"
              : "border-border/60 bg-card hover:border-primary/40"
          }`}
        >
          <p
            className={`text-[10px] tracking-[0.18em] uppercase ${openTicketsCount > 0 ? "text-blue-600" : "text-muted-foreground"}`}
          >
            Open Tickets
          </p>
          <p className="mt-2 font-display text-3xl text-foreground">
            {openTicketsCount}
          </p>
          <p
            className={`mt-1 text-xs ${openTicketsCount > 0 ? "text-blue-600/70 group-hover:text-blue-600" : "text-muted-foreground"} transition-colors`}
          >
            View →
          </p>
        </Link>

        {/* Active Flash Sales */}
        <Link
          href="/admin/flash-sales"
          className="group rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
            Active Sales
          </p>
          <p className="mt-2 font-display text-3xl text-foreground">
            {activeFlashSalesCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            Flash sales →
          </p>
        </Link>

        {/* Open Group Buys */}
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
            Open Group Buys
          </p>
          <p className="mt-2 font-display text-3xl text-foreground">
            {openGroupBuysCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Campaigns live</p>
        </div>

        {/* Customers */}
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
            Customers
          </p>
          <p className="mt-2 font-display text-3xl text-foreground">
            {totalCustomersCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            +{newCustomersCount} this month
          </p>
        </div>
      </div>

      {/* ── Recent Orders + Quick Actions ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <h2 className="text-sm font-medium tracking-wide">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {recentOrders.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No orders yet.
              </p>
            )}
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {order.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.user.name} · {order.user.email}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">
                    {formatNaira(order.totalAmount)}
                  </p>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${ORDER_STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <h2 className="text-sm font-medium tracking-wide">Quick Actions</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <Link
              href="/admin/products/new"
              className="flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-background p-3.5 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <span className="text-lg">＋</span>
              <span className="text-xs font-medium leading-tight">
                New Product
              </span>
            </Link>
            <Link
              href="/admin/orders"
              className="flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-background p-3.5 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <span className="text-lg">📦</span>
              <span className="text-xs font-medium leading-tight">
                All Orders
              </span>
            </Link>
            <Link
              href="/admin/payment-proofs"
              className="flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-background p-3.5 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <span className="text-lg">🧾</span>
              <span className="text-xs font-medium leading-tight">
                Payment Proofs
              </span>
            </Link>
            <Link
              href="/admin/support"
              className="flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-background p-3.5 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <span className="text-lg">💬</span>
              <span className="text-xs font-medium leading-tight">Support</span>
            </Link>
            <Link
              href="/admin/flash-sales/new"
              className="flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-background p-3.5 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <span className="text-lg">⚡</span>
              <span className="text-xs font-medium leading-tight">
                New Flash Sale
              </span>
            </Link>
            <Link
              href="/admin/categories"
              className="flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-background p-3.5 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <span className="text-lg">🏷️</span>
              <span className="text-xs font-medium leading-tight">
                Categories
              </span>
            </Link>
            <Link
              href="/admin/pickup-locations"
              className="flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-background p-3.5 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <span className="text-lg">📍</span>
              <span className="text-xs font-medium leading-tight">Pickup</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-background p-3.5 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <span className="text-lg">⚙️</span>
              <span className="text-xs font-medium leading-tight">
                Settings
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Pending Proofs + Open Tickets ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Payment Proofs */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium tracking-wide">
                Pending Payment Proofs
              </h2>
              {pendingProofsCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {pendingProofsCount}
                </span>
              )}
            </div>
            <Link
              href="/admin/payment-proofs"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {recentPendingProofs.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No pending proofs. All clear ✓
              </p>
            )}
            {recentPendingProofs.map((proof) => (
              <Link
                key={proof.id}
                href="/admin/payment-proofs"
                className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {proof.order.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {proof.order.user.name} · {proof.fromEmail}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600">
                    PENDING
                  </span>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {proof.attachmentUrls.length} attachment
                    {proof.attachmentUrls.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Open Support Tickets */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium tracking-wide">
                Open Support Tickets
              </h2>
              {openTicketsCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  {openTicketsCount > 9 ? "9+" : openTicketsCount}
                </span>
              )}
            </div>
            <Link
              href="/admin/support"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {recentOpenTickets.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No open tickets. All clear ✓
              </p>
            )}
            {recentOpenTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/support/${ticket.id}`}
                className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {ticket.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {ticket.fromName ?? ticket.fromEmail} ·{" "}
                    {new Date(ticket.createdAt).toLocaleDateString("en-NG")}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    ticket.status === "IN_PROGRESS"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {ticket.status === "IN_PROGRESS" ? "IN PROGRESS" : "OPEN"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
