import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CreateTicketForm } from "@/components/forms/create-ticket-form";

export default async function NewTicketPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch user's orders for the optional order selector
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    select: { id: true, product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <a
        href="/support"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        &larr; All Tickets
      </a>

      <div className="mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
          Support
        </p>
        <h1 className="font-display text-3xl tracking-tight">
          New Support Ticket
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe your issue and our team will get back to you within 24 hours.
        </p>
      </div>

      <CreateTicketForm
        orders={orders.map((o) => ({
          id: o.id,
          productName: o.product.name,
        }))}
      />
    </div>
  );
}
