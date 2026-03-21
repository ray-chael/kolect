import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { orderService } from "@/lib/services/order.service";
import { formatNaira } from "@/lib/types";
import { prisma } from "@/lib/db";
import { ShareButton } from "@/components/shared/share-button";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Heart,
  ArrowRight,
  Users,
  Package,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [orders, campaigns, wishlistCount] = await Promise.all([
    orderService.getByUser(session.user.id),
    prisma.helpMePay.findMany({
      where: { creatorId: session.user.id },
      include: {
        product: { select: { name: true, slug: true, images: true } },
        order: {
          include: {
            product: { select: { name: true, slug: true, images: true } },
          },
        },
        _count: {
          select: { contributions: { where: { status: "SUCCESS" } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.wishlistItem.count({ where: { userId: session.user.id } }),
  ]);

  const activeOrders = orders.filter(
    (o) => o.status === "PENDING" || o.status === "PARTIAL",
  ).length;

  const totalPaid = orders.reduce((sum, o) => sum + o.amountPaid, 0);

  const itemsDelivered = orders.filter((o) => o.status === "DELIVERED").length;

  const activeCampaigns = campaigns.filter(
    (c) => c.isActive && new Date() < c.expiresAt,
  ).length;

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const statusLabel: Record<string, string> = {
    PENDING: "Pending",
    PARTIAL: "In Progress",
    PAID: "Paid",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
    DELIVERED: "Delivered",
    PROCESSING: "Processing",
  };

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    PARTIAL: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    PAID: "bg-green-500/10 text-green-600 dark:text-green-400",
    DELIVERED: "bg-green-500/10 text-green-600 dark:text-green-400",
    CANCELLED: "bg-muted text-muted-foreground",
    EXPIRED: "bg-muted text-muted-foreground",
    PROCESSING: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
          Dashboard
        </p>
        <h1 className="font-display text-4xl tracking-tight">
          Welcome back, {session.user.name?.split(" ")[0] ?? session.user.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Track your orders, campaigns and payments all in one place.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
              Active Orders
            </p>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-display text-3xl text-foreground">
            {activeOrders}
          </p>
          <Link
            href="/orders"
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View orders <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
              Total Paid
            </p>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-display text-3xl text-foreground">
            {formatNaira(totalPaid)}
          </p>
          <p className="text-xs text-muted-foreground">
            across {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
              Delivered
            </p>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-display text-3xl text-foreground">
            {itemsDelivered}
          </p>
          <p className="text-xs text-muted-foreground">items received</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
              Wishlist
            </p>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-display text-3xl text-foreground">
            {wishlistCount}
          </p>
          <Link
            href="/wishlist"
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View wishlist <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <p className="mb-4 text-xs tracking-[0.2em] uppercase text-muted-foreground">
          Quick Actions
        </p>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[
            {
              href: "/collection",
              icon: Package,
              label: "Shop Now",
              sub: "Browse products",
            },
            {
              href: "/orders",
              icon: ShoppingBag,
              label: "My Orders",
              sub: "Track & pay",
            },
            {
              href: "/wishlist",
              icon: Heart,
              label: "Wishlist",
              sub: `${wishlistCount} saved`,
            },
            {
              href: "/group-buy",
              icon: Users,
              label: "Group Buys",
              sub: "Fund together",
            },
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-4 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
              Recent Orders
            </p>
            <Link
              href="/orders"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              All orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            {recentOrders.map((order, i) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors ${
                  i !== recentOrders.length - 1
                    ? "border-b border-border/40"
                    : ""
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60">
                  {order.product?.images?.[0] ? (
                    <Image
                      src={order.product.images[0]}
                      alt={order.product.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {order.product?.name ?? "Order"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatNaira(order.amountPaid)} paid of{" "}
                    {formatNaira(order.totalAmount)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    statusColor[order.status] ??
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {statusLabel[order.status] ?? order.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Help Me Pay Campaigns */}
      {campaigns.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                Help Me Pay Campaigns
              </p>
              {activeCampaigns > 0 && (
                <p className="text-xs text-primary mt-0.5">
                  {activeCampaigns} active
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {campaigns.map((campaign) => {
              const product = campaign.order?.product ?? campaign.product;
              const isExpired = new Date() > campaign.expiresAt;
              const isActive = campaign.isActive && !isExpired;
              const percent = Math.min(
                100,
                Math.round(
                  (campaign.amountRaised / campaign.targetAmount) * 100,
                ),
              );
              const campaignUrl = `${appUrl}/help-me-pay/${campaign.slug}`;

              return (
                <div
                  key={campaign.id}
                  className="rounded-2xl border border-border/60 bg-card p-5 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    {product?.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded-xl bg-muted/60 flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug truncate">
                        {product?.name ?? "Campaign"}
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isActive
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isActive
                            ? "Active"
                            : isExpired
                              ? "Expired"
                              : "Closed"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {campaign._count.contributions} helper
                          {campaign._count.contributions !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatNaira(campaign.amountRaised)} raised</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Goal: {formatNaira(campaign.targetAmount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/help-me-pay/${campaign.slug}`}
                      className="flex-1 rounded-full border border-border/60 px-3 py-1.5 text-center text-xs font-medium hover:bg-muted transition-colors"
                    >
                      View Campaign
                    </Link>
                    <ShareButton
                      url={campaignUrl}
                      title={`Help me pay for ${product?.name ?? "this item"}`}
                      text="Support my campaign on Ade's Kolekt!"
                      label="Share"
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for new users */}
      {orders.length === 0 && campaigns.length === 0 && (
        <div className="mt-12 rounded-2xl border border-dashed border-border/60 p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40 mb-4" />
          <h2 className="font-semibold text-lg mb-2">No activity yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
            Start shopping to see your orders, payments and campaigns here.
          </p>
          <Link
            href="/collection"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse Collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
