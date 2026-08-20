"use client";

import { StatusPageClient } from "@/components/pages/status-page-client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusPageClient
      variant="serverError"
      onRetry={reset}
      digest={error.digest}
    />
  );
}
