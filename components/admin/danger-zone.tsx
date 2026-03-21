"use client";

import { useState, useTransition } from "react";
import { getWipePreview, wipeTransactionalData, type WipePreview } from "@/actions/admin";
import { toast } from "sonner";

function WipePreviewRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-medium ${count > 0 ? "text-destructive" : "text-muted-foreground/50"}`}>
        {count.toLocaleString()}
      </span>
    </div>
  );
}

export function DangerZone() {
  const [preview, setPreview] = useState<WipePreview | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState<"idle" | "preview" | "confirm" | "done">("idle");
  const [isPending, startTransition] = useTransition();

  const CONFIRM_PHRASE = "DELETE ALL TEST DATA";

  function loadPreview() {
    startTransition(async () => {
      const result = await getWipePreview();
      if (result.success && result.data) {
        setPreview(result.data as WipePreview);
        setStep("preview");
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleWipe() {
    if (confirmText !== CONFIRM_PHRASE) {
      toast.error("Confirmation text does not match.");
      return;
    }
    startTransition(async () => {
      const result = await wipeTransactionalData(confirmText);
      if (result.success) {
        toast.success(result.message);
        setStep("done");
        setPreview(null);
        setConfirmText("");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.03] p-6 space-y-4">
      <div>
        <h3 className="font-display text-xl text-destructive tracking-tight">
          Danger Zone
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Wipe all transactional data to transition into live mode. Products,
          categories, and system settings will be preserved.
        </p>
      </div>

      {step === "idle" && (
        <button
          type="button"
          onClick={loadPreview}
          disabled={isPending}
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
        >
          {isPending ? "Loading…" : "Preview data to be deleted"}
        </button>
      )}

      {step === "preview" && preview && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-background divide-y divide-border/40 px-4">
            <WipePreviewRow label="Orders" count={preview.orders} />
            <WipePreviewRow label="Transactions" count={preview.transactions} />
            <WipePreviewRow label="Notifications" count={preview.notifications} />
            <WipePreviewRow label="Webhook logs" count={preview.webhookLogs} />
            <WipePreviewRow label="Cart items" count={preview.cartItems} />
            <WipePreviewRow label="Wishlist items" count={preview.wishlistItems} />
            <WipePreviewRow label="Product views" count={preview.productViews} />
            <WipePreviewRow label="Group buys" count={preview.groupBuys} />
            <WipePreviewRow label="Help me pay campaigns" count={preview.helpMePays} />
            <WipePreviewRow label="Support tickets" count={preview.supportTickets} />
            <WipePreviewRow label="Payment proofs" count={preview.paymentProofs} />
            <WipePreviewRow label="Order messages" count={preview.orderMessages} />
            <WipePreviewRow label="Campaign messages" count={preview.campaignMessages} />
            <WipePreviewRow label="Admin action log" count={preview.adminActions} />
          </div>

          <p className="text-xs text-muted-foreground">
            <strong>Kept:</strong> Users, products, categories, system settings,
            delivery addresses, pickup locations, and flash sales.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-destructive">
              Type{" "}
              <span className="font-mono bg-destructive/10 px-1 rounded">
                {CONFIRM_PHRASE}
              </span>{" "}
              to confirm deletion:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full rounded-lg border border-destructive/40 bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-destructive/30"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setStep("idle"); setConfirmText(""); setPreview(null); }}
              className="rounded-lg border border-border/60 px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleWipe}
              disabled={isPending || confirmText !== CONFIRM_PHRASE}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Deleting…" : "Delete all transactional data"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
          ✓ Data wiped successfully. You are now ready for live mode.
        </div>
      )}
    </div>
  );
}
