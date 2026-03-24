import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 proxy — replaces middleware.ts
 * Handles rate limiting, auth redirects, and security headers.
 */

// ---------------------------------------------------------------------------
// In-memory sliding-window rate limiter for auth endpoints.
// Note: per Edge runtime instance. For multi-region, replace with Upstash Redis.
// ---------------------------------------------------------------------------
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10; // max attempts per window per IP

type WindowEntry = { count: number; resetAt: number };
const store = new Map<string, WindowEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

const AUTH_PATHS = [
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/forget-password",
  "/api/auth/reset-password",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate-limit auth endpoints
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        },
      );
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  // Better Auth uses "better-auth.session_token" on HTTP and
  // "__Secure-better-auth.session_token" on HTTPS (e.g. Vercel).
  const hasSession =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token");

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/profile")
  ) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Admin route check
  if (pathname.startsWith("/admin")) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Role check happens in server actions/components — proxy only checks session exists
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)).*)",
  ],
};
