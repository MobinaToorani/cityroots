import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signInWithGoogle } from "./actions";
import { SignInForm } from "./signin-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { googleSignInAvailable } from "@/lib/auth";
import { emailSignInAvailable } from "@/lib/auth/email";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { currentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  Verification: "That sign-in link has expired or was already used. Ask for a new one below.",
  OAuthAccountNotLinked:
    "That email already signs in another way. Use the email link to get in, then you are all set.",
};

export default async function SignInPage(props: PageProps<"/signin">) {
  const params = await props.searchParams;
  const callbackUrl = safeRedirectPath(params.callbackUrl);
  if (await currentUser()) redirect(callbackUrl as Route);
  const errorCode = typeof params.error === "string" ? params.error : null;
  const errorMessage = errorCode
    ? (ERRORS[errorCode] ?? "Something went wrong signing you in. Try again.")
    : null;

  return (
    <div className="flex min-h-[90svh] items-center justify-center px-5 pt-10 pb-16">
      <Card className="w-full max-w-md rounded-[var(--radius-modal)] p-6 sm:p-8">
        <h1 className="page-title">Sign in to CityRoots</h1>
        <p className="mt-2 text-body text-text-muted">
          You do not need an account to browse. Sign in to save places and manage your plan.
        </p>
        {errorMessage && (
          <p
            role="alert"
            className="mt-4 rounded-card bg-danger/10 px-4 py-3 text-meta font-medium text-danger"
          >
            {errorMessage}
          </p>
        )}
        <div className="mt-6 grid gap-4">
          {emailSignInAvailable() ? (
            <SignInForm callbackUrl={callbackUrl} />
          ) : (
            <p className="text-body text-text-muted">Email sign-in is temporarily unavailable.</p>
          )}
          {googleSignInAvailable() && (
            <>
              <div className="flex items-center gap-3 text-meta text-text-muted">
                <span className="h-px flex-1 bg-divider" />
                or
                <span className="h-px flex-1 bg-divider" />
              </div>
              <form action={signInWithGoogle}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <Button type="submit" variant="secondary" size="lg" className="w-full">
                  Continue with Google
                </Button>
              </form>
            </>
          )}
        </div>
        <p className="mt-6 text-meta text-text-muted">
          By signing in you agree to the{" "}
          <Link href="/terms" className="font-semibold text-text quiet-link">
            terms of use
          </Link>
          . The{" "}
          <Link href="/privacy" className="font-semibold text-text quiet-link">
            privacy policy
          </Link>{" "}
          explains what we keep.
        </p>
      </Card>
    </div>
  );
}
