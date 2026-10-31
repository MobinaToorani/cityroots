import type { ReactNode } from "react";
import { CommandPalette } from "@/components/features/command-palette";
import { SaveDialogHost } from "@/components/features/save-dialog-host";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
      <MobileTabBar />
      <CommandPalette />
      <SaveDialogHost />
    </>
  );
}
