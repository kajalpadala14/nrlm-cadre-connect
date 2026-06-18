import { createServerFn } from "@tanstack/react-start";

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
    totalAttResult,
    presentAttResult,
  ] = await Promise.all([
    supabaseAdmin.from("user_roles").select("user_id").eq("role", "cadre"),
    supabaseAdmin.from("blocks").select("id, name").order("name"),
    supabaseAdmin.from("activities").select("id, block_id, village_name, activity_date, status"),
    supabaseAdmin
      .from("activities")
      .select("id, block_id, village_name, activity_date, status")
      .gte("activity_date", sinceStr),
    supabaseAdmin.from("attendance").select("id, cadre_id, date, status").gte("date", sinceStr),
    supabaseAdmin.from("attendance").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("status", "present"),
  ]);

  assertNoError(cadreRolesResult.error, "Cadre role count failed");
  assertNoError(blocksResult.error, "Block query failed");
  assertNoError(allActivitiesResult.error, "Activity query failed");
  assertNoError(recentActivitiesResult.error, "Recent activity query failed");
  assertNoError(attendanceResult.error, "Attendance query failed");
  assertNoError(totalAttResult.error, "Attendance total count failed");
  assertNoError(presentAttResult.error, "Present attendance count failed");

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
  const activeCadres = profiles.filter((p) => (p.status ?? "Active") === "Active").length;
  const totalActivities = activities.length;
  const villagesCovered = new Set(activities.map((a) => a.village_name).filter(Boolean)).size;
  const approvedActivities = activities.filter((a) => a.status === "Approved").length;
  const attendanceRate =
    totalAttResult.count && totalAttResult.count > 0
      ? Math.round(((presentAttResult.count ?? 0) / totalAttResult.count) * 100)
      : 0;

  const blockData = (blocksResult.data ?? []).map((b) => {
    const acts = activities.filter((a) => a.block_id === b.id);
    const cadresInBlock = profiles.filter((p) => p.block_id === b.id).length;
    return {
      name: b.name.length > 10 ? `${b.name.slice(0, 10)}...` : b.name,
      fullName: b.name,
      cadres: cadresInBlock,
      activities: acts.length,
      approved: acts.filter((a) => a.status === "Approved").length,
      pending: acts.filter((a) => a.status === "Pending").length,
    };
  });

  const activityTrendData = Array.from({ length: 6 }, (_, i) => {
    const start = days[i * 5];
    const end = days[Math.min(i * 5 + 4, 29)];
    const label = new Date(start).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
    const slice = recentActivities.filter((a) => a.activity_date >= start && a.activity_date <= end);
    return {
      label,
      total: slice.length,
      approved: slice.filter((a) => a.status === "Approved").length,
    };
  });

  const attendanceTrendData = sevenDays.map((day, i) => {
    const dayRows = attendance.filter((r) => r.date === day);
    return {
      label: labels[i],
      present: dayRows.filter((r) => r.status === "present").length,
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
