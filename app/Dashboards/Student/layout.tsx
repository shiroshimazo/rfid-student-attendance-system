import { InactivityGuard } from "@/components/auth/InactivityGuard";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InactivityGuard>
      <div className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8 dark:bg-zinc-950 dark:text-zinc-50">
        <header className="mx-auto mb-6 w-full max-w-5xl">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            Student portal
          </p>
        </header>
        <main>{children}</main>
      </div>
    </InactivityGuard>
  );
}
