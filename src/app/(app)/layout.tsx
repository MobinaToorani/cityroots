import type { ReactNode } from "react";
import { PaletteHost } from "@/components/features/palette-trigger";
import { PlacePreviewHost } from "@/components/features/place-preview-host";
import { SaveDialogHost } from "@/components/features/save-dialog-host";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/toaster";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
      <MobileTabBar />
      <PaletteHost />
      <SaveDialogHost />
      <PlacePreviewHost />
      <Toaster />
    </>
  );
}
