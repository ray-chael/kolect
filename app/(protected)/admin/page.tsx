export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Overview</p>
      <h1 className="font-display text-4xl tracking-tight">Admin Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Manage products, orders, and procurement.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Active Products</p>
          <p className="mt-2 font-display text-4xl text-foreground">&mdash;</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Pending Orders</p>
          <p className="mt-2 font-display text-4xl text-foreground">&mdash;</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Ready to Procure</p>
          <p className="mt-2 font-display text-4xl text-foreground">&mdash;</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Revenue (This Month)</p>
          <p className="mt-2 font-display text-4xl text-foreground">&mdash;</p>
        </div>
      </div>
    </div>
  );
}
