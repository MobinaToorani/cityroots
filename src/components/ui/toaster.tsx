"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Toast = {
  id: number;
  message: string;
  action?: { label: string; href: Route } | { label: string; onClick: () => void };
};

const EVENT = "cityroots:toast";
let nextId = 1;

export function toast(message: string, action?: Toast["action"]) {
  window.dispatchEvent(
    new CustomEvent<Toast>(EVENT, { detail: { id: nextId++, message, action } }),
  );
}

/** One short message at a time. Announced politely to screen readers. */
export function Toaster() {
  const [current, setCurrent] = useState<Toast | null>(null);
  // An open modal dialog paints over the page and makes it inert, so a toast
  // raised from inside one has to appear inside it.
  const [modal, setModal] = useState<Element | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      setCurrent((e as CustomEvent<Toast>).detail);
      setModal(document.querySelector("dialog[open]"));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCurrent(null), 4000);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const region = (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-6"
    >
      {current && (
        <div
          key={current.id}
          className="toast pointer-events-auto flex items-center gap-4 rounded-control bg-ink py-2.5 pr-3 pl-5 text-meta font-semibold text-on-ink shadow-[var(--shadow-lift)]"
        >
          {current.message}
          {current.action &&
            ("href" in current.action ? (
              <Link
                href={current.action.href}
                className="rounded-control px-2 py-1 underline underline-offset-4"
              >
                {current.action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={current.action.onClick}
                className="rounded-control px-2 py-1 underline underline-offset-4"
              >
                {current.action.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
  return modal?.isConnected ? createPortal(region, modal) : region;
}
