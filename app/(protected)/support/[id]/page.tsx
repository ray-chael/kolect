import { getMyTicket } from "@/actions/support";
import { TicketThread } from "@/components/shared/ticket-thread";
import { notFound } from "next/navigation";

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-yellow-500/10 text-yellow-500",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500",
  CLOSED: "bg-green-500/10 text-green-500",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  CLOSED: "Closed",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getMyTicket(id);
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <a
        href="/support"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        &larr; All Tickets
      </a>

      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
              {ticket.subject}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ticket #{ticket.id.slice(-8).toUpperCase()} &middot; Created{" "}
              {new Date(ticket.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
              STATUS_STYLES[ticket.status] ?? "bg-muted"
            }`}
          >
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </span>
        </div>
      </div>

      <TicketThread ticket={ticket} />
    </div>
  );
}
