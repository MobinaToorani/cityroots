import type { ReactNode } from "react";

/** Partner widgets: no header, footer, navigation, or global dialogs. */
export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      {children}
    </main>
  );
}
