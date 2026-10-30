"use client";

import { ErrorPanel } from "@/components/features/error-panel";

export default function RouteError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel {...props} />;
}
