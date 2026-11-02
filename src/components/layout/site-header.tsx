import { PaletteTrigger } from "@/components/features/command-palette";
import { Logo } from "./logo";
import { PrimaryNavLinks } from "./nav-link";

/** Floating glass header for marketing and guide pages. */
export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="pointer-events-auto mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 rounded-full pr-2 pl-4 glass-strong">
        <Logo />
        <div className="flex items-center gap-2">
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            <PrimaryNavLinks variant="header" />
          </nav>
          <PaletteTrigger compact />
        </div>
      </div>
    </header>
  );
}
