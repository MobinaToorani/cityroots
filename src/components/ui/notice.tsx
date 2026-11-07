import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Confirms something that just happened, at the top of the page it landed on. */
export function Notice({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p role="status" className={cn("rounded-card px-4 py-3 text-body card", className)}>
      {children}
    </p>
  );
}
