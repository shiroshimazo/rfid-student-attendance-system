type RoutePlaceholderProps = {
  title: string;
  description: string;
};

export function RoutePlaceholder({
  title,
  description,
}: RoutePlaceholderProps) {
  return (
    <section className="mx-auto w-full max-w-5xl rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        RFID Student Attendance System
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {description}
      </p>
    </section>
  );
}

