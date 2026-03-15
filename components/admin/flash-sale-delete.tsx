"use client";

import { useTransition } from "react";
import { deleteFlashSale } from "@/actions/flash-sales";
import { toast } from "sonner";

export function FlashSaleDelete({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Delete this flash sale? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteFlashSale(id);
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success("Flash sale deleted");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-destructive/70 hover:text-destructive transition-colors disabled:opacity-50"
    >
      {isPending ? "…" : "Delete"}
    </button>
  );
}
