import { Compass } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5">
      <Logo />
      <EmptyState
        icon={Compass}
        title="We could not find that page"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href="/explore" size="sm">
              Explore places
            </ButtonLink>
            <ButtonLink href="/" variant="secondary" size="sm">
              Go to the home page
            </ButtonLink>
          </div>
        }
      >
        The link may be old, or the listing may have moved. Everything else is still here.
      </EmptyState>
    </main>
  );
}
