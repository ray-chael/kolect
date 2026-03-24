import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ade's Kolekt — Pre-Order & Installment Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "linear-gradient(135deg, #0f0f11 0%, #1a1a1f 60%, #0d1117 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circle top-right */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.15)",
            filter: "blur(60px)",
          }}
        />
        {/* Decorative circle bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: 200,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(245,158,11,0.08)",
            filter: "blur(40px)",
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 28,
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 999,
            padding: "6px 16px",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#6366f1",
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#818cf8",
            }}
          >
            Curated &middot; Affordable &middot; Delivered
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "#f8fafc",
            marginBottom: 24,
            maxWidth: 800,
          }}
        >
          Premium Goods,{" "}
          <span style={{ color: "#6366f1" }}>Your Pace</span>
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: 26,
            color: "#94a3b8",
            maxWidth: 640,
            lineHeight: 1.5,
            marginBottom: 48,
          }}
        >
          Shop curated items, pay in installments, and get delivered to your door.
        </div>

        {/* Brand badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 900,
              color: "#fff",
            }}
          >
            K
          </div>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#e2e8f0",
              letterSpacing: "-0.02em",
            }}
          >
            Ade&apos;s Kolekt
          </span>
        </div>

        {/* Right decorative dots */}
        <div
          style={{
            position: "absolute",
            right: 80,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {Array.from({ length: 5 }).map((_, r) => (
            <div key={r} style={{ display: "flex", gap: 10 }}>
              {Array.from({ length: 5 }).map((_, c) => (
                <div
                  key={c}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "rgba(248,250,252,0.07)",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
