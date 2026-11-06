import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Thanks for your suggestion", robots: { index: false } };

export default async function ThanksPage(props: PageProps<"/submit/thanks">) {
  const { type } = await props.searchParams;
  const correction = type === "correction";
  return (
    <div className="flex min-h-[80svh] items-center justify-center px-5 pt-10 pb-16">
      <EmptyState
        icon={CircleCheck}
        headingLevel="h1"
        title={correction ? "Thanks, your correction is in" : "Thanks, your suggestion is in"}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href="/explore" size="sm">
              Keep exploring
            </ButtonLink>
            <ButtonLink href="/submit" variant="secondary" size="sm">
              Suggest another place
            </ButtonLink>
          </div>
        }
      >
        A curator will check it before it goes live, usually within a week. If you left an email, we
        will let you know when it has been reviewed.
      </EmptyState>
    </div>
  );
}
