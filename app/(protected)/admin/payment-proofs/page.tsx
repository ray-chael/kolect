import { prisma } from "@/lib/db";
import { PaymentProofStatus } from "@/app/generated/prisma/client";
import { formatNaira } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUSES: PaymentProofStatus[] = ["PENDING", "APPROVED", "REJECTED"];

const statusColors: Record<PaymentProofStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600",
  APPROVED: "bg-green-500/10 text-green-600",
  REJECTED: "bg-red-500/10 text-red-600",
};

export default async function AdminPaymentProofsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "" } = await searchParams;

  const where =
    status && STATUSES.includes(status as PaymentProofStatus)
      ? { status: status as PaymentProofStatus }
      : undefined;

  const [proofs, counts] = await Promise.all([
    prisma.paymentProof.findMany({
      where,
      include: { order: { include: { user: true, product: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.paymentProof.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count.id]),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
          Payments
        </p>
        <h1 className="font-display text-3xl tracking-tight">Payment Proofs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {proofs.length} proof{proofs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Link
          href="/admin/payment-proofs"
          className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !status
              ? "bg-foreground text-background border-foreground"
              : "border-border/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({Object.values(countByStatus).reduce((a, b) => a + b, 0)})
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/payment-proofs?status=${s}`}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              status === s
                ? "bg-foreground text-background border-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {s} ({countByStatus[s] ?? 0})
          </Link>
        ))}
      </div>

      {proofs.length === 0 ? (
        <div className="rounded-2xl border border-border/60 py-16 text-center text-muted-foreground text-sm">
          No payment proofs found.
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">
                  From
                </th>
                <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">
                  Order
                </th>
                <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">
                  Attachments
                </th>
                <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-xs tracking-widest uppercase font-medium text-muted-foreground">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {proofs.map((proof) => (
                <tr
                  key={proof.id}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">{proof.order.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {proof.fromEmail}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/payment-proofs/${proof.id}`}
                      className="font-mono text-xs hover:text-primary transition-colors"
                    >
                      #{proof.orderId.slice(-8).toUpperCase()}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {proof.order.product.name}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span>
                      {formatNaira(proof.order.amountPaid)}
                    </span>
                    <span className="text-muted-foreground"> / {formatNaira(proof.order.totalAmount)}</span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {proof.attachmentUrls.length} file
                    {proof.attachmentUrls.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[proof.status]}`}
                    >
                      {proof.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {proof.createdAt.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
