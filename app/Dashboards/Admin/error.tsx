"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto w-full max-w-5xl rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-foreground">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2">Could not load admin portal.</p>
      <button
        className="mt-4 rounded-lg bg-destructive/20 px-4 py-2 font-medium text-destructive-foreground transition-colors outline-none hover:bg-destructive/30 focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={retry}
        type="button"
      >
        Try again
      </button>
    </section>
  );
}

