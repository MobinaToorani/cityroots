/**
 * Enforces the content and design hard rules (spec sections 3 and 7):
 *   - no em dash in user-facing copy (source and built output)
 *   - no animate-ping or pulsing indicators
 *   - no monospace fonts
 *   - no banned marketing phrases
 *   - no emoji in UI source
 * Run after `next build` to include the built HTML; source is always checked.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

type Rule = { name: string; pattern: RegExp };

const EM_DASH = "—";

const BANNED_PHRASES = [
  "seamless",
  "elevate",
  "unlock",
  "discover the power of",
  "one-stop shop",
  "revolutionize",
  "revolutionise",
  "game-changer",
  "game changer",
  "hidden gem",
  "in today's fast-paced world",
];

const SOURCE_RULES: Rule[] = [
  { name: "em dash", pattern: new RegExp(EM_DASH) },
  { name: "animate-ping", pattern: /animate-ping/ },
  { name: "pulsing loader", pattern: /animate-pulse/ },
  { name: "monospace font", pattern: /font-mono|monospace|Geist_?Mono|JetBrains/i },
  { name: "emoji", pattern: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u },
  { name: "TODO comment", pattern: /\b(TODO|FIXME|XXX)\b/ },
  { name: "lorem ipsum", pattern: /lorem ipsum/i },
];

const OUTPUT_RULES: Rule[] = [
  { name: "em dash", pattern: new RegExp(`${EM_DASH}|&mdash;|&#8212;|&#x2014;`, "i") },
  { name: "animate-ping", pattern: /animate-ping/ },
  { name: "monospace font", pattern: /font-family:[^;"}]*monospace/i },
  ...BANNED_PHRASES.map((p) => ({
    name: `banned phrase "${p}"`,
    pattern: new RegExp(`\\b${p}\\b`, "i"),
  })),
];

/** Files that legitimately name the banned patterns in order to enforce them. */
const ALLOWLIST = new Set(["src/lib/domain/copy.ts", "scripts/check-copy.ts"]);

function walk(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return walk(full, exts);
    return exts.some((e) => name.endsWith(e)) ? [full] : [];
  });
}

const failures: string[] = [];

function check(files: string[], rules: Rule[], extraSourceRules = false) {
  for (const file of files) {
    if (ALLOWLIST.has(file)) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const rule of rules) {
        if (rule.pattern.test(line)) failures.push(`${file}:${i + 1}  ${rule.name}`);
      }
      if (extraSourceRules) {
        for (const phrase of BANNED_PHRASES) {
          if (new RegExp(`\\b${phrase}\\b`, "i").test(line)) {
            failures.push(`${file}:${i + 1}  banned phrase "${phrase}"`);
          }
        }
      }
    });
  }
}

const sourceFiles = walk("src", [".ts", ".tsx", ".css", ".md", ".mdx", ".json"]);
check(sourceFiles, SOURCE_RULES, true);

const builtHtml = walk(".next/server/app", [".html", ".rsc"]);
check(builtHtml, OUTPUT_RULES);

if (failures.length > 0) {
  console.error(`Copy and design rules failed (${failures.length}):\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(
  `Copy and design rules passed: ${sourceFiles.length} source files` +
    (builtHtml.length
      ? `, ${builtHtml.length} built pages`
      : " (no build output found; run after next build to check it)"),
);
