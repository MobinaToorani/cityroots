import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

/** Shared by every opengraph-image route. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#141412";
const BG = "#f7f6f2";
const MUTED = "#5f5b54";
const FREE = "#186b45";

let fonts: Promise<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]> | null =
  null;

function loadFonts() {
  fonts ??= Promise.all(
    [
      ["Fraunces", "Fraunces-500.ttf", 500],
      ["Instrument Sans", "InstrumentSans-400.ttf", 400],
      ["Instrument Sans", "InstrumentSans-600.ttf", 600],
    ].map(async ([name, file, weight]) => ({
      name: name as string,
      data: await readFile(path.join(process.cwd(), "assets/fonts", file as string)),
      weight: weight as 400 | 500 | 600,
      style: "normal" as const,
    })),
  );
  return fonts;
}

/** A photo from /public, cropped to the card and inlined, so rendering needs no network. */
async function photoDataUrl(publicPath: string): Promise<string | null> {
  try {
    const jpeg = await sharp(path.join(process.cwd(), "public", publicPath))
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover" })
      .jpeg({ quality: 72 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

function Wordmark({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "#1e4d36",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 14, height: 20, borderRadius: 999, background: "#cfe6d6" }} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color }}>CityRoots</div>
    </div>
  );
}

function fitTitle(title: string): number {
  if (title.length > 60) return 60;
  if (title.length > 40) return 72;
  return 88;
}

/** A photo card: cities, guides, and the site default. */
export async function photoCard(input: {
  photo: string | null;
  eyebrow: string;
  title: string;
  detail: string;
}): Promise<ImageResponse> {
  const [src, fontData] = await Promise.all([
    input.photo ? photoDataUrl(input.photo) : Promise.resolve(null),
    loadFonts(),
  ]);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#1e4d36",
        fontFamily: "Instrument Sans",
      }}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser
        <img
          src={src}
          alt=""
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: OG_SIZE.width,
            height: OG_SIZE.height,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.1))",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: 64,
        }}
      >
        <Wordmark color="#ffffff" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 30, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
            {input.eyebrow}
          </div>
          <div
            style={{
              fontFamily: "Fraunces",
              fontSize: fitTitle(input.title),
              lineHeight: 1.05,
              color: "#ffffff",
              letterSpacing: -1.5,
            }}
          >
            {input.title}
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.9)" }}>{input.detail}</div>
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: await fontData },
  );
}

/** A listing card: places have no photos yet, so the category color carries it. */
export async function placeCard(input: {
  name: string;
  where: string;
  cost: string;
  free: boolean;
  category: string;
  accent: string;
}): Promise<ImageResponse> {
  const fontData = await loadFonts();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: BG,
        fontFamily: "Instrument Sans",
      }}
    >
      <div style={{ height: 18, background: input.accent, display: "flex" }} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 64px 64px",
        }}
      >
        <Wordmark color={INK} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontFamily: "Fraunces",
              fontSize: fitTitle(input.name),
              lineHeight: 1.05,
              color: INK,
              letterSpacing: -1.5,
            }}
          >
            {input.name}
          </div>
          <div style={{ fontSize: 32, color: MUTED }}>{input.where}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                padding: "10px 24px",
                borderRadius: 999,
                color: input.free ? FREE : INK,
                background: input.free ? "rgba(30,122,70,0.14)" : "rgba(20,20,18,0.07)",
              }}
            >
              {input.cost}
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                padding: "10px 24px",
                borderRadius: 999,
                color: INK,
                background: "rgba(20,20,18,0.07)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 999, background: input.accent }} />
              {input.category}
            </div>
          </div>
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: await fontData },
  );
}
