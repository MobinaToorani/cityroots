import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable output for static exports if needed in future
  // output: "export",

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Image domains (for future remote images)
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
