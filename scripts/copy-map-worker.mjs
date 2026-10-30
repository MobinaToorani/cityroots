// Copies MapLibre's web worker into public/, versioned, because the bundler
// cannot resolve the worker's import.meta.url. Runs before dev and build.
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("maplibre-gl/package.json");
const outDir = "public/maplibre";
mkdirSync(outDir, { recursive: true });
for (const file of readdirSync(outDir)) rmSync(`${outDir}/${file}`);
copyFileSync(
  "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs",
  `${outDir}/maplibre-gl-worker-${version}.mjs`,
);
