import { PrimaryNavLinks } from "./nav-link";

/** Bottom tab bar on small screens. Hidden where the desktop rail or header nav shows. */
export function MobileTabBar({ hideFrom = "md" }: { hideFrom?: "md" | "lg" }) {
  return (
    <nav
      aria-label="Primary"
      className={
        hideFrom === "lg"
          ? "fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
          : "fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      }
    >
      <div className="mx-auto flex max-w-md items-stretch gap-1 rounded-[var(--radius-modal)] p-1.5 glass-strong">
        <PrimaryNavLinks variant="tab" />
      </div>
    </nav>
  );
}
