import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ACTIVITY_QUERY_PREFIXES = [
  ["my-activities"],
  ["cadre-today-activities"],
  ["cadre-month-activities"],
  ["cadre-recent-5"],
  ["cadre-last7-trend"],
  ["admin-activities-list"],
  ["dash-stats-raw"],
  ["rpt-activity"],
  ["rpt-cp-act"],
  ["rpt-bp-act"],
  ["public-dashboard-data"],
];

export function invalidateActivityQueries(queryClient: QueryClient) {
  ACTIVITY_QUERY_PREFIXES.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}

export function useActivityCacheSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = supabase
      .channel("activity-cache-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => invalidateActivityQueries(queryClient),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
