"use client";

import { useQueryStates } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
  type TransitionStartFunction,
} from "react";
import { exploreParsers, type ExploreState } from "@/lib/domain/explore-params";

type PendingContextValue = { isPending: boolean; startTransition: TransitionStartFunction };

const PendingContext = createContext<PendingContextValue | null>(null);

/**
 * Explorer state lives in the URL. Updates are optimistic: controls reflect the
 * new state at once while the server renders the new results in a transition.
 */
export function ExplorerProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return (
    <NuqsAdapter>
      <PendingContext.Provider value={{ isPending, startTransition }}>
        {children}
      </PendingContext.Provider>
    </NuqsAdapter>
  );
}

export function useExplorerPending(): boolean {
  return useContext(PendingContext)?.isPending ?? false;
}

export function useExplorer() {
  const ctx = useContext(PendingContext);
  if (!ctx) throw new Error("useExplorer must be used inside ExplorerProvider");
  const [state, setState] = useQueryStates(exploreParsers, {
    shallow: false,
    scroll: false,
    clearOnDefault: true,
    startTransition: ctx.startTransition,
  });

  /** Any filter change starts again from the first page and clears the selection. */
  const update = useCallback(
    (patch: Partial<ExploreState>) => setState({ page: null, place: null, ...patch }),
    [setState],
  );

  /** Changes that should not re-query the server, such as selecting a pin. */
  const [, setShallow] = useQueryStates(exploreParsers, {
    shallow: true,
    scroll: false,
    clearOnDefault: true,
  });

  return { state, update, setState, setShallow, isPending: ctx.isPending };
}

export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
