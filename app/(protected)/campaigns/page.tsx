import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/types";
import { ShareButton } from "@/components/shared/share-button";
import Image from "next/image";
import Link from "next/link";
import { Package, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const campaigns = await prisma.helpMePay.findMany({
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
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const active = campaigns.filter(
    (c) => c.isActive && new Date() < c.expiresAt,
  );
  const inactive = campaigns.filter(
    (c) => !c.isActive || new Date() >= c.expiresAt,
  );

  function CampaignCard({
    campaign,
  }: {
    campaign: (typeof campaigns)[number];
  }) {
    const product = campaign.order?.product ?? campaign.product;
    const isExpired = new Date() > campaign.expiresAt;
    const isActive = campaign.isActive && !isExpired;
    const percent = Math.min(
      100,
      Math.round((campaign.amountRaised / campaign.targetAmount) * 100),
    );
    const remaining = campaign.targetAmount - campaign.amountRaised;
    const expiresIn = Math.ceil(
      (new Date(campaign.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    const campaignUrl = `${appUrl}/help-me-pay/${campaign.slug}`;

    return (
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {/* Top image strip */}
        {product?.images?.[0] && (
          <div className="h-36 w-full overflow-hidden bg-muted">
            <Image
              src={product.images[0]}
              alt={product.name}
              width={600}
              height={144}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium leading-snug truncate">
                {product?.name ?? "Campaign"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {campaign._count.contributions} contributor
                {campaign._count.contributions !== 1 ? "s" : ""}
                {!isExpired && isActive && (
                  <span className="ml-2 text-muted-foreground/70">
                    · {expiresIn}d left
                  </span>
                )}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                isActive
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : isExpired
                    ? "bg-muted text-muted-foreground"
                    : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
              }`}
            >
              {isActive ? "Active" : isExpired ? "Expired" : "Closed"}
            </span>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-foreground">
                {formatNaira(campaign.amountRaised)} raised
              </span>
              <span className="text-muted-foreground">{percent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Goal: {formatNaira(campaign.targetAmount)}</span>
              {remaining > 0 && (
                <span>{formatNaira(remaining)} to go</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Link
              href={`/help-me-pay/${campaign.slug}`}
              className="flex-1 rounded-full border border-border/60 px-3 py-1.5 text-center text-xs font-medium hover:bg-muted transition-colors"
            >
              View
            </Link>
            <ShareButton
              url={campaignUrl}
              title={`Help me pay for ${product?.name ?? "this item"}`}
              text="Support my campaign on Ade's Kolekt!"
              label="Share"
              variant="outline"
              size="sm"
              className="rounded-full text-xs flex-1"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
            My Campaigns
          </p>
          <h1 className="font-display text-4xl tracking-tight">
            Help Me Pay
          </h1>
          <p className="mt-2 text-muted-foreground">
            Campaigns you&apos;ve created to crowdfund purchases.
          </p>
        </div>
        <Link
          href="/collection"
          className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40 mb-4" />
          <h2 className="font-semibold text-lg mb-2">No campaigns yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
            Browse products and start a Help Me Pay campaign to crowdfund your
            next purchase.
          </p>
          <Link
            href="/collection"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Browse Collection
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Active */}
          {active.length > 0 && (
            <section>
              <p className="mb-4 text-xs tracking-[0.2em] uppercase text-muted-foreground">
                Active · {active.length}
              </p>
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((c) => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            </section>
          )}

          {/* Inactive / Expired */}
          {inactive.length > 0 && (
            <section>
              <p className="mb-4 text-xs tracking-[0.2em] uppercase text-muted-foreground">
                Closed & Expired · {inactive.length}
              </p>
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 opacity-70">
                {inactive.map((c) => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
