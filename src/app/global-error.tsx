"use client";

import { ErrorPanel } from "@/components/features/error-panel";
import "./globals.css";

export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-CA">
      <body>
        <main id="main">
          <ErrorPanel {...props} />
        </main>
      </body>
    </html>
  );
}
