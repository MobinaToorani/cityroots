"use client";

import { Clock, Compass, MapPin, Search, Shapes, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CostBadge } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import type { SearchHit, SearchResults } from "@/lib/data/search";
import { cn } from "@/lib/cn";
import { exploreHref } from "@/lib/domain/explore-params";
import { logger } from "@/lib/logger";

const OPEN_EVENT = "cityroots:open-palette";

const RECENT_KEY = "cityroots:recent-searches";
const MAX_RECENT = 5;

type Option = { key: string; hit: SearchHit | null; href: Route; label: string; detail: string };

function hrefFor(hit: SearchHit): Route {
  if (hit.kind === "city") return `/city/${hit.slug}` as Route;
  if (hit.kind === "category") return exploreHref({ cat: [hit.slug] });
  return `/places/${hit.id}` as Route;
}

function toOption(hit: SearchHit): Option {
  const key = hit.kind === "place" ? `place:${hit.id}` : `${hit.kind}:${hit.slug}`;
  return { key, hit, href: hrefFor(hit), label: hit.name, detail: hit.detail };
}

function readRecent(): SearchHit[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as SearchHit[]).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(hit: SearchHit) {
  try {
    const key = toOption(hit).key;
    const next = [hit, ...readRecent().filter((h) => toOption(h).key !== key)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch (error) {
    // Private mode or storage full: recents are a convenience only.
    logger.warn("Could not save recent search", { error });
  }
}

const ICONS = { city: MapPin, category: Shapes, place: Compass } as const;

/**
 * Opens the palette. A link to the explorer, so it still goes somewhere useful
 * without JavaScript.
 */
export function PaletteTrigger({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/explore"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        window.dispatchEvent(new Event(OPEN_EVENT));
      }}
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "motion-press inline-flex h-10 items-center gap-2 rounded-full text-meta font-semibold text-text-muted hover:text-text",
        compact
          ? "w-10 justify-center hover:bg-divider/60"
          : "border border-divider bg-surface-solid/60 px-3.5",
        className,
      )}
    >
      <Icon icon={Search} size={16} />
      <span className={compact ? "sr-only" : undefined}>Search</span>
      {!compact && (
        <kbd className="ml-auto hidden rounded-md border border-divider px-1.5 font-sans text-[0.75rem] lg:inline">
          Ctrl K
        </kbd>
      )}
    </Link>
  );
}

/** Cmd+K / Ctrl+K search across cities, categories, and places. Mounted once, in the root layout. */
export function CommandPalette() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [recent, setRecent] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function open() {
    setRecent(readRecent());
    setQuery("");
    setResults(null);
    setError(null);
    setActive(0);
    dialog.current?.showModal();
    input.current?.focus();
  }

  // Global shortcut, and clicks on any trigger.
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, open);
    };
  }, []);

  // Debounced search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const body = (await res.json()) as SearchResults | { error: string };
        if ("error" in body) {
          setError(body.error);
          setResults(null);
        } else {
          setError(null);
          setResults(body);
          setActive(0);
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError("Search is not working right now. Try the explorer instead.");
        void e;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const searching = query.trim().length >= 2;
  const groups: { title: string; options: Option[] }[] = searching
    ? [
        { title: "Places", options: (results?.places ?? []).map(toOption) },
        { title: "Cities", options: (results?.cities ?? []).map(toOption) },
        { title: "Categories", options: (results?.categories ?? []).map(toOption) },
      ]
    : [{ title: "Recent", options: recent.map(toOption) }];
  if (searching) {
    groups.push({
      title: "Everything",
      options: [
        {
          key: "all",
          hit: null,
          href: exploreHref({ q: query.trim() }),
          label: `Search all listings for "${query.trim()}"`,
          detail: "Open the explorer",
        },
      ],
    });
  }
  const flat = groups.flatMap((g) => g.options);
  const visibleGroups = groups.filter((g) => g.options.length > 0);

  function choose(option: Option | undefined) {
    if (!option) return;
    if (option.hit) saveRecent(option.hit);
    dialog.current?.close();
    router.push(option.href);
  }

  function onInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(flat[active]);
    }
  }

  const activeKey = flat[active]?.key;
  const optionId = (key: string) => `${listId}-${key.replace(/[^a-z0-9-]/gi, "-")}`;
  const noResults = searching && !loading && results && flat.length === 1;

  return (
    <>
      <dialog
        ref={dialog}
        aria-label="Search CityRoots"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
        className="palette m-auto mt-[12vh] w-[min(640px,calc(100vw-1.5rem))] rounded-[var(--radius-modal)] p-0 text-text glass-strong backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 border-b border-divider px-4">
          <Icon icon={Search} className="shrink-0 text-text-muted" />
          <input
            ref={input}
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeKey ? optionId(activeKey) : undefined}
            aria-label="Search places, cities, and categories"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search places, cities, and categories"
            autoComplete="off"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close search"
            className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-divider/60"
          >
            <Icon icon={X} size={16} />
          </button>
        </div>

        <div className="max-h-[min(60vh,480px)] overflow-y-auto p-2">
          <ul id={listId} role="listbox" aria-label="Results" className="grid gap-1">
            {visibleGroups.map((group) => (
              <li key={group.title} role="presentation">
                <p
                  className="px-3 pt-2 pb-1 text-meta font-semibold text-text-muted"
                  aria-hidden="true"
                >
                  {group.title}
                </p>
                <ul role="group" aria-label={group.title}>
                  {group.options.map((option) => {
                    const isActive = option.key === activeKey;
                    const kind = option.hit?.kind;
                    return (
                      <li
                        key={option.key}
                        id={optionId(option.key)}
                        role="option"
                        aria-selected={isActive}
                        onPointerMove={() => setActive(flat.indexOf(option))}
                        onClick={() => choose(option)}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5",
                          isActive && "bg-divider/70 ring-1 ring-divider",
                        )}
                      >
                        <Icon
                          icon={!searching ? Clock : kind ? ICONS[kind] : Search}
                          className="shrink-0 text-text-muted"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{option.label}</span>
                          <span className="block truncate text-meta text-text-muted">
                            {option.detail}
                          </span>
                        </span>
                        {option.hit?.kind === "place" && <CostBadge band={option.hit.costBand} />}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
          <p
            role="status"
            aria-live="polite"
            className="px-3 py-3 text-meta text-text-muted empty:hidden"
          >
            {error ??
              (noResults
                ? "No close matches. Try a shorter word, or search all listings."
                : !searching && recent.length === 0
                  ? "Type a place, a city, or something to do, like library or skating."
                  : "")}
          </p>
        </div>
      </dialog>
    </>
  );
}
