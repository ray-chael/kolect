const STEPS = [
  { key: "PLACED", label: "Order Placed" },
  { key: "PAID", label: "Paid" },
  { key: "PROCURED", label: "Procured" },
  { key: "DISPATCHED", label: "Dispatched" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "RECEIVED", label: "Received" },
] as const;

const STATUS_INDEX: Record<string, number> = {
  PENDING: 0,
  PARTIAL: 0,
  PAID: 1,
  PROCURED: 2,
  DISPATCHED: 3,
  DELIVERED: 4,
  RECEIVED: 5,
};

interface OrderStatusTimelineProps {
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  procuredAt: Date | null;
  deliveredAt: Date | null;
  receivedAt: Date | null;
}

export function OrderStatusTimeline({
  status,
  createdAt,
  completedAt,
  procuredAt,
  deliveredAt,
  receivedAt,
}: OrderStatusTimelineProps) {
  if (status === "CANCELLED" || status === "EXPIRED") {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-semibold tracking-tight mb-3">Order Status</h2>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            ✕
          </span>
          <div>
            <p className="text-sm font-medium">
              {status === "CANCELLED" ? "Cancelled" : "Expired"}
            </p>
            <p className="text-xs text-muted-foreground">
              This order is no longer active.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_INDEX[status] ?? 0;
  const timestamps: Record<string, Date | null> = {
    PLACED: createdAt,
    PAID: completedAt,
    PROCURED: procuredAt,
    DISPATCHED: null,
    DELIVERED: deliveredAt,
    RECEIVED: receivedAt,
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <h2 className="font-semibold tracking-tight mb-5">Order Status</h2>
      <div className="relative">
        {STEPS.map((step, i) => {
          const isCompleted = i <= currentIndex;
          const isCurrent = i === currentIndex;
          const isLast = i === STEPS.length - 1;
          const ts = timestamps[step.key];

          return (
            <div key={step.key} className="flex gap-4">
              {/* Vertical line + circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "border-2 border-border bg-background text-muted-foreground"
                  } ${isCurrent ? "ring-2 ring-primary/30 ring-offset-2 ring-offset-card" : ""}`}
                >
                  {isCompleted ? "✓" : i + 1}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 grow min-h-6 ${
                      i < currentIndex
                        ? "bg-primary"
                        : "bg-border"
                    }`}
                  />
                )}
              </div>

              {/* Label + timestamp */}
              <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                <p
                  className={`text-sm font-medium ${
                    isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                {isCompleted && ts && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(ts).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
