import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const usingPglite = !process.env.DATABASE_URL;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  // Only /embed/* may be framed (by partners); everything else refuses framing.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    formats: ["image/avif", "image/webp"],
    // 60 for full-bleed heroes (LCP), 75 for everything else.
    qualities: [60, 75],
  },
  // PGlite is a single-process database. Build with one worker so static
  // generation never opens the local data directory twice.
  experimental: usingPglite ? { cpus: 1, workerThreads: false } : {},
  async headers() {
    return [
      { source: "/((?!embed/).*)", headers: securityHeaders },
      {
        // Partner widgets: any site may frame them. Nothing on these pages
        // changes state, and they open CityRoots in a new tab for anything else.
        source: "/embed/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

// Guides are MDX bodies imported by /guides/[slug]; their metadata is typed in TypeScript.
const withMDX = createMDX({});

export default withMDX(nextConfig);
