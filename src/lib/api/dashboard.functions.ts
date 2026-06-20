/**
 * NRLM Dashboard Stats API — Server Functions
 * File: src/lib/api/dashboard.functions.ts
 *
 * Calls the PostgreSQL aggregate functions we created in the migration.
 * These are fast because all heavy computation happens inside Postgres,
 * not in JavaScript.
 *
 * Usage in a component:
 *   import { getDashboardStats } from "@/lib/api/dashboard.functions";
 *   const stats = await getDashboardStats({ data: { date: "2025-05-20" } });
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { requireStaffScope, resolveScopedBlockId } from "@/lib/api/access-scope";
import { calculateAttendanceRate } from "@/lib/utils/attendance";

// ─── GET DASHBOARD STATS ─────────────────────────────────────
/**
 * Returns the main KPI numbers for the dashboard header cards.
 * Calls the `get_dashboard_stats` PostgreSQL function.
 */
export const getDashboardStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        block_id: z.string().uuid().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const scope = await requireStaffScope(supabase, userId);
    const effectiveBlockId = resolveScopedBlockId(scope, data.block_id ?? null);

    const targetDate = data.date ?? new Date().toISOString().slice(0, 10);

    const { data: stats, error } = await supabase.rpc("get_dashboard_stats", {
      p_date: targetDate,
      p_block_id: effectiveBlockId,
    });

    if (error) throw new Error(`Dashboard stats error: ${error.message}`);
    
    // Override the raw Postgres attendance percentage with our unified TS logic
    const typedStats = stats as any;
    typedStats.attendance_pct = calculateAttendanceRate(
      typedStats.present_today ?? 0, 
      typedStats.on_leave_today ?? 0, 
      typedStats.total_cadres ?? 0
    );
    
    return typedStats as {
      total_cadres: number;
      present_today: number;
      absent_today: number;
      on_leave_today: number;
      activities_today: number;
      villages_today: number;
      pending_approvals: number;
      evidence_today: number;
      attendance_pct: number;
    };
  });

// ─── GET BLOCK SUMMARY TABLE ─────────────────────────────────
/**
 * Returns per-block breakdown for the "Block Wise Performance Table".
 * Calls the `get_block_attendance_summary` PostgreSQL function.
 */
export const getBlockSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const scope = await requireStaffScope(supabase, userId);

    const targetDate = data.date ?? new Date().toISOString().slice(0, 10);

    const { data: summary, error } = await supabase.rpc("get_block_attendance_summary", {
      p_date: targetDate,
    });

    if (error) throw new Error(`Block summary error: ${error.message}`);

    const rows = (summary ?? []).map((row: any) => ({
      ...row,
      attendance_pct: calculateAttendanceRate(
        row.present ?? 0,
        row.on_leave ?? 0,
        row.total_cadres ?? 0
      )
    })) as Array<{
      block_id: string;
      block_name: string;
      total_cadres: number;
      present: number;
      absent: number;
      on_leave: number;
      activities: number;
      villages: number;
      attendance_pct: number;
    }>;

    return scope.isAdmin ? rows : rows.filter((row) => row.block_id === scope.blockId);
  });

// ─── GET RECENT ACTIVITY FEED ────────────────────────────────
/**
 * Real-time feed of recent activity submissions and attendance marks.
 * Shown in the "Recent Activity" timeline widget.
 * Ordered by most recent first, limited to last 20 events.
 */
export const getRecentActivityFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        block_id: z.string().uuid().optional().nullable(),
        limit: z.number().int().min(1).max(50).default(20),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const scope = await requireStaffScope(supabase, userId).catch(() => null);
    const effectiveBlockId = scope
      ? resolveScopedBlockId(scope, data.block_id ?? null)
      : data.block_id ?? null;

    // For cadres, show only their own feed; for staff, show all
    let query = supabase
      .from("activities")
      .select(
        `id, activity_type, village_name, activity_date, submitted_at,
         status,
         profiles!activities_cadre_id_fkey(full_name, cadre_type),
         blocks!activities_block_id_fkey(name)`,
      )
      .order("submitted_at", { ascending: false })
      .limit(data.limit);

    if (!scope) {
      query = query.eq("cadre_id", userId);
    } else if (effectiveBlockId) {
      query = query.eq("block_id", effectiveBlockId);
    }

    const { data: feed, error } = await query;
    if (error) throw new Error(`Feed error: ${error.message}`);

    return (feed ?? []).map((item) => ({
      id: item.id,
      type: item.activity_type,
      village: item.village_name,
      date: item.activity_date,
      submitted_at: item.submitted_at,
      status: item.status,
      cadre_name: (item.profiles as { full_name?: string } | null)?.full_name ?? "Unknown",
      cadre_type: (item.profiles as { cadre_type?: string } | null)?.cadre_type ?? null,
      block_name: (item.blocks as { name?: string } | null)?.name ?? null,
    }));
  });

// ─── GET CADRE SELF SUMMARY ──────────────────────────────────
/**
 * A cadre's personal stats for the current month:
 * - Days present, absent, on leave
 * - Activities submitted
 * - Approved vs pending
 */
export const getMyCadreSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional(), // e.g. "2025-05"
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const today = new Date();
    const month =
      data.month ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const from = `${month}-01`;
    const to = `${month}-${new Date(
      parseInt(month.slice(0, 4)),
      parseInt(month.slice(5, 7)),
      0,
    ).getDate()}`;

    const [attResult, actResult] = await Promise.all([
      // Attendance counts
      supabase
        .from("attendance")
        .select("status")
        .eq("cadre_id", userId)
        .gte("date", from)
        .lte("date", to),
      // Activity counts
      supabase
        .from("activities")
        .select("id, status")
        .eq("cadre_id", userId)
        .gte("activity_date", from)
        .lte("activity_date", to),
    ]);

    const att = attResult.data ?? [];
    const act = actResult.data ?? [];

    return {
      month,
      present_days: att.filter((a) => a.status === "present").length,
      absent_days: att.filter((a) => a.status === "absent").length,
      leave_days: att.filter((a) => a.status === "on_leave").length,
      total_activities: act.length,
      approved_activities: act.filter((a) => a.status === "Approved").length,
      pending_activities: act.filter((a) => a.status === "Pending").length,
      rejected_activities: act.filter((a) => a.status === "Rejected").length,
    };
  });
