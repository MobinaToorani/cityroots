/**
 * Public base URL. Safe in both server and client code.
 *
 * NEXT_PUBLIC_SITE_URL wins. Without it, Vercel deployments use the URLs Vercel
 * exposes itself (the production domain, or the preview deployment's own URL),
 * so share links, OG images, and the sitemap never point at localhost.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercelHost =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
      ? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      : process.env.NEXT_PUBLIC_VERCEL_URL;
  return vercelHost ? `https://${vercelHost}` : "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}
