import type { Metadata, Viewport } from "next";
import { Newsreader, Schibsted_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@/components/features/analytics";
import { SkipLink } from "@/components/ui/visually-hidden";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  axes: ["opsz"],
  // Display type never blocks or re-paints the largest contentful paint:
  // if the font is not ready almost immediately, the fallback serif stays.
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "CityRoots: free and low-cost things to do in the GTA and Waterloo Region",
    template: "%s | CityRoots",
  },
  description:
    "Find free and affordable places, programs, and events across nine Ontario cities. Every listing shows what it costs. Free things come first, and nobody pays for placement.",
  openGraph: { type: "website", siteName: "CityRoots", locale: "en_CA" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F6F7" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1319" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-CA" className={`${schibsted.variable} ${newsreader.variable}`}>
      <body className="min-h-dvh">
        <SkipLink />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
