"use client";

import { useEffect, useState, useTransition } from "react";
import {
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "@/actions/notifications";
import { Bell, CheckCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  message: string;
  orderId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
    new Date(date),
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getMyNotifications().then((res) => {
      if (res.success) setNotifications(res.data as Notification[]);
      setLoading(false);
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)),
    );
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-primary mb-1">
            Notifications
          </p>
          <h1 className="font-display text-3xl tracking-tight">
            Your notifications
          </h1>
          {!loading && unreadCount > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount} unread
            </p>
          )}
        </div>
        {!loading && unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              <Bell className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="text-base font-medium text-foreground">
              No notifications yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;ll be notified about your orders and campaigns here.
            </p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id}
              className={`flex gap-3 px-5 py-4 transition-colors ${
                i !== notifications.length - 1 ? "border-b border-border/40" : ""
              } ${!n.readAt ? "bg-primary/[0.03]" : ""}`}
            >
              {/* Dot */}
              <div className="mt-1.5 flex-shrink-0">
                {!n.readAt ? (
                  <span className="block h-2 w-2 rounded-full bg-primary" />
                ) : (
                  <span className="block h-2 w-2 rounded-full bg-transparent" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug ${
                    !n.readAt
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {n.message}
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground/70">
                    {relativeTime(n.createdAt)}
                  </span>
                  {n.orderId && (
                    <Link
                      href={`/orders/${n.orderId}`}
                      className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      View order <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                  {!n.readAt && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="text-[11px] text-muted-foreground/60 hover:text-primary transition-colors"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Back link */}
      {!loading && notifications.length > 0 && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Showing your last 30 notifications
        </p>
      )}
    </div>
  );
}
