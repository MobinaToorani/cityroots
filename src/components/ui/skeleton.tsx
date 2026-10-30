import { cn } from "@/lib/cn";

/** Static placeholder block. No pulsing: loading states stay calm. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("rounded-xl bg-divider/60", className)} />;
}
