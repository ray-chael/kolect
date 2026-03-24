"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // global-error replaces the root layout, so basic HTML is needed here
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "1rem",
          textAlign: "center",
          background: "#fff",
          color: "#0a0a0a",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#e11d48"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginBottom: "1.5rem" }}
          aria-hidden="true"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: "0 0 0.75rem" }}>
          A critical error occurred
        </h1>
        <p style={{ color: "#6b7280", maxWidth: "28rem", margin: "0 0 2rem" }}>
          We&apos;re sorry — something went wrong at the application level. Please try refreshing.
          {error.digest && (
            <span style={{ display: "block", marginTop: "0.25rem", fontSize: "0.75rem", color: "#9ca3af" }}>
              Reference: {error.digest}
            </span>
          )}
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.25rem",
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              padding: "0.5rem 1.25rem",
              background: "transparent",
              color: "#0a0a0a",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
