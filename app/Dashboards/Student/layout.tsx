import { StudentShell } from "@/components/dashboard/StudentShell";
import { InactivityGuard } from "@/components/auth/InactivityGuard";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InactivityGuard>
      <StudentShell>{children}</StudentShell>
    </InactivityGuard>
  );
}
