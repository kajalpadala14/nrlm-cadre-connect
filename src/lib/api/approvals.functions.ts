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
import { z } from "zod";
import { requireStaffScope, resolveScopedBlockId } from "@/lib/api/access-scope";

// ─── Guard helper ─────────────────────────────────────────────
// Uses the same typed client instance from auth context
async function requireStaff(supabase: Parameters<typeof requireStaffScope>[0], userId: string) {
  await requireStaffScope(supabase, userId);
}

const activityStatusByApprovalAction = {
  approved: "Approved",
  rejected: "Rejected",
  revision_requested: "Pending",
} as const;

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
    const scope = await requireStaffScope(supabase, userId);
    const effectiveBlockId = resolveScopedBlockId(scope, data.block_id ?? null);

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

    if (effectiveBlockId) {
      query = query.eq("activities.block_id", effectiveBlockId);
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
    const scope = await requireStaffScope(supabase, userId);

    const now = new Date().toISOString();

    const { data: scopedApproval, error: scopeErr } = await supabase
      .from("activity_approvals")
      .select("activity_id, activities!inner(block_id)")
      .eq("id", data.approval_id)
      .single();

    if (scopeErr) throw new Error(`Approval error: ${scopeErr.message}`);
    const activity = scopedApproval.activities as { block_id?: string | null } | null;
    resolveScopedBlockId(scope, activity?.block_id ?? null);

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

    // Sync the denormalized title-case status on the activity itself.
    // activities.status has a CHECK constraint for Pending/Approved/Rejected.
    const { error: actErr } = await supabase
      .from("activities")
      .update({
        status: activityStatusByApprovalAction[data.action],
        comment: data.remarks ?? null,
        approved_at: now,
        approved_by: userId,
      })
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
    const scope = await requireStaffScope(supabase, userId);

    const now = new Date().toISOString();

    // Get activity IDs for the selected approvals
    const { data: approvals } = await supabase
      .from("activity_approvals")
      .select("id, activity_id, activities!inner(block_id)")
      .in("id", data.approval_ids)
      .eq("status", "pending"); // only process pending ones

    if (!approvals || approvals.length === 0) {
      throw new Error("No pending approvals found for the given IDs");
    }
    if (approvals.length !== data.approval_ids.length) {
      throw new Error("Some approvals were not found or are not accessible");
    }
    approvals.forEach((approval) => {
      const activity = approval.activities as { block_id?: string | null } | null;
      resolveScopedBlockId(scope, activity?.block_id ?? null);
    });

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
        leave_type: z.string(),
        from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        reason: z.string().max(500),
        attachment_url: z.string().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.to_date < data.from_date) {
      throw new Error("to_date must be >= from_date");
    }

    // Calculate total days inclusive
    const start = new Date(data.from_date);
    const end = new Date(data.to_date);
    const total_days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

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
        from_date: data.from_date,
        to_date: data.to_date,
        total_days,
        reason: data.reason,
        attachment_url: data.attachment_url ?? null,
        status: "pending",
      })
      .select("id, status, from_date, to_date, total_days")
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
        approval_remarks: z.string().max(500).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const scope = await requireStaffScope(supabase, userId);

    const { data: existingLeave, error: existingLeaveError } = await supabase
      .from("leave_requests")
      .select("block_id")
      .eq("id", data.leave_id)
      .single();

    if (existingLeaveError) throw new Error(`Leave review error: ${existingLeaveError.message}`);
    resolveScopedBlockId(scope, existingLeave?.block_id ?? null);

    const { data: leave, error } = await supabase
      .from("leave_requests")
      .update({
        status: data.action,
        approved_by: userId,
        approval_remarks: data.approval_remarks ?? null,
        approved_at: new Date().toISOString(),
      })
      .eq("id", data.leave_id)
      .select("cadre_id, block_id, from_date, to_date, status")
      .single();

    if (error) throw new Error(`Leave review error: ${error.message}`);

    return { ok: true, status: data.action, leave };
  });

export const cancelLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        leave_id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check that the request belongs to this user and is still pending
    const { data: existingLeave, error: existingLeaveError } = await supabase
      .from("leave_requests")
      .select("cadre_id, status")
      .eq("id", data.leave_id)
      .single();

    if (existingLeaveError) throw new Error(`Leave cancel error: ${existingLeaveError.message}`);
    if (existingLeave.cadre_id !== userId) {
      throw new Error("You can only cancel your own leave requests");
    }
    if (existingLeave.status !== "pending") {
      throw new Error("You can only cancel pending leave requests");
    }

    const { data: leave, error } = await supabase
      .from("leave_requests")
      .update({
        status: "cancelled",
      })
      .eq("id", data.leave_id)
      .select("id, status")
      .single();

    if (error) throw new Error(`Leave cancel error: ${error.message}`);
    return { ok: true, leave };
  });
