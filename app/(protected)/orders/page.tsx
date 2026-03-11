import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { orderService } from "@/lib/services/order.service";
import { coerceCustomSelections, formatNaira } from "@/lib/types";
import { calculateLiquidationPercent, daysUntilExpiry } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

function formatSelections(order: {
  selectedColor: string | null;
  selectedSize: string | null;
  customSelections: unknown;
}) {
  const parts: string[] = [];

  if (order.selectedColor) parts.push(`Color: ${order.selectedColor}`);
  if (order.selectedSize) parts.push(`Size: ${order.selectedSize}`);

  for (const [key, value] of Object.entries(
    coerceCustomSelections(order.customSelections),
  )) {
    if (value.trim()) {
      parts.push(`${key}: ${value}`);
    }
  }

  return parts;
}

function describeFulfillment(order: {
  deliveryMethod: "DELIVERY" | "PICKUP";
  deliveryAddress: { city: string; state: string } | null;
  pickupLocation: { name: string; city: string; state: string } | null;
}) {
  if (order.deliveryMethod === "PICKUP" && order.pickupLocation) {
    return `Pickup: ${order.pickupLocation.name} (${order.pickupLocation.city}, ${order.pickupLocation.state})`;
  }

  if (order.deliveryAddress) {
    return `Delivery: ${order.deliveryAddress.city}, ${order.deliveryAddress.state}`;
  }

  return "Fulfillment pending";
}

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orders = await orderService.getByUser(session.user.id);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Orders</p>
        <h1 className="font-display text-4xl tracking-tight">My Orders</h1>
        <p className="mt-2 text-muted-foreground">
          Track your installment progress and order status.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
          <a
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Browse collection &rarr;
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const percent = calculateLiquidationPercent(
              order.amountPaid,
              order.totalAmount
            );
            const daysLeft = daysUntilExpiry(order.priceLockExpiresAt);
            const selections = formatSelections(order);
            const fulfillment = describeFulfillment(order);

            return (
              <a
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold tracking-tight">{order.product.name}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatNaira(order.amountPaid)} of{" "}
                      {formatNaira(order.totalAmount)} paid
                    </p>
                    {selections.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {selections.join(" • ")}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{fulfillment}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {order.status}
                    </span>
                    {daysLeft > 0 && order.status !== "PAID" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {daysLeft}d price lock
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{percent}% completed</span>
                    <span>
                      {formatNaira(order.totalAmount - order.amountPaid)}{" "}
                      remaining
                    </span>
                  </div>
                  <Progress value={percent} className="gap-0" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
