import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatNaira } from "@/lib/types";
import { ProofReviewActions } from "@/components/admin/proof-review-actions";

export const dynamic = "force-dynamic";

export default async function AdminPaymentProofPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const proof = await prisma.paymentProof.findUnique({
    where: { id },
    include: { order: { include: { user: true, product: true } } },
  });

  if (!proof) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          href="/admin/payment-proofs"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block"
        >
          ← Back to payment proofs
        </Link>
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
          Payment Proof
        </p>
        <h1 className="font-display text-2xl tracking-tight">
          Order #{proof.orderId.slice(-8).toUpperCase()}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {proof.order.product.name}
        </p>
      </div>

      {/* Order summary */}
      <div className="rounded-2xl border border-border/60 p-5 space-y-3 mb-6">
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          Order details
        </p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div>
            <p className="text-muted-foreground">Customer</p>
            <p className="font-medium">{proof.order.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {proof.order.user.email}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Submitted by</p>
            <p className="font-medium">{proof.fromEmail}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount paid</p>
            <p className="font-medium">{formatNaira(proof.order.amountPaid)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Order total</p>
            <p className="font-medium">{formatNaira(proof.order.totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Subject */}
      <div className="rounded-2xl border border-border/60 p-5 mb-6">
        <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
          Email subject
        </p>
        <p className="text-sm">{proof.subject}</p>
      </div>

      {/* Attachments */}
      {proof.attachmentUrls.length > 0 ? (
        <div className="rounded-2xl border border-border/60 p-5 mb-6 space-y-4">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            Attachments ({proof.attachmentUrls.length})
          </p>
          <div className="grid grid-cols-2 gap-4">
            {proof.attachmentUrls.map((url, i) => {
              const isPdf =
                url.toLowerCase().endsWith(".pdf") ||
                url.includes("/raw/");
              return isPdf ? (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border/60 p-4 text-sm hover:bg-muted/20 transition-colors"
                >
                  <span className="text-muted-foreground">📄</span>
                  <span>Attachment {i + 1}</span>
                </a>
              ) : (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border/60 overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={url}
                      alt={`Attachment ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 p-5 mb-6 text-center text-sm text-muted-foreground">
          No attachments uploaded.
        </div>
      )}

      {/* Review */}
      <div className="rounded-2xl border border-border/60 p-5 space-y-4">
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          Review
        </p>
        {proof.adminNotes && (
          <div className="rounded-lg bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Previous notes: {proof.adminNotes}
          </div>
        )}
        <ProofReviewActions
          proofId={proof.id}
          currentStatus={proof.status}
        />
      </div>
    </div>
  );
}
