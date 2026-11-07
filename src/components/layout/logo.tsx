import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="10" fill="#1E4D36" />
      <path
        d="M16 7c4.6 2.2 6.6 6 5.6 10.4-.7 3-2.8 5-5.6 5.6-2.8-.6-4.9-2.6-5.6-5.6C9.4 13 11.4 9.2 16 7Z"
        fill="#8FCBA7"
      />
      <path
        d="M16 11v15m0-4-3.5 3.5M16 19l3.5 3.5"
        stroke="#F4F2ED"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      // On every page, so prefetching would add the home page's code to each one's script budget.
      prefetch={false}
      className={cn(
        "touch-target relative inline-flex items-center gap-2.5 rounded-control",
        className,
      )}
    >
      <LogoMark />
      <span className="text-[17px] font-bold tracking-tight">CityRoots</span>
    </Link>
  );
}
