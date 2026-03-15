import { flashSaleService } from "@/lib/services/flash-sale.service";
import { formatNaira } from "@/lib/types";
import { FlashSaleToggle } from "@/components/admin/flash-sale-toggle";
import { FlashSaleDelete } from "@/components/admin/flash-sale-delete";

export const dynamic = "force-dynamic";

function getSaleStatus(sale: { isActive: boolean; startsAt: Date; endsAt: Date }) {
  const now = new Date();
  if (!sale.isActive) return { label: "Paused", className: "bg-muted text-muted-foreground" };
  if (now < sale.startsAt) return { label: "Scheduled", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  if (now > sale.endsAt) return { label: "Expired", className: "bg-destructive/10 text-destructive" };
  return { label: "Live", className: "bg-primary/10 text-primary" };
}

function formatDateTime(d: Date) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminFlashSalesPage() {
  const sales = await flashSaleService.getAll();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Promotions</p>
          <h1 className="font-display text-3xl tracking-tight">Flash Sales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sales.length} {sales.length === 1 ? "sale" : "sales"}
          </p>
        </div>
        <a
          href="/admin/flash-sales/new"
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium tracking-wide text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
        >
          New Flash Sale
        </a>
      </div>

      {sales.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
          <p className="text-muted-foreground">No flash sales yet. Create one to offer discounted prices for a limited time.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Product</th>
                <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Label</th>
                <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Regular</th>
                <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Sale Price</th>
                <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Period</th>
                <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const status = getSaleStatus(sale);
                const discount = Math.round((1 - sale.salePrice / sale.product.markupPrice) * 100);
                return (
                  <tr key={sale.id} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/20">
                    <td className="px-5 py-4">
                      <a
                        href={`/admin/flash-sales/${sale.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {sale.product.name}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{sale.label}</td>
                    <td className="px-5 py-4 text-muted-foreground line-through">
                      {formatNaira(sale.product.markupPrice)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium">{formatNaira(sale.salePrice)}</span>
                      <span className="ml-1.5 text-xs text-primary">−{discount}%</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      <span>{formatDateTime(sale.startsAt)}</span>
                      <br />
                      <span>→ {formatDateTime(sale.endsAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <a
                          href={`/admin/flash-sales/${sale.id}`}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          Edit
                        </a>
                        <FlashSaleToggle id={sale.id} isActive={sale.isActive} />
                        <FlashSaleDelete id={sale.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
