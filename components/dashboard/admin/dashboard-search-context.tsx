"use client";

import { createContext, useContext, useMemo, useState } from "react";

type DashboardSearchValue = {
  query: string;
  setQuery: (query: string) => void;
};

const DashboardSearchContext = createContext<DashboardSearchValue | null>(null);

/**
 * Holds the dashboard's local filter text.
 *
 * The header search and the activity table sit in different branches of the
 * grid, so the state is shared through context rather than by lifting it into
 * the page. That keeps the page itself a server component: the chart cards are
 * passed through as children and are not re-rendered on every keystroke.
 *
 * TODO: Replace with Supabase-backed dashboard data. The query never leaves the
 * browser today.
 */
export function DashboardSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  const value = useMemo(() => ({ query, setQuery }), [query]);

  return (
    <DashboardSearchContext.Provider value={value}>
      {children}
    </DashboardSearchContext.Provider>
  );
}

export function useDashboardSearch() {
  const value = useContext(DashboardSearchContext);

  if (!value) {
    throw new Error(
      "useDashboardSearch must be used inside a DashboardSearchProvider.",
    );
  }

  return value;
}
