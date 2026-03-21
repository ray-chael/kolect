import { getGroupBuy } from "@/actions/group-buy";
import { getBankTransferDetails } from "@/actions/settings";
import { formatNaira } from "@/lib/types";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { GroupBuyContributeForm } from "./contribute-form";
import { ProductVideoThumbnail } from "@/components/shared/product-video-thumbnail";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const groupBuy = await getGroupBuy(slug);
  if (!groupBuy) return {};

  const title = `${groupBuy.title} — Group Buy on Ade's Kolekt`;
  const description = `Join the group buy for ${groupBuy.product.name}. ${formatNaira(groupBuy.targetAmount - groupBuy.amountRaised)} remaining to fund.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(groupBuy.product.images[0]
        ? {
            images: [
              { url: groupBuy.product.images[0], width: 1200, height: 630 },
            ],
          }
        : {}),
    },
  };
}

export default async function GroupBuyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const [groupBuy, bankTransfer] = await Promise.all([
    getGroupBuy(slug),
    getBankTransferDetails(),
  ]);

  if (!groupBuy) notFound();

  const isExpired = new Date() > groupBuy.expiresAt;
  const isOpen = groupBuy.status === "OPEN" && !isExpired;
  const remaining = groupBuy.targetAmount - groupBuy.amountRaised;
  const percent = Math.min(
    100,
    Math.round((groupBuy.amountRaised / groupBuy.targetAmount) * 100),
  );
  const paymentSuccess = sp.payment === "success";

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (groupBuy.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/collection"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        &larr; Back to Collection
      </Link>

      {paymentSuccess && (
        <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          Payment successful! Thank you for your contribution.
        </div>
      )}

      <div className="mt-6 grid gap-8 md:grid-cols-[280px_1fr]">
        {/* Product image */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl bg-muted/60 overflow-hidden">
            {groupBuy.product.images[0] ? (
              <Image
                src={groupBuy.product.images[0]}
                alt={groupBuy.product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 280px"
                priority
              />
            ) : groupBuy.product.videos[0] ? (
              <ProductVideoThumbnail src={groupBuy.product.videos[0]} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}
          </div>
          <div>
            <a
              href={`/collection/${groupBuy.product.slug}`}
              className="text-sm text-primary hover:underline"
            >
              View product &rarr;
            </a>
          </div>
        </div>

        {/* Details + form */}
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  groupBuy.status === "OPEN"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : groupBuy.status === "FUNDED"
                      ? "bg-primary/10 text-primary"
                      : groupBuy.status === "PURCHASED"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {groupBuy.status}
              </span>
              <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {groupBuy.splitType === "EQUAL"
                  ? "Equal split"
                  : "Flexible split"}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
              {groupBuy.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {groupBuy.product.name} ·{" "}
              {formatNaira(groupBuy.product.markupPrice)}
            </p>
            {groupBuy.selectedColor && (
              <p className="text-xs text-muted-foreground">
                Color: {groupBuy.selectedColor}
              </p>
            )}
            {groupBuy.selectedSize && (
              <p className="text-xs text-muted-foreground">
                Size: {groupBuy.selectedSize}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              Created by {groupBuy.creator.name ?? "Anonymous"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span>{formatNaira(groupBuy.amountRaised)} raised</span>
              <span>{formatNaira(groupBuy.targetAmount)} target</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{percent}% funded</span>
              <span>
                {isExpired
                  ? "Expired"
                  : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
              </span>
            </div>
            {groupBuy.interestPercent > 0 && (
              <p className="text-xs text-muted-foreground">
                Includes {groupBuy.interestPercent}% interest
              </p>
            )}
          </div>

          {/* Contributors */}
          {groupBuy.contributions.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="font-semibold tracking-tight mb-3">
                Contributors ({groupBuy.contributions.length})
              </h2>
              <div className="space-y-2">
                {groupBuy.contributions.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-2.5 text-sm"
                  >
                    <span className="font-medium">{c.name ?? "Anonymous"}</span>
                    <span className="text-muted-foreground">
                      {formatNaira(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contribution form */}
          {isOpen && remaining > 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="font-semibold tracking-tight mb-4">
                Contribute to this group buy
              </h2>
              <GroupBuyContributeForm
                groupBuyId={groupBuy.id}
                remaining={remaining}
                splitType={groupBuy.splitType}
                targetAmount={groupBuy.targetAmount}
                contributorCount={groupBuy.contributions.length}
                maxMembers={groupBuy.maxMembers}
                bankTransfer={bankTransfer}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card p-5 text-center">
              <p className="text-sm text-muted-foreground">
                {groupBuy.status === "FUNDED" || groupBuy.status === "PURCHASED"
                  ? "This group buy has been fully funded!"
                  : isExpired
                    ? "This group buy has expired."
                    : "This group buy is no longer accepting contributions."}
              </p>
            </div>
          )}

          {groupBuy.order && (
            <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-primary">
              Order has been placed! Status: {groupBuy.order.status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
