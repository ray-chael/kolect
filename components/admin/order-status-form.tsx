"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "PAID", label: "Paid" },
  { value: "PROCURED", label: "Procured" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

interface AdminOrderStatusFormProps {
  orderId: string;
  currentStatus: string;
}

export function AdminOrderStatusForm({
  orderId,
  currentStatus,
}: AdminOrderStatusFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [trackingNote, setTrackingNote] = useState("");

  function handleSubmit() {
    if (!status) {
      toast.error("Please select a status");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("orderId", orderId);
      formData.set("status", status);
      if (riderName) formData.set("riderName", riderName);
      if (riderPhone) formData.set("riderPhone", riderPhone);
      if (trackingNote) formData.set("trackingNote", trackingNote);

      const result = await updateOrderStatus(formData);
      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
        setStatus("");
        setRiderName("");
        setRiderPhone("");
        setTrackingNote("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Update
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Current status: {currentStatus}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">New status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
              <SelectTrigger className="w-full rounded-xl text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === "DISPATCHED" && (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Rider name</Label>
                <Input
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  placeholder="Rider name"
                  className="rounded-xl text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Rider phone</Label>
                <Input
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  placeholder="08012345678"
                  className="rounded-xl text-sm"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Note (optional)</Label>
            <Input
              value={trackingNote}
              onChange={(e) => setTrackingNote(e.target.value)}
              placeholder="Any tracking or status note"
              className="rounded-xl text-sm"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isPending || !status}
            size="sm"
            className="w-full rounded-xl"
          >
            {isPending ? "Updating…" : "Update status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
