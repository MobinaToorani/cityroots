import { ViewTransition, type ReactNode } from "react";

/**
 * Crossfade between app pages. View transitions run only on navigation, so
 * the first page load paints immediately (fading in from transparent cost
 * about 100 ms of TBT and 350 ms of LCP; see DECISIONS.md). default="none"
 * keeps filter updates within a page from crossfading.
 */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
