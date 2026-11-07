import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icon";

/** The way back up, above a page's title. */
export function BackLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="touch-target relative mb-5 inline-flex items-center gap-1.5 text-meta font-semibold text-text-muted quiet-link"
    >
      <Icon icon={ArrowLeft} size={16} />
      {children}
    </Link>
  );
}
