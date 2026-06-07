import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CityRoots — Local guides for real life.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#FAFAF8",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 100px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#4F7C5F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ color: "white", fontSize: 24 }}>🌿</div>
          </div>
          <span style={{ fontSize: 28, fontWeight: 600, color: "#18181b", letterSpacing: "-0.5px" }}>
            CityRoots
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#18181b",
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
            maxWidth: 800,
            marginBottom: 28,
          }}
        >
          Local guides for real life.
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: 26,
            color: "#71717a",
            maxWidth: 720,
            lineHeight: 1.5,
          }}
        >
          Parks, cafes, events, programs, and community resources — organized by every part of daily life.
        </div>

        {/* Category dots */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 60,
          }}
        >
          {[
            "#059669", "#7c3aed", "#0284c7", "#d97706", "#9333ea",
            "#e11d48", "#ea580c", "#57534e", "#0d9488", "#db2777",
          ].map((color) => (
            <div
              key={color}
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: color,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
