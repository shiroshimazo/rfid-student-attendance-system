import { CorrectionRequestsBoard } from "@/components/dashboard/admin/correction-requests/CorrectionRequestsBoard";
import { CorrectionRequestsProvider } from "@/components/dashboard/admin/correction-requests/correction-requests-context";

export default function AdminCorrectionRequestsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="min-w-0">
        <h1 className="font-heading text-xl font-medium tracking-tight text-balance text-card-foreground">
          Correction Requests
        </h1>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          Review and manage attendance correction requests
        </p>
      </header>

      {/*
        The provider owns the requests and the activity feed for the whole page,
        so the summary cards, the table, the donut and every drawer move together
        when a request is approved or rejected.
      */}
      <CorrectionRequestsProvider>
        <CorrectionRequestsBoard />
      </CorrectionRequestsProvider>
    </div>
  );
}
