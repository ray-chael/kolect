"use client";

import { useState, useTransition } from "react";
import { confirmReceipt } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ConfirmReceiptButtonProps {
  orderId: string;
}

export function ConfirmReceiptButton({ orderId }: ConfirmReceiptButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmReceipt(orderId);
      if (result.success) {
        toast.success(result.message);
        setConfirmed(true);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <span>✓</span>
        <span>Receipt confirmed</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConfirm}
      disabled={isPending}
      className="w-full rounded-xl"
    >
      {isPending ? "Confirming…" : "I have received my order"}
    </Button>
  );
}
