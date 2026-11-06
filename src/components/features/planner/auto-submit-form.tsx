"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ComponentProps } from "react";
import type { Route } from "next";

/**
 * A plain GET form that re-plans as soon as an answer changes. Without
 * JavaScript it still works, using the button the page puts in a noscript.
 */
export function AutoSubmitForm({ children, ...props }: ComponentProps<"form">) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form
      {...props}
      aria-busy={pending}
      onChange={(e) => {
        const form = e.currentTarget;
        if (!form.checkValidity()) return;
        const query = new URLSearchParams();
        new FormData(form).forEach((value, key) => query.append(key, String(value)));
        start(() => router.replace(`/planner?${query.toString()}` as Route, { scroll: false }));
      }}
    >
      {children}
    </form>
  );
}
