import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TicketActions } from "@/components/admin/ticket-actions";

export const dynamic = "force-dynamic";

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          href="/admin/support"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block"
        >
          ← Back to support
        </Link>
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
          Ticket
        </p>
        <h1 className="font-display text-2xl tracking-tight">{ticket.subject}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            From:{" "}
            <span className="text-foreground">
              {ticket.fromName ?? ticket.fromEmail}
            </span>{" "}
            &lt;{ticket.fromEmail}&gt;
          </span>
          {ticket.orderId && (
            <Link
              href={`/admin/orders/${ticket.orderId}`}
              className="text-primary hover:underline"
            >
              Order #{ticket.orderId.slice(-8).toUpperCase()}
            </Link>
          )}
          <span>
            {ticket.createdAt.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <TicketActions ticket={ticket} />
    </div>
  );
}
