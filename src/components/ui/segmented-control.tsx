"use client";

import type { Route } from "next";
import Link from "next/link";
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** When set, segments are real links (working without JavaScript); clicks still call onChange. */
  hrefFor?: (value: T) => Route;
  className?: string;
};

/**
 * Pill segmented control with a matte-black active segment that slides
 * between options. Radio-group semantics with arrow-key navigation.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  hrefFor,
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  useLayoutEffect(() => {
    const el = refs.current[activeIndex];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeIndex, options]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = (activeIndex + delta + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("relative inline-flex rounded-full p-1 glass", className)}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-full bg-ink transition-[left,width] duration-250 ease-[var(--ease-out-expo)]"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {options.map((option, i) => {
        const checked = option.value === value;
        const className = cn(
          "relative z-10 inline-flex h-9 items-center rounded-full px-4 text-meta font-semibold transition-colors duration-200",
          checked ? "text-on-ink" : "text-text-muted hover:text-text",
          !indicator && checked && "bg-ink",
        );
        const common = {
          role: "radio" as const,
          "aria-checked": checked,
          tabIndex: checked ? 0 : -1,
          className,
        };
        if (hrefFor) {
          return (
            <Link
              key={option.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              href={hrefFor(option.value)}
              scroll={false}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                onChange(option.value);
              }}
              {...common}
            >
              {option.label}
            </Link>
          );
        }
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            onClick={() => onChange(option.value)}
            {...common}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
