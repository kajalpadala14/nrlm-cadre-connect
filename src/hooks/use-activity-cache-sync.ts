import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const QUERY_PREFIXES = [
  ["activities"],
  ["admin-activities-list"],
  ["approvals-list"],
  ["att-detail"],
  ["attendance"],
  ["attendance-status"],
  ["cadre-last7-trend"],
  ["cadre-month-activities"],
  ["cadre-month-attendance"],
  ["cadre-notifications"],
  ["cadre-recent-5"],
  ["cadre-today-activities"],
  ["cadre-today-attendance"],
  ["cadres"],
  ["cadres-list"],
  ["dash-stats-raw"],
  ["evidence-gallery"],
  ["my-activities"],
  ["my-notifications-all"],
  ["my-notifications-raw"],
  ["pending-verifications"],
  ["profile"],
  ["public-dashboard-data"],
  ["rpt-activity"],
  ["rpt-attendance"],
  ["rpt-bp-act"],
  ["rpt-bp-att"],
  ["rpt-bp-profiles"],
  ["rpt-cp-act"],
  ["rpt-cp-att"],
  ["rpt-cp-profiles"],
  ["staff-list"],
];

const TABLES_TO_WATCH = [
  "activities",
  "activity_attendance_links",
  "activity_approvals",
  "attendance",
  "evidence_files",
  "notifications",
  "profiles",
  "user_roles",
];

export function invalidateConsistencyQueries(queryClient: QueryClient) {
  QUERY_PREFIXES.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}

export const invalidateActivityQueries = invalidateConsistencyQueries;

export function useUniversalConsistencySync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = supabase.channel(`universal-consistency-sync-${crypto.randomUUID()}`);
    TABLES_TO_WATCH.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => invalidateConsistencyQueries(queryClient),
      );
    });
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export const useActivityCacheSync = useUniversalConsistencySync;
