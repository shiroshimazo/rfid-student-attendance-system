"use client";

import { SearchNormal1 } from "iconsax-reactjs";

import { useDashboardSearch } from "@/components/dashboard/admin/dashboard-search-context";
import { Input } from "@/components/ui/input";

/**
 * Local filter for the Recent RFID Activity rows.
 *
 * TODO: Replace with Supabase-backed dashboard data. Nothing here leaves the
 * browser — the value lives in the dashboard search context and is read by the
 * activity table.
 */
export function DashboardSearch() {
  const { query, setQuery } = useDashboardSearch();

  return (
    <div className="relative w-full sm:w-72">
      <SearchNormal1
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
      />
      <label htmlFor="dashboard-search" className="sr-only">
        Search students, RFID and sections
      </label>
      <Input
        id="dashboard-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search students, RFID, sections..."
        className="h-9 pl-8"
      />
    </div>
  );
}
