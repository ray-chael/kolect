import { getHelpMePay } from "@/actions/help-me-pay";
import { formatNaira } from "@/lib/types";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { HelpMePayContributeForm } from "./contribute-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getHelpMePay(slug);
  if (!campaign) return {};

  const title = `Help ${campaign.creator.name ?? "someone"} pay for ${campaign.order.product.name} — Ade's Kolekt`;
  const description =
    campaign.message ||
    `Help fund ${campaign.order.product.name}. ${formatNaira(campaign.targetAmount - campaign.amountRaised)} remaining.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(campaign.order.product.images[0]
        ? { images: [{ url: campaign.order.product.images[0], width: 1200, height: 630 }] }
        : {}),
    },
  };
}

export default async function HelpMePayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const campaign = await getHelpMePay(slug);

  if (!campaign) notFound();

  const isExpired = new Date() > campaign.expiresAt;
  const isActive = campaign.isActive && !isExpired;
  const remaining = campaign.targetAmount - campaign.amountRaised;
  const percent = Math.min(
    100,
    Math.round((campaign.amountRaised / campaign.targetAmount) * 100),
  );
  const paymentSuccess = sp.payment === "success";

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (campaign.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <a
        href="/collection"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        &larr; Back to Collection
      </a>

      {paymentSuccess && (
        <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          Payment successful! Thank you for helping out.
        </div>
      )}

      <div className="mt-6 grid gap-8 md:grid-cols-[280px_1fr]">
        {/* Product image */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl bg-muted/60 overflow-hidden">
            {campaign.order.product.images[0] ? (
              <Image
                src={campaign.order.product.images[0]}
                alt={campaign.order.product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 280px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}
          </div>
          <div>
            <a
              href={`/collection/${campaign.order.product.slug}`}
              className="text-sm text-primary hover:underline"
            >
              View product &rarr;
            </a>
          </div>
        </div>

        {/* Details + form */}
        <div className="space-y-6">
          <div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium mb-2 ${
                isActive
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isActive ? "Active" : isExpired ? "Expired" : "Closed"}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
              Help {campaign.creator.name ?? "someone"} pay for{" "}
              {campaign.order.product.name}
            </h1>
            {campaign.message && (
              <p className="mt-2 text-sm text-muted-foreground">
                &ldquo;{campaign.message}&rdquo;
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              by {campaign.creator.name ?? "Anonymous"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span>{formatNaira(campaign.amountRaised)} raised</span>
              <span>{formatNaira(campaign.targetAmount)} needed</span>
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
            {campaign.interestAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Includes {formatNaira(campaign.interestAmount)} platform fee
              </p>
            )}
          </div>

          {/* Contributors */}
          {campaign.contributions.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="font-semibold tracking-tight mb-3">
                Helpers ({campaign.contributions.length})
              </h2>
              <div className="space-y-2">
                {campaign.contributions.map((c) => (
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
          {isActive && remaining > 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="font-semibold tracking-tight mb-4">
                Help with a contribution
              </h2>
              <HelpMePayContributeForm
                helpMePayId={campaign.id}
                remaining={remaining}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card p-5 text-center">
              <p className="text-sm text-muted-foreground">
                {!campaign.isActive
                  ? "This campaign has been fully funded! Thank you to all contributors."
                  : isExpired
                    ? "This campaign has expired."
                    : "This campaign is no longer active."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
