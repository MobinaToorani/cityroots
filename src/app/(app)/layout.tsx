import type { ReactNode } from "react";
import { AppRail } from "@/components/layout/app-rail";
import { Logo } from "@/components/layout/logo";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh color-field">
      <AppRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center px-5 lg:hidden">
          <Logo />
        </header>
        <main id="main" tabIndex={-1} className="flex-1 pb-32 outline-none lg:pb-12">
          {children}
        </main>
      </div>
      <MobileTabBar hideFrom="lg" />
    </div>
  );
}
