import { Logo } from "./logo";
import { PrimaryNavLinks } from "./nav-link";

/** Persistent left rail for the app on desktop. */
export function AppRail() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 p-4 lg:flex">
      <div className="flex h-full flex-col gap-8 rounded-[var(--radius-modal)] p-4 glass">
        <Logo className="px-2 pt-1" />
        <nav aria-label="Primary" className="flex flex-col gap-1">
          <PrimaryNavLinks variant="rail" />
        </nav>
        <p className="mt-auto px-2 text-meta text-text-muted">
          Free to browse. Free things first. Nobody pays for placement.
        </p>
      </div>
    </aside>
  );
}
