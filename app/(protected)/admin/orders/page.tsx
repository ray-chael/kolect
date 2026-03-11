import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { product: true, user: true, deliveryAddress: true, pickupLocation: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Management</p>
        <h1 className="font-display text-3xl tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} recent orders
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">Customer</th>
              <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">Product</th>
              <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">Fulfillment</th>
              <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">Paid / Total</th>
              <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">Status</th>
              <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/20">
                <td className="px-5 py-4">{order.user.name || order.user.email}</td>
                <td className="px-5 py-4">{order.product.name}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {order.deliveryMethod === "PICKUP"
                    ? `Pickup${order.pickupLocation ? `: ${order.pickupLocation.name}` : ""}`
                    : `Delivery${order.deliveryAddress ? `: ${order.deliveryAddress.city}` : ""}`}
                </td>
                <td className="px-5 py-4">
                  {formatNaira(order.amountPaid)} / {formatNaira(order.totalAmount)}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-NG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
