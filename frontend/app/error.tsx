"use client";

import { ErrorNotice } from "@/components/ui/Notice";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex-1 px-5 py-8 lg:px-10">
      <div className="mx-auto max-w-[860px]">
        <ErrorNotice error={error} onRetry={reset} />
      </div>
    </section>
  );
}
