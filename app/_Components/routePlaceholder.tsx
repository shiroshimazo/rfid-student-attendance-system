type RoutePlaceholderProps = {
  title: string;
  description: string;
};

export function RoutePlaceholder({
  title,
  description,
}: RoutePlaceholderProps) {
  return (
    <section className="mx-auto w-full max-w-5xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        RFID Student Attendance System
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </section>
  );
}

