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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Prevent dark mode flash — runs before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()` }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
