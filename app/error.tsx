"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-28 text-center">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-5">Error</p>
      <h1 className="text-2xl font-bold text-zinc-900 mb-3">Something went wrong</h1>
      <p className="text-zinc-500 text-sm mb-10">
        An unexpected error occurred. Try refreshing the page.
      </p>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={reset}
          className="text-sm text-brand hover:underline transition-colors"
        >
          Try again
        </button>
        <span className="text-zinc-300">·</span>
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          Go home
        </Link>
      </div>
    </div>
  );
}
