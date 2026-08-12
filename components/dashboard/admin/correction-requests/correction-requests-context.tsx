"use client";

import * as React from "react";

import {
  correctionRequests as seedRequests,
  requestActivity as seedActivity,
  type CorrectionRequest,
  type RequestActivityEvent,
} from "@/lib/mock-data/correction-requests";

/**
 * One store for the whole page. The summary cards, the table, the donut, the
 * activity feed and every drawer read the same array, so approving a request
 * updates all of them in the same pass.
 *
 * TODO: Replace mock state with Supabase correction requests. Approving and
 * rejecting stay in this provider today — nothing is written to a table, no
 * attendance record is edited, and no notification is sent.
 */
type CorrectionRequestsValue = {
  requests: CorrectionRequest[];
  activity: RequestActivityEvent[];
  approveRequest: (id: string) => void;
  rejectRequest: (id: string, reason: string) => void;
};

const CorrectionRequestsContext =
  React.createContext<CorrectionRequestsValue | null>(null);

/**
 * Stands in for the signed-in administrator on a review. Reading the real
 * identity is part of the backend work.
 */
const reviewerName = "Admin Salazar";

/**
 * The stamp written onto a request the moment it is reviewed. A live clock would
 * disagree between the server pass and the browser, and the demo only needs the
 * field to be filled in.
 */
const reviewedNowLabel = "Just now";

export function CorrectionRequestsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [requests, setRequests] = React.useState(seedRequests);
  const [activity, setActivity] = React.useState(seedActivity);

  // Feed rows need stable keys, and a counter gives them without a clock or a
  // random value that would differ between the two render passes.
  const eventCount = React.useRef(0);

  const recordActivity = React.useCallback(
    (kind: RequestActivityEvent["kind"], student: string) => {
      eventCount.current += 1;
      const event: RequestActivityEvent = {
        id: `ra-local-${eventCount.current}`,
        kind,
        student,
        minutesAgo: 0,
      };

      setActivity((previous) => [event, ...previous]);
    },
    [],
  );

  const approveRequest = React.useCallback(
    (id: string) => {
      // Resolved before the update rather than inside it: a state updater can be
      // invoked twice, and appending to the feed from there would double the row.
      const target = requests.find((request) => request.id === id);
      if (target === undefined || target.status !== "pending") {
        return;
      }

      setRequests((previous) =>
        previous.map((request) =>
          request.id === id
            ? {
                ...request,
                status: "approved",
                reviewedBy: reviewerName,
                reviewedAt: reviewedNowLabel,
                rejectionReason: null,
              }
            : request,
        ),
      );

      recordActivity("approved", target.student);
    },
    [requests, recordActivity],
  );

  const rejectRequest = React.useCallback(
    (id: string, reason: string) => {
      const trimmed = reason.trim();
      if (trimmed === "") {
        return;
      }

      const target = requests.find((request) => request.id === id);
      if (target === undefined || target.status !== "pending") {
        return;
      }

      setRequests((previous) =>
        previous.map((request) =>
          request.id === id
            ? {
                ...request,
                status: "rejected",
                reviewedBy: reviewerName,
                reviewedAt: reviewedNowLabel,
                rejectionReason: trimmed,
              }
            : request,
        ),
      );

      recordActivity("rejected", target.student);
    },
    [requests, recordActivity],
  );

  const value = React.useMemo<CorrectionRequestsValue>(
    () => ({ requests, activity, approveRequest, rejectRequest }),
    [requests, activity, approveRequest, rejectRequest],
  );

  return (
    <CorrectionRequestsContext.Provider value={value}>
      {children}
    </CorrectionRequestsContext.Provider>
  );
}

export function useCorrectionRequests(): CorrectionRequestsValue {
  const value = React.useContext(CorrectionRequestsContext);

  if (value === null) {
    throw new Error(
      "useCorrectionRequests must be used inside CorrectionRequestsProvider.",
    );
  }

  return value;
}
