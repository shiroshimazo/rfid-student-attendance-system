import { TeacherShell } from "@/components/dashboard/TeacherShell";
import { InactivityGuard } from "@/components/auth/InactivityGuard";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InactivityGuard>
      <TeacherShell>{children}</TeacherShell>
    </InactivityGuard>
  );
}
