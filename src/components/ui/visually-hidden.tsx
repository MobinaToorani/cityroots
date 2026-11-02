import type { ReactNode } from "react";

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

export function SkipLink({
  href = "#main",
  children = "Skip to content",
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={href}
      className="sr-only z-50 rounded-full bg-ink px-4 py-2 font-semibold text-on-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {children}
    </a>
  );
}
