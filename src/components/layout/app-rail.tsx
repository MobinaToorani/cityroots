import Link from "next/link";
import { PaletteTrigger } from "@/components/features/command-palette";
import { Logo } from "./logo";
import { PrimaryNavLinks } from "./nav-link";

/** Persistent left rail for the app on desktop. */
export function AppRail() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 p-4 lg:flex">
      <div className="flex h-full flex-col gap-8 rounded-[var(--radius-modal)] p-4 glass">
        <Logo className="px-2 pt-1" />
        <PaletteTrigger />
        <nav aria-label="Primary" className="flex flex-col gap-1">
          <PrimaryNavLinks variant="rail" />
        </nav>
        <Link
          href="/submit"
          className="mt-auto px-2 text-meta font-semibold text-primary-text quiet-link"
        >
          Suggest a place
        </Link>
        <p className="px-2 text-meta text-text-muted">
          Free to browse. Free things first. Nobody pays for placement.
        </p>
      </div>
    </aside>
  );
}
