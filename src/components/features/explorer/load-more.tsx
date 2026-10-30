"use client";

import { useEffect, useRef } from "react";
import { useExplorer } from "./explorer-state";

type LoadMoreProps = { remaining: number; pageSize: number };

/**
 * A real form button that loads the next page, which also works without
 * JavaScript. With JavaScript it also loads automatically near the end of the list.
 */
export function LoadMore({ remaining, pageSize }: LoadMoreProps) {
  const { state, setState, isPending } = useExplorer();
  const ref = useRef<HTMLFormElement>(null);
  const next = state.page + 1;

  useEffect(() => {
    const el = ref.current;
    if (!el || isPending) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void setState({ page: next });
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [next, isPending, setState]);

  const hidden: Record<string, string> = {
    city: state.city ?? "",
    cat: state.cat.join(","),
    cost: state.cost.join(","),
    type: state.type.join(","),
    q: state.q,
    sort: state.sort === "relevance" ? "" : state.sort,
    view: state.view === "list" ? "" : state.view,
    picks: state.picks ? "true" : "",
    bbox: state.bbox?.join(",") ?? "",
  };

  return (
    <form
      ref={ref}
      action="/explore"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        void setState({ page: next });
      }}
      className="mt-8 flex justify-center"
    >
      {Object.entries(hidden)
        .filter(([, v]) => v)
        .map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      <input type="hidden" name="page" value={next} />
      <button
        type="submit"
        disabled={isPending}
        className="motion-press h-11 rounded-full px-6 font-semibold glass hover:bg-surface-strong active:translate-y-px disabled:opacity-60"
      >
        {isPending ? "Loading more" : `Show ${Math.min(pageSize, remaining)} more`}
      </button>
    </form>
  );
}
