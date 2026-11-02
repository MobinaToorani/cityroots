"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Friendly error state for route boundaries. The server already logged the
 * failure; the digest lets support match a report to the log entry.
 */
export function ErrorPanel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    document.title = "Something went wrong | CityRoots";
  }, []);
  return (
    <div className="flex min-h-[60svh] items-center justify-center px-5 py-24">
      <EmptyState
        icon={RefreshCw}
        title="Something went wrong on our side"
        action={<Button onClick={reset}>Try again</Button>}
      >
        This page did not load. Trying again usually fixes it.
        {error.digest && <span className="mt-2 block text-meta">Reference: {error.digest}</span>}
      </EmptyState>
    </div>
  );
}
