import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim().replace(/^"|"$/g, "")];
    })
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const result = { attendance: {}, activity: {}, evidence: {}, leave: {}, cleanup: {} };
const testDate = "2099-12-30";

const { data: cadreRoles, error: roleError } = await supabase
  .from("user_roles")
  .select("user_id")
  .eq("role", "cadre");
if (roleError) throw roleError;

const cadreIds = cadreRoles.map((r) => r.user_id);
const { data: profiles, error: profileError } = await supabase
  .from("profiles")
  .select("id, block_id")
  .in("id", cadreIds)
  .not("block_id", "is", null)
  .limit(1);
if (profileError) throw profileError;
if (!profiles?.[0]) throw new Error("No cadre profile with block_id found for workflow test");

const cadre = profiles[0];
const cleanup = [];

try {
  const attendance = await supabase
    .from("attendance")
    .upsert(
      {
        cadre_id: cadre.id,
        block_id: cadre.block_id,
        date: testDate,
        status: "present",
        check_in_at: `${testDate}T09:00:00.000Z`,
        recorded_by: cadre.id,
      },
      { onConflict: "cadre_id,date" }
    )
    .select("*")
    .single();
  if (attendance.error) throw attendance.error;
  cleanup.push(["attendance", attendance.data.id]);
  result.attendance.submission = attendance.data.status === "present" ? "PASS" : "FAIL";

  const attendanceUpdate = await supabase
    .from("attendance")
    .update({ status: "absent", remarks: "E2E audit temporary update" })
    .eq("id", attendance.data.id)
    .select("status")
    .single();
  result.attendance.update = attendanceUpdate.data?.status === "absent" ? "PASS" : `FAIL: ${attendanceUpdate.error?.message}`;

  const activity = await supabase
    .from("activities")
    .insert({
      cadre_id: cadre.id,
      block_id: cadre.block_id,
      activity_date: testDate,
      village_name: "E2E Audit Village",
      activity_type: "Other",
      description: "Temporary audit activity",
      beneficiaries: 1,
      panchayat: "E2E Audit Panchayat",
      status: "Pending",
    })
    .select("*")
    .single();
  if (activity.error) throw activity.error;
  cleanup.push(["activities", activity.data.id]);
  result.activity.creation = activity.data.status === "Pending" ? "PASS" : "FAIL";

  const approved = await supabase
    .from("activities")
    .update({ status: "Approved", comment: "E2E approve", approved_at: new Date().toISOString() })
    .eq("id", activity.data.id)
    .select("status")
    .single();
  result.activity.approve = approved.data?.status === "Approved" ? "PASS" : `FAIL: ${approved.error?.message}`;

  const rejected = await supabase
    .from("activities")
    .update({ status: "Rejected", comment: "E2E reject" })
    .eq("id", activity.data.id)
    .select("status")
    .single();
  result.activity.reject = rejected.data?.status === "Rejected" ? "PASS" : `FAIL: ${rejected.error?.message}`;

  const evidence = await supabase
    .from("evidence_files")
    .insert({
      activity_id: activity.data.id,
      cadre_id: cadre.id,
      storage_path: `${cadre.id}/${activity.data.id}/e2e-audit.jpg`,
      public_url: "https://example.invalid/e2e-audit.jpg",
      file_name: "e2e-audit.jpg",
      file_size: 1,
      mime_type: "image/jpeg",
    })
    .select("*")
    .single();
  if (evidence.error) throw evidence.error;
  cleanup.push(["evidence_files", evidence.data.id]);
  result.evidence.linkedToActivity = evidence.data.activity_id === activity.data.id ? "PASS" : "FAIL";

  const leave = await supabase
    .from("leave_requests")
    .insert({
      cadre_id: cadre.id,
      block_id: cadre.block_id,
      leave_type: "Casual",
      from_date: testDate,
      to_date: testDate,
      total_days: 1,
      reason: "Temporary E2E audit leave",
      status: "pending",
    })
    .select("*")
    .single();
  if (leave.error) throw leave.error;
  cleanup.push(["leave_requests", leave.data.id]);
  result.leave.creation = leave.data.status === "pending" ? "PASS" : "FAIL";

  const leaveApproved = await supabase
    .from("leave_requests")
    .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: cadre.id })
    .eq("id", leave.data.id)
    .select("status")
    .single();
  result.leave.approve = leaveApproved.data?.status === "approved" ? "PASS" : `FAIL: ${leaveApproved.error?.message}`;

  const leaveAttendance = await supabase
    .from("attendance")
    .select("status")
    .eq("cadre_id", cadre.id)
    .eq("date", testDate)
    .maybeSingle();
  result.leave.attendanceIntegration = leaveAttendance.data?.status === "on_leave" ? "PASS" : `FAIL: ${leaveAttendance.error?.message ?? leaveAttendance.data?.status}`;

  const leaveRejected = await supabase
    .from("leave_requests")
    .update({ status: "rejected", approval_remarks: "Temporary E2E rejection" })
    .eq("id", leave.data.id)
    .select("status")
    .single();
  result.leave.reject = leaveRejected.data?.status === "rejected" ? "PASS" : `FAIL: ${leaveRejected.error?.message}`;
} finally {
  for (const [table, id] of cleanup.reverse()) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    result.cleanup[`${table}:${id}`] = error ? `FAIL: ${error.message}` : "PASS";
  }
  await supabase.from("attendance").delete().eq("cadre_id", cadre.id).eq("date", testDate);
}

console.log(JSON.stringify(result, null, 2));
