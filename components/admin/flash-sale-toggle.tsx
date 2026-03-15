"use client";

import { useTransition } from "react";
import { toggleFlashSale } from "@/actions/flash-sales";
import { toast } from "sonner";

export function FlashSaleToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFlashSale(id, !isActive);
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
    >
      {isPending ? "…" : isActive ? "Pause" : "Enable"}
    </button>
  );
}
