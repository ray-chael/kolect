import { prisma } from "@/lib/db";
import { SupportTicketStatus } from "@/app/generated/prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUSES: SupportTicketStatus[] = ["OPEN", "IN_PROGRESS", "CLOSED"];

const statusColors: Record<SupportTicketStatus, string> = {
  OPEN: "bg-amber-500/10 text-amber-600",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600",
  CLOSED: "bg-muted text-muted-foreground",
};

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "" } = await searchParams;

  const where =
    status && STATUSES.includes(status as SupportTicketStatus)
      ? { status: status as SupportTicketStatus }
      : undefined;

  const [tickets, counts] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        messages: { select: { id: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supportTicket.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count.id]),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
          Inbox
        </p>
        <h1 className="font-display text-3xl tracking-tight">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Link
          href="/admin/support"
          className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !status
              ? "bg-foreground text-background border-foreground"
              : "border-border/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({Object.values(countByStatus).reduce((a, b) => a + b, 0)})
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/support?status=${s}`}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              status === s
                ? "bg-foreground text-background border-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.replace("_", " ")} ({countByStatus[s] ?? 0})
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-border/60 py-16 text-center text-muted-foreground text-sm">
          No tickets found.
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">
                  From
                </th>
                <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">
                  Subject
                </th>
                <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">
                  Replies
                </th>
                <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">
                  Received
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">{ticket.fromName ?? ticket.fromEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.fromEmail}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/support/${ticket.id}`}
                      className="hover:text-primary transition-colors line-clamp-1"
                    >
                      {ticket.subject}
                    </Link>
                    {ticket.orderId && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Order #{ticket.orderId.slice(-8).toUpperCase()}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[ticket.status]}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {ticket.messages.length}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {ticket.createdAt.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
