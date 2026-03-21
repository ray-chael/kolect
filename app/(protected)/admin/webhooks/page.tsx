import { prisma } from "@/lib/db";
import { WebhooksClient } from "./webhooks-client";

export const dynamic = "force-dynamic";

export default async function AdminWebhooksPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; page?: string }>;
}) {
  const { source, page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = 50;

  const where = source && source !== "all" ? { source } : {};

  const [total, logs] = await Promise.all([
    prisma.webhookLog.count({ where }),
    prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        source: true,
        event: true,
        reference: true,
        payload: true,
        createdAt: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Source counts for filter tabs
  const sourceCounts = await prisma.webhookLog.groupBy({
    by: ["source"],
    _count: { id: true },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Admin</p>
      <h1 className="font-display text-4xl tracking-tight">Webhook Logs</h1>
      <p className="mt-2 text-muted-foreground">
        All incoming webhook events from connected services.
      </p>

      <WebhooksClient
        logs={logs.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        }))}
        total={total}
        page={pageNum}
        totalPages={totalPages}
        currentSource={source ?? "all"}
        sourceCounts={sourceCounts.map((s) => ({
          source: s.source,
          count: s._count.id,
        }))}
      />
    </div>
  );
}
