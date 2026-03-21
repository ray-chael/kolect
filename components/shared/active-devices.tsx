"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { revokeSession, revokeAllOtherSessions } from "@/actions/sessions";
import type { SessionInfo } from "@/actions/sessions";

// ─── User-agent parsing helpers ───────────────────────────────────────────────

function parseBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  if (/MSIE|Trident/.test(ua)) return "Internet Explorer";
  return "Unknown browser";
}

function parseOS(ua: string): string {
  if (/Windows NT 10/.test(ua)) return "Windows 10/11";
  if (/Windows NT 6\.3/.test(ua)) return "Windows 8.1";
  if (/Windows NT 6\.1/.test(ua)) return "Windows 7";
  if (/Windows/.test(ua)) return "Windows";
  if (/iPhone OS/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown OS";
}

function DeviceIcon({ ua }: { ua: string | null }) {
  const isMobile =
    ua !== null && /iPhone|iPad|Android|Mobile/.test(ua);

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary"
      aria-hidden
    >
      {isMobile ? (
        // phone icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
          />
        </svg>
      ) : (
        // monitor icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"
          />
        </svg>
      )}
    </div>
  );
}

function RevokeButton({
  sessionId,
  onDone,
}: {
  sessionId: string;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    startTransition(async () => {
      const result = await revokeSession(sessionId);
      if (result.success) {
        toast.success("Session revoked");
        onDone();
      } else {
        toast.error(result.message ?? "Failed to revoke session");
      }
    });
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={isPending}
      className="text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 cursor-pointer"
    >
      {isPending ? "Revoking…" : "Revoke"}
    </button>
  );
}

interface ActiveDevicesProps {
  sessions: SessionInfo[];
}

export function ActiveDevices({ sessions: initialSessions }: ActiveDevicesProps) {
  // We rely on revalidatePath in the server action + React's re-render —
  // no local state needed for the list itself.
  const [isPending, startTransition] = useTransition();

  function handleRevokeAll() {
    startTransition(async () => {
      const result = await revokeAllOtherSessions();
      if (result.success) {
        toast.success("All other sessions revoked");
      } else {
        toast.error(result.message ?? "Failed");
      }
    });
  }

  const others = initialSessions.filter((s) => !s.isCurrent);

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
          Active Sessions
        </h2>
        {others.length > 0 && (
          <button
            onClick={handleRevokeAll}
            disabled={isPending}
            className="text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Revoking…" : "Revoke all other sessions"}
          </button>
        )}
      </div>

      {/* Session list */}
      <ul className="divide-y divide-border/40 -mx-6">
        {initialSessions.map((s) => {
          const ua = s.userAgent ?? "";
          const browser = ua ? parseBrowser(ua) : "Unknown browser";
          const os = ua ? parseOS(ua) : "Unknown OS";

          const signedInAt = new Intl.DateTimeFormat("en-NG", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(s.createdAt));

          return (
            <li
              key={s.id}
              className="flex items-center gap-4 px-6 py-4"
            >
              <DeviceIcon ua={s.userAgent} />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {browser}
                  {" — "}
                  <span className="text-muted-foreground font-normal">{os}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Signed in {signedInAt}
                  {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                </p>
              </div>

              <div className="shrink-0">
                {s.isCurrent ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    This device
                  </span>
                ) : (
                  <RevokeButton
                    sessionId={s.id}
                    onDone={() => {}}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {initialSessions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No active sessions found.
        </p>
      )}
    </section>
  );
}
