import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://cityroots.ca"),
  title: {
    default: "CityRoots",
    template: "%s / CityRoots",
  },
  description:
    "Free and affordable local resources: parks, cafes, events, community programs, and more, organized by every dimension of your life.",
  openGraph: {
    title: "CityRoots",
    description: "Local guides for real life.",
    type: "website",
    siteName: "CityRoots",
  },
  twitter: {
    card: "summary_large_image",
    title: "CityRoots",
    description: "Local guides for real life.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
