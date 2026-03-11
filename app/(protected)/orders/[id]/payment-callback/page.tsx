import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { orderService } from "@/lib/services/order.service";
import { paymentService } from "@/lib/services/payment.service";
import { formatNaira } from "@/lib/types";

export const dynamic = "force-dynamic";

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PaymentCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const order = await orderService.getById(id);

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  const query = await searchParams;
  const reference = getSingleParam(query.reference) ?? getSingleParam(query.trxref);

  if (!reference) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-border/60 bg-card p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Payment</p>
          <h1 className="mt-3 font-display text-3xl tracking-tight">Missing payment reference</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We could not confirm this payment because the callback URL did not include a valid Paystack reference.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
            >
              Back to order
            </Link>
            <Link
              href="/orders"
              className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium"
            >
              View all orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const matchingTransaction = order.transactions.find(
    (transaction) => transaction.paystackRef === reference,
  );

  if (!matchingTransaction) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-border/60 bg-card p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Payment</p>
          <h1 className="mt-3 font-display text-3xl tracking-tight">Reference does not match this order</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The returned Paystack reference is not attached to this order, so no payment was applied.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
            >
              Back to order
            </Link>
            <Link
              href="/orders"
              className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium"
            >
              View all orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  try {
    const verification = await paymentService.verifyPayment(reference);

    if (!verification.status || verification.data.status !== "success") {
      return (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-2xl border border-border/60 bg-card p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">Payment</p>
            <h1 className="mt-3 font-display text-3xl tracking-tight">Payment not completed</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Paystack returned the status <span className="font-medium text-foreground">{verification.data.status}</span> for this transaction.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href={`/orders/${order.id}`}
                className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
              >
                Return to order
              </Link>
              <Link
                href="/orders"
                className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium"
              >
                View all orders
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (verification.data.amount !== matchingTransaction.amount) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-2xl border border-border/60 bg-card p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">Payment</p>
            <h1 className="mt-3 font-display text-3xl tracking-tight">Amount mismatch detected</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Paystack confirmed {formatNaira(verification.data.amount)}, but this order was expecting {formatNaira(matchingTransaction.amount)} for the referenced transaction.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href={`/orders/${order.id}`}
                className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
              >
                Return to order
              </Link>
              <Link
                href="/orders"
                className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium"
              >
                View all orders
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const processResult = await paymentService.processWebhook(
      reference,
      verification.data as unknown as Record<string, unknown>,
    );

    if (processResult && !processResult.alreadyProcessed) {
      await orderService.processPayment(order.id, verification.data.amount);
    }

    const refreshedOrder = await orderService.getById(order.id);

    if (!refreshedOrder) {
      notFound();
    }

    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-border/60 bg-card p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Payment</p>
          <h1 className="mt-3 font-display text-3xl tracking-tight">Payment confirmed</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We recorded {formatNaira(verification.data.amount)} for <span className="font-medium text-foreground">{refreshedOrder.product.name}</span>.
          </p>

          <div className="mt-6 grid gap-3 rounded-2xl bg-muted/30 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Order status</p>
              <p className="mt-1 text-sm font-medium">{refreshedOrder.status}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Amount paid</p>
              <p className="mt-1 text-sm font-medium">{formatNaira(refreshedOrder.amountPaid)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total order value</p>
              <p className="mt-1 text-sm font-medium">{formatNaira(refreshedOrder.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Balance remaining</p>
              <p className="mt-1 text-sm font-medium">
                {formatNaira(Math.max(0, refreshedOrder.totalAmount - refreshedOrder.amountPaid))}
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            {processResult?.alreadyProcessed
              ? "This payment had already been recorded earlier, so no duplicate update was made."
              : "Your order has been updated immediately, even if the webhook arrives later."}
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href={`/orders/${refreshedOrder.id}`}
              className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
            >
              View order
            </Link>
            <Link
              href="/orders"
              className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium"
            >
              View all orders
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify this payment right now.";

    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-border/60 bg-card p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Payment</p>
          <h1 className="mt-3 font-display text-3xl tracking-tight">Verification failed</h1>
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
          <div className="mt-6 flex gap-3">
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
            >
              Return to order
            </Link>
            <Link
              href="/orders"
              className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium"
            >
              View all orders
            </Link>
          </div>
        </div>
      </div>
    );
  }
}