import { ProfileAdd } from "iconsax-reactjs";

import { BentoCard } from "@/components/dashboard/BentoCard";
import {
  STUDENTS_DEMO_NOW,
  type Student,
} from "@/lib/mock-data/students";

type RecentlyAddedCardProps = {
  students: Student[];
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function relativeAddedTime(createdAt: string, now: number): string {
  const minutes = Math.max(
    0,
    Math.round((now - Date.parse(createdAt)) / 60_000),
  );

  if (minutes <= 0) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function RecentlyAddedCard({ students }: RecentlyAddedCardProps) {
  const recent = [...students]
    .sort(
      (left, right) =>
        Date.parse(right.createdAt) - Date.parse(left.createdAt) ||
        left.studentId.localeCompare(right.studentId),
    )
    .slice(0, 3);
  const displayNow = Math.max(
    Date.parse(STUDENTS_DEMO_NOW),
    ...recent.map((student) => Date.parse(student.createdAt)),
  );

  return (
    <BentoCard
      title="Recently Added"
      description="Latest student profiles"
      headingLevel="h2"
      contentClassName="flex flex-col"
    >
      {recent.length === 0 ? (
        <div className="flex min-h-44 flex-1 flex-col items-center justify-center gap-2 text-center">
          <ProfileAdd size={20} aria-hidden="true" className="text-muted-foreground" />
          <p className="text-sm font-medium text-card-foreground">
            No students added yet
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-border/60">
          {recent.map((student) => (
            <li key={student.id} className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-xs font-medium text-muted-foreground"
              >
                {initialsOf(student.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-card-foreground">
                  {student.name}
                </p>
                <p className="mt-0.5 truncate text-[0.6875rem] tabular-nums text-muted-foreground">
                  {student.studentId} · {student.section}
                </p>
              </div>
              <time
                dateTime={student.createdAt}
                className="shrink-0 text-[0.6875rem] tabular-nums text-muted-foreground"
              >
                {relativeAddedTime(student.createdAt, displayNow)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </BentoCard>
  );
}
