import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Check your email", robots: { index: false } };

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-[90svh] items-center justify-center px-5 pt-28 pb-16 color-field">
      <EmptyState
        icon={MailCheck}
        title="Check your email"
        action={
          <ButtonLink href="/explore" variant="secondary" size="sm">
            Keep browsing meanwhile
          </ButtonLink>
        }
      >
        We sent you a sign-in link. It works once and expires in 24 hours. If it is not there in a
        minute, check your spam folder.
      </EmptyState>
    </div>
  );
}
