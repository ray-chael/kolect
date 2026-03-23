import { getMyTickets } from "@/actions/support";

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

export default async function SupportPage() {
  const tickets = await getMyTickets();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
            Support
          </p>
          <h1 className="font-display text-4xl tracking-tight">
            My Tickets
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track your support requests and conversations.
          </p>
        </div>
        <a
          href="/support/new"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/80 transition-colors"
        >
          New Ticket
        </a>
      </div>

      {tickets.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">No support tickets yet.</p>
          <a
            href="/support/new"
            className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Open your first ticket &rarr;
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <a
              key={ticket.id}
              href={`/support/${ticket.id}`}
              className="block rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold tracking-tight truncate">
                    {ticket.subject}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    #{ticket.id.slice(-8).toUpperCase()} &middot;{" "}
                    {ticket._count.messages}{" "}
                    {ticket._count.messages === 1 ? "message" : "messages"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      STATUS_STYLES[ticket.status] ?? "bg-muted"
                    }`}
                  >
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
