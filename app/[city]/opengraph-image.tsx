import { ImageResponse } from "next/og";
import richmondhillData from "@/data/cities/richmond-hill.json";
import newmarketData from "@/data/cities/newmarket.json";
import markhamData from "@/data/cities/markham.json";
import vaughanData from "@/data/cities/vaughan.json";
import oakvilleData from "@/data/cities/oakville.json";

export const runtime = "edge";
export const alt = "City guide on CityRoots";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CITY_DATA: Record<string, { cityName: string; province: string; places: unknown[] }> = {
  "richmond-hill": richmondhillData,
  "newmarket": newmarketData,
  "markham": markhamData,
  "vaughan": vaughanData,
  "oakville": oakvilleData,
};

export default async function OgImage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = await params;
  const data = CITY_DATA[cityId];

  const cityName = data?.cityName ?? "City Guide";
  const province = data?.province ?? "Canada";
  const placeCount = data?.places.length ?? 0;
  const freeCount = (data?.places as Array<{ isFree?: boolean }>)?.filter((p) => p.isFree).length ?? 0;

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
          justifyContent: "space-between",
          padding: "72px 100px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#4F7C5F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ color: "white", fontSize: 20 }}>🌿</div>
          </div>
          <span style={{ fontSize: 22, fontWeight: 600, color: "#71717a" }}>CityRoots</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 16, color: "#4F7C5F", fontWeight: 600, letterSpacing: "1.5px" }}>
            {province.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#18181b",
              lineHeight: 1.0,
              letterSpacing: "-2px",
            }}
          >
            {cityName}
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: "#18181b" }}>{placeCount}</span>
              <span style={{ fontSize: 16, color: "#71717a" }}>places</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: "#4F7C5F" }}>{freeCount}</span>
              <span style={{ fontSize: 16, color: "#71717a" }}>free</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: "#18181b" }}>10</span>
              <span style={{ fontSize: 16, color: "#71717a" }}>categories</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {["#059669","#7c3aed","#0284c7","#d97706","#9333ea","#e11d48","#ea580c","#57534e","#0d9488","#db2777"].map((color) => (
            <div
              key={color}
              style={{ width: 14, height: 14, borderRadius: "50%", background: color, opacity: 0.85 }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
