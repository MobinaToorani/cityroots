import type { ReactNode } from "react";

/** Crossfade with a 12px rise on every navigation inside the app. */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
