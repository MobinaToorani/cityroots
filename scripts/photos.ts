/**
 * Prepares photography for the site.
 *   tsx scripts/photos.ts <source-dir>   resize originals into public/
 *   tsx scripts/photos.ts                 regenerate the manifest only
 * The manifest (src/content/photos.json) holds dimensions, a blur
 * placeholder, and attribution for every photo, read by <Photo>.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";

const credit = z.object({
  sourceFile: z.string(),
  title: z.string(),
  artist: z.string(),
  license: z.string(),
  licenseUrl: z.string().nullish(),
  source: z.url(),
});
const credits = z
  .record(z.string(), credit)
  .parse(JSON.parse(readFileSync("scripts/seed-data/photo-credits.json", "utf8")));

async function main() {
  const sourceDir = process.argv[2];
  const manifest: Record<string, unknown> = {};
  for (const [publicPath, c] of Object.entries(credits)) {
    const target = path.join("public", publicPath);
    if (sourceDir) {
      mkdirSync(path.dirname(target), { recursive: true });
      await sharp(path.join(sourceDir, c.sourceFile))
        .rotate()
        .resize({ width: 2400, withoutEnlargement: true })
        .jpeg({ quality: 76, mozjpeg: true })
        .toFile(target);
    }
    const image = sharp(target);
    const { width, height } = await image.metadata();
    const blur = await image.clone().resize(16).jpeg({ quality: 50 }).toBuffer();
    manifest[publicPath] = {
      width,
      height,
      blurDataURL: `data:image/jpeg;base64,${blur.toString("base64")}`,
      credit: {
        artist: c.artist,
        license: c.license,
        licenseUrl: c.licenseUrl ?? null,
        source: c.source,
      },
    };
    console.log(`${publicPath} ${width}x${height}`);
  }
  mkdirSync("src/content", { recursive: true });
  writeFileSync("src/content/photos.json", `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
