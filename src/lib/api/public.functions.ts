import { createServerFn } from "@tanstack/react-start";
import {
  logAttendanceDebug,
  summarizeAttendanceForRate,
  toISTDateString,
} from "@/lib/utils/attendance";
import { CADRE_ACCOUNT_ROLES } from "@/lib/roles";
import { uniqueVillageCount } from "@/lib/utils/villages";

function last30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function last7Labels(): string[] {
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }));
  }
  return labels;
}

function assertNoError(error: { message?: string } | null, label: string) {
  if (error) throw new Error(`${label}: ${error.message ?? "Unknown Supabase error"}`);
}

export const getPublicDashboardData = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const days = last30Days();
  const sevenDays = days.slice(-7);
  const labels = last7Labels();
  const sinceStr = days[0];

  const [
    cadreRolesResult,
    blocksResult,
    allActivitiesResult,
    recentActivitiesResult,
    attendanceResult,
  ] = await Promise.all([
    supabaseAdmin.from("user_roles").select("user_id").in("role", [...CADRE_ACCOUNT_ROLES]),
    supabaseAdmin.from("blocks").select("id, name").order("name"),
    supabaseAdmin.from("activities").select("id, cadre_id, block_id, village_name, activity_date, status"),
    supabaseAdmin
      .from("activities")
      .select("id, cadre_id, block_id, village_name, activity_date, status")
      .gte("activity_date", sinceStr),
    supabaseAdmin.from("attendance").select("id, cadre_id, date, status").gte("date", sinceStr),
  ]);

  assertNoError(cadreRolesResult.error, "Cadre role count failed");
  assertNoError(blocksResult.error, "Block query failed");
  assertNoError(allActivitiesResult.error, "Activity query failed");
  assertNoError(recentActivitiesResult.error, "Recent activity query failed");
  assertNoError(attendanceResult.error, "Attendance query failed");

  const cadreIds = (cadreRolesResult.data ?? []).map((r) => r.user_id);
  const profilesResult =
    cadreIds.length > 0
      ? await supabaseAdmin.from("profiles").select("id, block_id, status").in("id", cadreIds)
      : { data: [], error: null };
  assertNoError(profilesResult.error, "Cadre profile query failed");

  const profiles = profilesResult.data ?? [];
  const activities = allActivitiesResult.data ?? [];
  const recentActivities = recentActivitiesResult.data ?? [];
  const attendance = attendanceResult.data ?? [];
  const totalCadres = cadreIds.length;
  const activeCadreIds = profiles
    .filter((p) => (p.status ?? "Active") === "Active")
    .map((p) => p.id);
  const activeCadres = activeCadreIds.length;
  const totalActivities = activities.length;
  const villagesCovered = uniqueVillageCount(activities, (a) => a.village_name);
  const approvedActivities = activities.filter((a) => a.status === "Approved").length;
  const todayStr = toISTDateString(new Date());
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const districtAttendanceSummary = summarizeAttendanceForRate(todayAttendance, activeCadreIds);
  const attendanceRate = districtAttendanceSummary.finalAttendanceRate;

  logAttendanceDebug("PUBLIC PAGE", districtAttendanceSummary);

  const blockData = (blocksResult.data ?? []).map((b) => {
    // Resolve activities via cadre profiles because activities.block_id is often NULL.
    // The authoritative block assignment is profiles.block_id.
    const blockCadreIds = profiles.filter((p) => p.block_id === b.id).map((p) => p.id);
    const blockProfiles = profiles.filter((p) => p.block_id === b.id);
    const activeCadreIdsInBlock = blockProfiles
      .filter((p) => (p.status ?? "Active") === "Active")
      .map((p) => p.id);
    const activeCadresInBlock = activeCadreIdsInBlock.length;

    // Match activities by cadre_id (reliable) OR block_id (set for newer submissions)
    const acts = activities.filter(
      (a) => a.block_id === b.id || blockCadreIds.includes(a.cadre_id ?? ""),
    );

    // Today's attendance for this block — match by cadre_id
    const blockTodayAtt = attendance.filter(
      (a) => blockCadreIds.includes(a.cadre_id) && a.date === todayStr,
    );
    const blockAttendanceSummary = summarizeAttendanceForRate(blockTodayAtt, activeCadreIdsInBlock);
    const blockPresent = blockAttendanceSummary.presentCount + blockAttendanceSummary.lateCount;
    const blockLeave = blockAttendanceSummary.leaveCount;
    const blockAttRate = blockAttendanceSummary.finalAttendanceRate;

    // Clean block name — strip Hindi in parentheses e.g. "Geedam (गीदम)" → "Geedam"
    const cleanName = b.name.replace(/\s*\(.*?\)\s*/g, "").trim();
    const shortName = cleanName.length > 12 ? `${cleanName.slice(0, 12)}…` : cleanName;

    return {
      name: shortName,
      fullName: cleanName,
      cadres: activeCadresInBlock,
      activities: acts.length,
      approved: acts.filter((a) => a.status === "Approved").length,
      pending: acts.filter((a) => a.status === "Pending").length,
      villages: uniqueVillageCount(acts, (a) => a.village_name),
      present: blockPresent,
      on_leave: blockLeave,
      attendanceRate: blockAttRate,
    };
  });

  // Activity Trend: one data point per day for the last 30 days.
  // Label is shown every 5th day to avoid X-axis crowding.
  // This replaces the broken 5-day-bucket approach which was collapsing all
  // recent activities into the last bucket, making the chart appear flat.
  const activityTrendData = days.map((day, i) => {
    const dayActs = recentActivities.filter((a) => a.activity_date === day);
    // Show label every 5th day (day 0, 5, 10, 15, 20, 25, 29)
    const showLabel = i === 0 || i % 5 === 0 || i === days.length - 1;
    const label = showLabel
      ? new Date(day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      : "";
    return {
      label,
      day,
      total: dayActs.length,
      approved: dayActs.filter((a) => a.status === "Approved").length,
    };
  });

  const attendanceTrendData = sevenDays.map((day, i) => {
    const dayRows = attendance.filter((r) => r.date === day);
    return {
      label: labels[i],
      present: dayRows.filter((r) => r.status === "present").length,
      late: dayRows.filter((r) => r.status === "late").length,
      absent: dayRows.filter((r) => r.status === "absent").length,
    };
  });

  return {
    stats: {
      totalCadres,
      activeCadres,
      totalActivities,
      villagesCovered,
      approvedActivities,
      attendanceRate,
    },
    blockData,
    activityTrendData,
    attendanceTrendData,
  };
});
