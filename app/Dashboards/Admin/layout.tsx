import { AdminShell } from "@/components/dashboard/AdminShell";
import { InactivityGuard } from "@/components/auth/InactivityGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InactivityGuard>
      <AdminShell>{children}</AdminShell>
    </InactivityGuard>
  );
}
