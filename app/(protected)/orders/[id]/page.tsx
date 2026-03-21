import { PaymentForm } from "@/components/forms/payment-form";
import { CreateHelpMePayForm } from "@/components/forms/create-help-me-pay-form";
import { Progress } from "@/components/ui/progress";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { orderService } from "@/lib/services/order.service";
import { coerceCustomSelections, formatNaira } from "@/lib/types";
import { calculateLiquidationPercent, daysUntilExpiry } from "@/lib/utils";
import { notFound } from "next/navigation";
import { getBankTransferDetails } from "@/actions/settings";

function getSelectionEntries(order: {
  selectedColor: string | null;
  selectedSize: string | null;
  customSelections: unknown;
}) {
  const entries: Array<{ label: string; value: string }> = [];

  if (order.selectedColor)
    entries.push({ label: "Color", value: order.selectedColor });
  if (order.selectedSize)
    entries.push({ label: "Size", value: order.selectedSize });

  for (const [label, value] of Object.entries(
    coerceCustomSelections(order.customSelections),
  )) {
    if (value.trim()) {
      entries.push({ label, value });
    }
  }

  return entries;
}

function isContributionPlanOrder(customSelections: unknown) {
  const selections = coerceCustomSelections(customSelections);
  return typeof selections["Payment plan"] === "string";
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const [order, bankTransfer] = await Promise.all([
    orderService.getById(id),
    getBankTransferDetails(),
  ]);

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  const percent = calculateLiquidationPercent(
    order.amountPaid,
    order.totalAmount,
  );
  const daysLeft = daysUntilExpiry(order.priceLockExpiresAt);
  const remaining = order.totalAmount - order.amountPaid;
  const selectionEntries = getSelectionEntries(order);
  const contributionPlanOrder = isContributionPlanOrder(order.customSelections);
  const isPickup = order.deliveryMethod === "PICKUP";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <a
          href="/orders"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          &larr; Back to orders
        </a>
      </div>

      <div className="space-y-8">
        {/* Order Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">
              {order.product.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Order created{" "}
              {new Date(order.createdAt).toLocaleDateString("en-NG")}
            </p>
          </div>
          <span className="rounded-full bg-muted px-4 py-1.5 text-xs font-medium tracking-wide">
            {order.status}
          </span>
        </div>

        {/* Liquidation Progress */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
          <h2 className="font-semibold tracking-tight">Payment Progress</h2>
          <div className="flex justify-between text-sm">
            <span>{formatNaira(order.amountPaid)} paid</span>
            <span>{formatNaira(order.totalAmount)} total</span>
          </div>
          <Progress value={percent} className="gap-0" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percent}% completed</span>
            <span>{formatNaira(remaining)} remaining</span>
          </div>

          {daysLeft > 0 && order.status !== "PAID" && (
            <p className="text-sm text-warm">
              Price lock expires in {daysLeft} days
            </p>
          )}

          {order.isDepositPaid && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Deposit confirmed &mdash; your price is locked
            </p>
          )}
        </div>

        {selectionEntries.length > 0 && (
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-semibold tracking-tight mb-4">
              Chosen Options
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {selectionEntries.map((entry) => (
                <div
                  key={`${entry.label}-${entry.value}`}
                  className="rounded-xl border border-border/40 px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {entry.label}
                  </p>
                  <p className="mt-1 text-sm font-medium">{entry.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-semibold tracking-tight mb-4">Fulfillment</h2>

          {isPickup && order.pickupLocation ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium">
                Pickup at {order.pickupLocation.name}
              </p>
              <p className="text-muted-foreground">
                {order.pickupLocation.addressLine1}
                {order.pickupLocation.addressLine2
                  ? `, ${order.pickupLocation.addressLine2}`
                  : ""}
                {`, ${order.pickupLocation.city}, ${order.pickupLocation.state}`}
              </p>
              {order.pickupLocation.pickupInstructions && (
                <p className="text-muted-foreground">
                  {order.pickupLocation.pickupInstructions}
                </p>
              )}
            </div>
          ) : order.deliveryAddress ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium">Door delivery</p>
              <p className="text-muted-foreground">
                {order.deliveryAddress.recipientName}
              </p>
              <p className="text-muted-foreground">
                {order.deliveryAddress.phone}
              </p>
              <p className="text-muted-foreground">
                {order.deliveryAddress.addressLine1}
                {order.deliveryAddress.addressLine2
                  ? `, ${order.deliveryAddress.addressLine2}`
                  : ""}
                {`, ${order.deliveryAddress.city}, ${order.deliveryAddress.state}`}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No fulfillment details recorded.
            </p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Logistics provider: {order.logisticsProvider}
          </p>
        </div>

        {/* Make Payment */}
        {["PENDING", "PARTIAL"].includes(order.status) && (
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-semibold tracking-tight mb-4">
              Make a Payment
            </h2>
            <PaymentForm
              orderId={order.id}
              remainingKobo={remaining}
              isDepositPaid={order.isDepositPaid}
              preferFullPayment={
                !order.isDepositPaid &&
                order.installmentMonths === 1 &&
                !contributionPlanOrder
              }
              bankTransfer={bankTransfer}
            />
          </div>
        )}

        {/* Help Me Pay */}
        {["PENDING", "PARTIAL"].includes(order.status) && !order.helpMePay && (
          <CreateHelpMePayForm orderId={order.id} />
        )}
        {order.helpMePay && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-2">
            <h2 className="font-semibold tracking-tight">Help Me Pay</h2>
            <p className="text-sm text-muted-foreground">
              {order.helpMePay.isActive
                ? "Your campaign is active. Share the link below:"
                : "Campaign is no longer active."}
            </p>
            {order.helpMePay.isActive && (
              <a
                href={`/help-me-pay/${order.helpMePay.slug}`}
                className="text-sm font-medium text-primary hover:underline break-all"
              >
                /help-me-pay/{order.helpMePay.slug}
              </a>
            )}
          </div>
        )}

        {/* Transaction History */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-semibold tracking-tight mb-4">
            Transaction History
          </h2>
          {order.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {order.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString("en-NG")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {tx.type === "REFUND" ? "-" : "+"}
                      {formatNaira(tx.amount)}
                    </p>
                    <span
                      className={`text-xs ${
                        tx.status === "SUCCESS"
                          ? "text-green-600 dark:text-green-400"
                          : tx.status === "FAILED"
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery Info */}
        {order.riderName && (
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-semibold tracking-tight mb-3">
              Delivery Details
            </h2>
            <p className="text-sm">Rider: {order.riderName}</p>
            {order.riderPhone && (
              <p className="text-sm">Phone: {order.riderPhone}</p>
            )}
            {order.trackingNote && (
              <p className="mt-2 text-sm text-muted-foreground">
                {order.trackingNote}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
