import type { ReactNode } from "react";
import { PaletteHost } from "@/components/features/palette-trigger";
import { SaveDialogHost } from "@/components/features/save-dialog-host";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/toaster";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="pb-32 outline-none lg:pb-16">
        {children}
      </main>
      <MobileTabBar />
      <PaletteHost />
      <SaveDialogHost />
      <Toaster />
    </>
  );
}
