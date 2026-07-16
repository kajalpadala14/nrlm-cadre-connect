/**
 * NRLM Reports API — Server Functions
 * File: src/lib/api/reports.functions.ts
 *
 * Generates exportable reports for district/block management.
 * Data is formatted for both display and CSV/Excel export.
 *
 * Report types:
 *  1. Monthly Attendance Report (per block or all blocks)
 *  2. Cadre Activity Performance Report
 *  3. Pending Approvals Summary
 *  4. Block-wise Coverage Report
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { requireStaffScope, resolveScopedBlockId } from "@/lib/api/access-scope";
import { ACTIVITY_TYPES, normalizeActivityType } from "@/constants/activityTypes";
import { groupByVillageKey } from "@/lib/utils/villages";

// ─── Guard helper ─────────────────────────────────────────────

// ─── REPORT 1: Monthly Attendance Report ─────────────────────
/**
 * Returns attendance data for all cadres in a given month.
 * Calls the `get_cadre_activity_report` PostgreSQL function.
 *
 * Returns an array suitable for CSV export:
 * [Cadre Name, Type, Block, Village, Present Days, Absent Days,
 *  Activities, Villages Covered, Pending Approvals, Approved]
 */
export const getMonthlyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        month: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
        block_id: z.string().uuid().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const scope = await requireStaffScope(supabase, userId);
    const effectiveBlockId = resolveScopedBlockId(scope, data.block_id ?? null);

    const [year, mon] = data.month.split("-").map(Number);
    const startDate = `${data.month}-01`;
    const endDate = new Date(year, mon, 0).toISOString().slice(0, 10);

    const { data: report, error } = await supabase.rpc("get_cadre_activity_report", {
      p_start_date: startDate,
      p_end_date: endDate,
      p_block_id: effectiveBlockId,
    });

    if (error) throw new Error(`Report error: ${error.message}`);

    return {
      report_type: "monthly_attendance",
      period: data.month,
      generated_at: new Date().toISOString(),
      rows: (report ?? []) as Array<{
        cadre_name: string;
        cadre_type: string;
        block_name: string;
        village: string;
        present_days: number;
        absent_days: number;
        activity_count: number;
        villages_covered: number;
        pending_approvals: number;
        approved_activities: number;
      }>,
    };
  });

// ─── REPORT 2: Activity Type Breakdown ───────────────────────
/**
 * Shows how many activities of each type were submitted
 * in a date range, grouped by block.
 *
 * Useful for understanding what work cadres are actually doing.
 */
export const getActivityTypeReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        block_id: z.string().uuid().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const scope = await requireStaffScope(supabase, userId);
    const effectiveBlockId = resolveScopedBlockId(scope, data.block_id ?? null);

    let query = supabase
      .from("activities")
      .select(
        `activity_type,
         blocks!activities_block_id_fkey(name),
         id`,
        { count: "exact" },
      )
      .gte("activity_date", data.from_date)
      .lte("activity_date", data.to_date);

    if (effectiveBlockId) {
      query = query.eq("block_id", effectiveBlockId);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(`Report error: ${error.message}`);

    // Aggregate in JS (could also be done in PostgreSQL)
    const grouped: Record<string, Record<string, number>> = {};
    for (const row of rows ?? []) {
      const blockName = (row.blocks as { name?: string } | null)?.name ?? "Unknown";
      const actType = normalizeActivityType(row.activity_type);
      if (!grouped[blockName]) grouped[blockName] = {};
      grouped[blockName][actType] = (grouped[blockName][actType] ?? 0) + 1;
    }

    const activityTypes = [...ACTIVITY_TYPES];

    const table = Object.entries(grouped).map(([block, counts]) => ({
      block_name: block,
      ...Object.fromEntries(activityTypes.map((t) => [t, counts[t] ?? 0])),
      total: Object.values(counts).reduce((s, c) => s + c, 0),
    }));

    return {
      report_type: "activity_type_breakdown",
      period: `${data.from_date} to ${data.to_date}`,
      generated_at: new Date().toISOString(),
      columns: ["block_name", ...activityTypes, "total"],
      rows: table,
    };
  });

// ─── REPORT 3: Pending Approvals Summary ─────────────────────
/**
 * How many activities are pending, grouped by block and cadre type.
 * Helps managers know where the approval backlog is biggest.
 */
export const getPendingApprovalsSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        block_id: z.string().uuid().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const scope = await requireStaffScope(supabase, userId);
    const effectiveBlockId = resolveScopedBlockId(scope, data.block_id ?? null);

    let query = supabase
      .from("activity_approvals")
      .select(
        `status,
         activities!inner(
           block_id, activity_date,
           blocks!activities_block_id_fkey(name),
           profiles!activities_cadre_id_fkey(cadre_type)
         )`,
      )
      .eq("status", "pending");

    if (effectiveBlockId) {
      query = query.eq("activities.block_id", effectiveBlockId);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(`Report error: ${error.message}`);

    // Group by block
    const blockCounts: Record<string, { block_name: string; pending: number }> = {};
    for (const row of rows ?? []) {
      const act = row.activities as {
        block_id?: string;
        blocks?: { name?: string } | null;
        profiles?: { cadre_type?: string } | null;
      } | null;
      const blockId = act?.block_id ?? "unknown";
      const blockName = act?.blocks?.name ?? "Unknown";
      if (!blockCounts[blockId]) {
        blockCounts[blockId] = { block_name: blockName, pending: 0 };
      }
      blockCounts[blockId].pending += 1;
    }

    return {
      report_type: "pending_approvals_summary",
      generated_at: new Date().toISOString(),
      total_pending: rows?.length ?? 0,
      by_block: Object.values(blockCounts),
    };
  });

// ─── REPORT 4: Cadre Coverage Report ─────────────────────────
/**
 * Shows which villages have been visited and by which cadres.
 * Useful for geographic coverage analysis.
 */
export const getCoverageReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        block_id: z.string().uuid().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const scope = await requireStaffScope(supabase, userId);
    const effectiveBlockId = resolveScopedBlockId(scope, data.block_id ?? null);

    let query = supabase
      .from("activities")
      .select(
        `village_name, activity_date, activity_type,
         blocks!activities_block_id_fkey(name),
         profiles!activities_cadre_id_fkey(full_name, cadre_type)`,
      )
      .gte("activity_date", data.from_date)
      .lte("activity_date", data.to_date)
      .order("village_name");

    if (effectiveBlockId) {
      query = query.eq("block_id", effectiveBlockId);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(`Report error: ${error.message}`);

    // Village coverage uses a normalized village key so spacing/case and known
    // spelling aliases do not inflate reached/covered counts.
    const villages = groupByVillageKey(rows ?? [], (r) => r.village_name);
    const villageStats = Array.from(villages.values()).map(({ displayName, rows: villageActivities }) => {
      return {
        village_name: displayName,
        visit_count: villageActivities.length,
        unique_cadres: new Set(
          villageActivities.map((r) => (r.profiles as { full_name?: string } | null)?.full_name),
        ).size,
        last_visited: villageActivities
          .map((r) => r.activity_date)
          .sort()
          .reverse()[0],
        block_name: (villageActivities[0]?.blocks as { name?: string } | null)?.name ?? "Unknown",
      };
    });

    return {
      report_type: "village_coverage",
      period: `${data.from_date} to ${data.to_date}`,
      generated_at: new Date().toISOString(),
      total_villages: villages.size,
      rows: villageStats,
    };
  });
