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
    <section className="mx-auto w-full max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-50">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2">Could not load admin portal.</p>
      <button
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800"
        onClick={retry}
        type="button"
      >
        Try again
      </button>
    </section>
  );
}

