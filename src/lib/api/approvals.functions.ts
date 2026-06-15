/**
 * NRLM Approvals API — Server Functions
 * File: src/lib/api/approvals.functions.ts
 *
 * Handles the approval workflow for activity submissions.
 * Only block_officer and admin roles can approve/reject.
 *
 * Flow:
 *   Cadre submits activity
 *     → trigger creates pending approval
 *       → block_officer reviews (approve / reject / request_revision)
 *         → activity_approval status updated
 *         → activities.approval_status synced
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase as browserClient } from "@/integrations/supabase/client";
import { z } from "zod";

// ─── Guard helper ─────────────────────────────────────────────
// Uses the same typed client instance from auth context
async function requireStaff(supabase: typeof browserClient, userId: string) {
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const isStaff = (roles ?? []).some((r) => r.role === "admin" || r.role === "block_officer");
  if (!isStaff) throw new Error("Forbidden: staff only");
}

// ─── GET PENDING APPROVALS ───────────────────────────────────
/**
 * Staff fetches a list of activities awaiting their review.
 * Optionally filter by block, date range, or status.
 */
export const getPendingApprovals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        block_id: z.string().uuid().optional(),
        from_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        to_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        status: z
          .enum(["pending", "approved", "rejected", "revision_requested"])
          .optional()
          .default("pending"),
        page: z.number().int().min(1).default(1),
        page_size: z.number().int().min(1).max(100).default(20),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireStaff(supabase, userId);

    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 8) + "01";
    const from = data.from_date ?? monthStart;
    const to = data.to_date ?? today;
    const offset = (data.page - 1) * data.page_size;

    let query = supabase
      .from("activity_approvals")
      .select(
        `id, status, remarks, reviewed_at, created_at,
         activities!inner(
           id, activity_date, activity_type, village_name, description,
           participants_count, photo_url, geolocation_lat, geolocation_lng,
           block_id, submitted_at,
           profiles!activities_cadre_id_fkey(full_name, cadre_type, village, phone),
           blocks!activities_block_id_fkey(name),
           evidence_files(id, public_url, file_name, mime_type)
         )`,
        { count: "exact" },
      )
      .eq("status", data.status)
      .gte("activities.activity_date", from)
      .lte("activities.activity_date", to)
      .order("created_at", { ascending: false })
      .range(offset, offset + data.page_size - 1);

    if (data.block_id) {
      query = query.eq("activities.block_id", data.block_id);
    }

    const { data: approvals, count, error } = await query;
    if (error) throw new Error(`Fetch error: ${error.message}`);

    return {
      approvals: approvals ?? [],
      total: count ?? 0,
      page: data.page,
      page_size: data.page_size,
    };
  });

// ─── REVIEW ACTIVITY (approve / reject / request revision) ───
/**
 * Staff submits their decision on an activity.
 * Updates both activity_approvals and activities.approval_status.
 */
export const reviewActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        approval_id: z.string().uuid(),
        action: z.enum(["approved", "rejected", "revision_requested"]),
        remarks: z.string().max(1000).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireStaff(supabase, userId);

    const now = new Date().toISOString();

    // Update the approval record
    const { data: approval, error: approvalErr } = await supabase
      .from("activity_approvals")
      .update({
        status: data.action,
        remarks: data.remarks ?? null,
        reviewer_id: userId,
        reviewed_at: now,
      })
      .eq("id", data.approval_id)
      .select("activity_id")
      .single();

    if (approvalErr) throw new Error(`Approval error: ${approvalErr.message}`);

    // Sync the denormalized status on the activity itself
    const { error: actErr } = await supabase
      .from("activities")
      .update({ status: data.action })
      .eq("id", approval.activity_id);

    if (actErr) throw new Error(`Activity sync error: ${actErr.message}`);

    return { ok: true, activity_id: approval.activity_id, status: data.action };
  });

// ─── BULK APPROVE ────────────────────────────────────────────
/**
 * Approve multiple activities at once.
 * Useful for end-of-day bulk processing by block officers.
 */
export const bulkApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        approval_ids: z.array(z.string().uuid()).min(1).max(50),
        remarks: z.string().max(500).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireStaff(supabase, userId);

    const now = new Date().toISOString();

    // Get activity IDs for the selected approvals
    const { data: approvals } = await supabase
      .from("activity_approvals")
      .select("id, activity_id")
      .in("id", data.approval_ids)
      .eq("status", "pending"); // only process pending ones

    if (!approvals || approvals.length === 0) {
      throw new Error("No pending approvals found for the given IDs");
    }

    const approvalIds = approvals.map((a) => a.id);
    const activityIds = approvals.map((a) => a.activity_id);

    // Bulk update approval records
    const { error: err1 } = await supabase
      .from("activity_approvals")
      .update({
        status: "approved",
        reviewer_id: userId,
        reviewed_at: now,
        remarks: data.remarks ?? "Bulk approved",
      })
      .in("id", approvalIds);

    if (err1) throw new Error(`Bulk approval error: ${err1.message}`);

    // Sync status on activities
    const { error: err2 } = await supabase
      .from("activities")
      .update({ status: "Approved" })
      .in("id", activityIds);

    if (err2) throw new Error(`Activity sync error: ${err2.message}`);

    return { ok: true, approved_count: approvalIds.length };
  });

// ─── LEAVE REQUEST MANAGEMENT ────────────────────────────────

export const applyForLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        leave_type: z.enum(["casual", "sick", "earned", "emergency", "other"]),
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        reason: z.string().max(500).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.end_date < data.start_date) {
      throw new Error("end_date must be >= start_date");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("block_id")
      .eq("id", userId)
      .single();

    const { data: leave, error } = await supabase
      .from("leave_requests")
      .insert({
        cadre_id: userId,
        block_id: profile?.block_id ?? null,
        leave_type: data.leave_type,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason ?? null,
      })
      .select("id, status, start_date, end_date")
      .single();

    if (error) throw new Error(`Leave error: ${error.message}`);
    return { ok: true, leave };
  });

export const reviewLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        leave_id: z.string().uuid(),
        action: z.enum(["approved", "rejected"]),
        reviewer_remarks: z.string().max(500).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireStaff(supabase, userId);

    const { data: leave, error } = await supabase
      .from("leave_requests")
      .update({
        status: data.action,
        reviewer_id: userId,
        reviewer_remarks: data.reviewer_remarks ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.leave_id)
      .select("cadre_id, start_date, end_date")
      .single();

    if (error) throw new Error(`Leave review error: ${error.message}`);

    // If approved, update attendance records for the leave period to 'on_leave'
    if (data.action === "approved") {
      // Generate all dates in the leave range
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const attendanceRecords = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        attendanceRecords.push({
          cadre_id: leave.cadre_id,
          date: d.toISOString().slice(0, 10),
          status: "on_leave" as const,
          recorded_by: userId,
        });
      }

      if (attendanceRecords.length > 0) {
        await supabase
          .from("attendance")
          .upsert(attendanceRecords, { onConflict: "cadre_id,date" });
      }
    }

    return { ok: true, status: data.action };
  });
