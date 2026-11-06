"use client";

import { Check, ChevronDown } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { chipClasses } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

type FilterDropdownProps = {
  /** Names the menu for assistive technology, like "City" or "Cost". */
  label: string;
  /** What the closed button shows. Defaults to the label. */
  summary?: ReactNode;
  /** Highlights the button when this facet narrows the results. */
  active?: boolean;
  /** Dropdowns sharing a name close each other: only one is open at a time. */
  name?: string;
  align?: "start" | "end";
  children: ReactNode;
};

/**
 * A compact filter menu built on <details>, so it opens and every option still
 * works without JavaScript. With JavaScript, Escape and a click outside close it.
 *
 * On phones the panel spans the nearest positioned ancestor (give the filter
 * row `relative`), so it never runs off the screen; from `sm` up it sits under
 * its own button.
 */
export function FilterDropdown({
  label,
  summary,
  active = false,
  name,
  align = "start",
  children,
}: FilterDropdownProps) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onPointerDown = (e: PointerEvent) => {
      if (el.open && !el.contains(e.target as Node)) el.open = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !el.open) return;
      e.preventDefault();
      el.open = false;
      el.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} name={name} className="group sm:relative">
      <summary
        className={cn(
          chipClasses(active, "cursor-pointer list-none gap-1.5 pr-2.5 select-none"),
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        {summary ?? label}
        <Icon
          icon={ChevronDown}
          size={16}
          className="transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div
        role="group"
        aria-label={label}
        className={cn(
          "menu-panel absolute inset-x-0 top-full z-40 mt-2 max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain rounded-2xl border border-divider bg-surface-solid p-1.5 shadow-[var(--shadow-lift)]",
          "sm:inset-x-auto sm:w-72",
          align === "end" ? "sm:right-0" : "sm:left-0",
        )}
      >
        {children}
      </div>
    </details>
  );
}

type FilterOptionProps = {
  href: Route;
  selected: boolean;
  /** "single" closes the menu after a choice; "multi" keeps it open for more. */
  mode: "single" | "multi";
  /** Category colour dot. */
  accent?: string;
  /** Optimistic update instead of navigating. Modified clicks still open the link. */
  onSelect?: () => void;
  children: ReactNode;
};

/** One choice in a FilterDropdown. A real link, so each state is a shareable URL. */
export function FilterOption({
  href,
  selected,
  mode,
  accent,
  onSelect,
  children,
}: FilterOptionProps) {
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (mode === "single") e.currentTarget.closest("details")?.removeAttribute("open");
    if (onSelect) {
      e.preventDefault();
      onSelect();
    }
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      scroll={false}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-body outline-none hover:bg-bg focus-visible:bg-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
        selected && "font-semibold",
      )}
    >
      {mode === "multi" ? (
        <span
          aria-hidden="true"
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-md border",
            selected ? "border-ink bg-ink text-on-ink" : "border-text-muted",
          )}
        >
          {selected && <Icon icon={Check} size={16} />}
        </span>
      ) : (
        <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center">
          {selected && <Icon icon={Check} size={16} />}
        </span>
      )}
      {accent && (
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
      )}
      <span className="min-w-0 flex-1">{children}</span>
    </Link>
  );
}

/** A "Clear" link at the foot of a multi-select menu. */
export function FilterMenuFooter({ children }: { children: ReactNode }) {
  return <div className="mt-1 border-t border-divider px-1 pt-1.5 pb-0.5">{children}</div>;
}
