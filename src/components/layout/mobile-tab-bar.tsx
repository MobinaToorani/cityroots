import { PrimaryNavLinks } from "./nav-link";

/** Bottom tab bar on phones. */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-surface-solid pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        <PrimaryNavLinks variant="tab" />
      </div>
    </nav>
  );
}
