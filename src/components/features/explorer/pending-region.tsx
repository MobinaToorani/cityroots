"use client";

import type { ReactNode } from "react";
import { useExplorerPending } from "./explorer-state";
import { cn } from "@/lib/cn";

/** Dims results while the next set loads, instead of a spinner or skeleton. */
export function PendingRegion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pending = useExplorerPending();
  return (
    <div
      aria-busy={pending}
      className={cn(
        "transition-opacity duration-200",
        pending && "pointer-events-none opacity-55",
        className,
      )}
    >
      {children}
    </div>
  );
}
