import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { SkipLink } from "@/components/ui/visually-hidden";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
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
    { media: "(prefers-color-scheme: light)", color: "#F4F2ED" },
    { media: "(prefers-color-scheme: dark)", color: "#0C120E" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-CA" className={`${instrument.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh">
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
