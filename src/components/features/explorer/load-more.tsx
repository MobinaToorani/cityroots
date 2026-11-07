"use client";

import { buttonClasses } from "@/components/ui/button";
import { useExplorer } from "./explorer-state";

type LoadMoreProps = { shown: number; total: number; pageSize: number };

/**
 * A real form button that loads the next page, which also works without
 * JavaScript. It never loads on its own: that would keep the footer out of reach.
 */
export function LoadMore({ shown, total, pageSize }: LoadMoreProps) {
  const remaining = total - shown;
  const { state, setState, isPending } = useExplorer();
  const next = state.page + 1;

  const hidden: Record<string, string> = {
    city: state.city ?? "",
    cat: state.cat.join(","),
    cost: state.cost.join(","),
    type: state.type.join(","),
    q: state.q,
    sort: state.sort === "relevance" ? "" : state.sort,
    view: state.view === "list" ? "" : state.view,
    picks: state.picks ? "true" : "",
    open: state.open ? "true" : "",
    bbox: state.bbox?.join(",") ?? "",
  };

  return (
    <form
      action="/explore"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        void setState({ page: next });
      }}
      className="mt-8 grid justify-items-center gap-2"
    >
      {Object.entries(hidden)
        .filter(([, v]) => v)
        .map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      <input type="hidden" name="page" value={next} />
      <p className="text-meta text-text-muted">
        Showing {shown} of {total}
      </p>
      <button type="submit" disabled={isPending} className={buttonClasses("secondary")}>
        {isPending ? "Loading more" : `Show ${Math.min(pageSize, remaining)} more`}
      </button>
    </form>
  );
}
