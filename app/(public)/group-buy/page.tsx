import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/types";
import { getSession } from "@/lib/session";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Group Buys — Ade's Kolekt",
  description:
    "Join an open group buy and split the cost with others. Contribute any amount toward a shared purchase.",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-500/10 text-emerald-600",
  FUNDED: "bg-blue-500/10 text-blue-600",
  PURCHASED: "bg-violet-500/10 text-violet-600",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-500/10 text-red-600",
};

export default async function GroupBuyListingPage() {
  const session = await getSession();

  const nowTs = Date.now();

  const [openGroupBuys, myGroupBuys] = await Promise.all([
    prisma.groupBuy.findMany({
      where: {
        status: "OPEN",
        expiresAt: { gt: new Date() },
      },
      include: {
        product: { select: { name: true, slug: true, images: true } },
        creator: { select: { name: true } },
        _count: {
          select: { contributions: { where: { status: "SUCCESS" } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    session
      ? prisma.groupBuy.findMany({
          where: { creatorId: session.user.id },
          include: {
            product: { select: { name: true, slug: true, images: true } },            creator: { select: { name: true } },            _count: {
              select: { contributions: { where: { status: "SUCCESS" } } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : Promise.resolve([]),
  ]);

  const myIds = new Set(myGroupBuys.map((g) => g.id));
  const openExcludingMine = openGroupBuys.filter((g) => !myIds.has(g.id));
  const myOpen = myGroupBuys.filter(
    (g) => g.status === "OPEN" && new Date() < g.expiresAt,
  );
  const myPast = myGroupBuys.filter(
    (g) => g.status !== "OPEN" || new Date() >= g.expiresAt,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
            Community
          </p>
          <h1 className="font-display text-4xl tracking-tight">Group Buys</h1>
          <p className="mt-2 text-muted-foreground max-w-lg">
            Pool funds with others to buy together. Contribute any amount and
            get a share when the goal is reached.
          </p>
        </div>
        <Link
          href="/collection"
          className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium tracking-widest uppercase text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Start a Group Buy
        </Link>
      </div>

      {/* My Active Group Buys */}
      {myOpen.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs tracking-[0.2em] uppercase text-primary mb-4">
            My Active Group Buys
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myOpen.map((g) => (
              <GroupBuyCard key={g.id} groupBuy={g} isMine now={nowTs} />
            ))}
          </div>
        </section>
      )}

      {/* Open Group Buys from Others */}
      <section className="mb-12">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
          {openExcludingMine.length > 0
            ? `${openExcludingMine.length} Open Group Buy${openExcludingMine.length !== 1 ? "s" : ""}`
            : "No open group buys right now"}
        </h2>
        {openExcludingMine.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {openExcludingMine.map((g) => (
              <GroupBuyCard key={g.id} groupBuy={g} now={nowTs} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
            <p className="text-muted-foreground">
              No open group buys at the moment.
            </p>
            <Link
              href="/collection"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Browse the collection and start one →
            </Link>
          </div>
        )}
      </section>

      {/* My Past Group Buys */}
      {myPast.length > 0 && (
        <section>
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
            My Past Group Buys
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myPast.map((g) => (
              <GroupBuyCard key={g.id} groupBuy={g} isMine now={nowTs} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

type GroupBuyItem = Awaited<
  ReturnType<typeof prisma.groupBuy.findMany<{
    include: {
      product: { select: { name: true; slug: true; images: true } };
      creator: { select: { name: true } };
      _count: { select: { contributions: true } };
    };
  }>>
>[number];

function GroupBuyCard({
  groupBuy,
  isMine = false,
  now,
}: {
  groupBuy: GroupBuyItem;
  isMine?: boolean;
  now: number;
}) {
  const isExpired = new Date() > groupBuy.expiresAt;
  const isOpen = groupBuy.status === "OPEN" && !isExpired;
  const percent = Math.min(
    100,
    Math.round((groupBuy.amountRaised / groupBuy.targetAmount) * 100),
  );
  const remaining = groupBuy.targetAmount - groupBuy.amountRaised;
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(groupBuy.expiresAt).getTime() - now) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const displayStatus = isExpired && groupBuy.status === "OPEN" ? "EXPIRED" : groupBuy.status;

  return (
    <Link
      href={`/group-buy/${groupBuy.slug}`}
      className="group rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
    >
      {/* Image */}
      <div className="h-40 w-full bg-muted overflow-hidden">
        {groupBuy.product.images[0] ? (
          <Image
            src={groupBuy.product.images[0]}
            alt={groupBuy.product.name}
            width={600}
            height={160}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground/40 text-4xl">
            📦
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium leading-snug line-clamp-2 text-sm">
              {groupBuy.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {groupBuy.product.name}
            </p>
          </div>
          <span
            className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[displayStatus] ?? "bg-muted text-muted-foreground"}`}
          >
            {displayStatus}
          </span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{percent}% funded</span>
            <span>{formatNaira(groupBuy.amountRaised)} raised</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent.toString()}%` }}
            />
          </div>
          {isOpen && (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatNaira(remaining)} remaining
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>
            {groupBuy._count.contributions} contributor
            {groupBuy._count.contributions !== 1 ? "s" : ""}
          </span>
          {isOpen ? (
            <span
              className={daysLeft <= 3 ? "text-red-500 font-medium" : ""}
            >
              {daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
            </span>
          ) : (
            <span>{isMine ? "Your campaign" : ""}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
