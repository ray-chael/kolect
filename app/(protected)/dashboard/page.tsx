import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Dashboard</p>
        <h1 className="font-display text-4xl tracking-tight">
          Welcome, {session.user.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your orders and track your installment progress.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-2">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Active Orders</p>
          <p className="font-display text-4xl text-foreground">&mdash;</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-2">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Total Paid</p>
          <p className="font-display text-4xl text-foreground">&mdash;</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-2">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Items Delivered</p>
          <p className="font-display text-4xl text-foreground">&mdash;</p>
        </div>
      </div>
    </div>
  );
}
