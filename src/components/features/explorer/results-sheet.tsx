"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useExplorer } from "./explorer-state";
import { cn } from "@/lib/cn";

const SNAPS = ["peek", "half", "full"] as const;
type Snap = (typeof SNAPS)[number];

const OFFSET: Record<Snap, string> = {
  peek: "calc(100% - 9.5rem)",
  half: "45%",
  full: "0%",
};

const LABEL: Record<Snap, string> = {
  peek: "Show more results",
  half: "Expand results",
  full: "Show the map",
};

/**
 * On small screens, results sit in a bottom sheet over the full-screen map and
 * snap between peek, half, and full. On large screens it is a plain column.
 */
export function ResultsSheet({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<Snap>("half");
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<{ y: number; height: number } | null>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const { state } = useExplorer();
  const [lastPlace, setLastPlace] = useState(state.place);

  // Selecting a pin drops the sheet so the place card and map stay visible.
  if (lastPlace !== state.place) {
    setLastPlace(state.place);
    if (state.place) setSnap("peek");
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    start.current = { y: e.clientY, height: sheet.current?.offsetHeight ?? 1 };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (start.current) setDrag(e.clientY - start.current.y);
  }
  function onPointerUp(e: PointerEvent<HTMLButtonElement>) {
    const s = start.current;
    start.current = null;
    if (!s || drag === null || Math.abs(drag) < 8) {
      setDrag(null);
      return;
    }
    // Pick the nearest snap point to where the sheet was released.
    const current = { peek: s.height - 152, half: s.height * 0.45, full: 0 }[snap];
    const released = current + (e.clientY - s.y);
    const targets: [Snap, number][] = [
      ["full", 0],
      ["half", s.height * 0.45],
      ["peek", s.height - 152],
    ];
    const nearest = targets.reduce((a, b) =>
      Math.abs(b[1] - released) < Math.abs(a[1] - released) ? b : a,
    );
    setSnap(nearest[0]);
    setDrag(null);
  }

  const next = SNAPS[(SNAPS.indexOf(snap) + 1) % SNAPS.length] ?? "half";

  return (
    <div
      ref={sheet}
      style={{
        transform:
          drag !== null
            ? `translateY(calc(${OFFSET[snap]} + ${drag}px))`
            : `translateY(${OFFSET[snap]})`,
      }}
      className={cn(
        "fixed inset-x-0 top-[6dvh] bottom-0 z-30 flex flex-col rounded-t-[var(--radius-modal)] glass-strong",
        drag === null && "transition-transform duration-250 ease-[var(--ease-out-expo)]",
        "lg:static lg:z-auto lg:block lg:![transform:none] lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-none lg:transition-none",
      )}
    >
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => drag === null && setSnap(next)}
        aria-expanded={snap !== "peek"}
        aria-label={LABEL[snap]}
        className="flex h-8 w-full shrink-0 touch-none items-center justify-center lg:hidden"
      >
        <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-text-muted/50" />
      </button>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-32 lg:overflow-visible lg:px-0 lg:pb-0">
        {children}
      </div>
    </div>
  );
}
