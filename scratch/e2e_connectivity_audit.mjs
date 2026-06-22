import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  return Object.fromEntries(
    fs
      .readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return [key.trim(), rest.join("=").trim().replace(/^"|"$/g, "")];
      })
  );
}

const env = loadEnv();
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const anonKey = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceKey) {
  throw new Error("Missing Supabase URL, publishable key, or service role key in .env");
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const today = new Date().toISOString().slice(0, 10);
const result = {
  timestamp: new Date().toISOString(),
  database: {},
  auth: {},
  counts: {},
  modules: {},
  roleAccess: {},
  issues: [],
};

function issue(module, message, details = {}) {
  result.issues.push({ module, message, ...details });
}

async function checked(label, promise) {
  const { data, error, count } = await promise;
  if (error) issue("database", `${label}: ${error.message}`, { code: error.code });
  return { data, error, count };
}

async function getUserRoles() {
  const { data } = await checked("read user_roles", admin.from("user_roles").select("user_id, role"));
  return data ?? [];
}

async function main() {
  const roles = await getUserRoles();
  const roleCounts = roles.reduce((acc, row) => {
    acc[row.role] = (acc[row.role] ?? 0) + 1;
    return acc;
  }, {});

  const [{ data: profiles }, { data: blocks }, { data: authUsersData, error: authUsersError }] =
    await Promise.all([
      checked("read profiles", admin.from("profiles").select("*")),
      checked("read blocks", admin.from("blocks").select("*")),
      admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
    ]);

  if (authUsersError) issue("auth", `admin.listUsers failed: ${authUsersError.message}`);
  const authUsers = authUsersData?.users ?? [];

  result.counts.roleCounts = roleCounts;
  result.counts.authUsers = authUsers.length;
  result.counts.profiles = profiles?.length ?? 0;
  result.counts.blocks = blocks?.length ?? 0;
  result.auth.users = authUsers
    .map((user) => {
      const userRoles = roles.filter((r) => r.user_id === user.id).map((r) => r.role);
      const profile = profiles?.find((p) => p.id === user.id);
      return {
        id: user.id,
        login_id: user.email?.replace(/@nrlm\.local$/i, ""),
        email: user.email,
        confirmed: Boolean(user.confirmed_at),
        roles: userRoles,
        hasProfile: Boolean(profile),
        full_name: profile?.full_name ?? null,
        block_id: profile?.block_id ?? null,
      };
    })
    .filter((user) => user.roles.length || user.email?.endsWith("@nrlm.local"));

  const roleSamples = {};
  for (const role of ["admin", "block_officer", "cadre", "bpm", "dpm"]) {
    roleSamples[role] = result.auth.users.find((user) => user.roles.includes(role)) ?? null;
  }
  result.auth.roleSamples = roleSamples;

  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const [label, sample] of Object.entries(roleSamples)) {
    if (!sample?.email) {
      result.auth[label] = { status: "FAIL", reason: "No auth user with this role found" };
      continue;
    }
    const pin = sample.login_id === "admin" ? "1234" : "1234";
    const { data, error } = await anon.auth.signInWithPassword({
      email: sample.email,
      password: `NRLM-${pin}`,
    });
    if (error) {
      result.auth[label] = { status: "FAIL", email: sample.email, reason: error.message };
      continue;
    }
    const userId = data.user?.id;
    const sessionOk = Boolean(data.session?.access_token && userId);
    const [profileResult, rolesResult] = await Promise.all([
      anon.from("profiles").select("*").eq("id", userId).maybeSingle(),
      anon.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const logout = await anon.auth.signOut();
    result.auth[label] = {
      status: sessionOk && !profileResult.error && !rolesResult.error && !logout.error ? "PASS" : "FAIL",
      email: sample.email,
      sessionCreated: sessionOk,
      profileLoaded: Boolean(profileResult.data),
      roles: rolesResult.data?.map((r) => r.role) ?? [],
      profileError: profileResult.error?.message ?? null,
      roleError: rolesResult.error?.message ?? null,
      logoutError: logout.error?.message ?? null,
    };
  }

  const notificationUserId = result.auth.users.find((u) => u.hasProfile)?.id;
  if (notificationUserId) {
    const insertPayload = {
      user_id: notificationUserId,
      title: "E2E audit connectivity test",
      message: "Temporary audit record, safe to delete.",
      type: "info",
      read: false,
    };
    const insert = await admin.from("notifications").insert(insertPayload).select("*").single();
    const update = insert.data
      ? await admin.from("notifications").update({ read: true }).eq("id", insert.data.id).select("*").single()
      : { error: new Error("Insert failed") };
    const del = insert.data
      ? await admin.from("notifications").delete().eq("id", insert.data.id).select("*")
      : { error: new Error("Insert failed") };
    result.database.crud = {
      read: "PASS",
      insert: insert.error ? `FAIL: ${insert.error.message}` : "PASS",
      update: update.error ? `FAIL: ${update.error.message}` : "PASS",
      delete: del.error ? `FAIL: ${del.error.message}` : "PASS",
    };
  }

  const cadreIds = roles.filter((r) => r.role === "cadre").map((r) => r.user_id);
  const activeCadres = profiles?.filter((p) => cadreIds.includes(p.id) && (p.status ?? "Active") === "Active") ?? [];
  const [{ count: attendanceToday }, { count: activitiesToday }, { count: pendingActivities }, { count: leaveRequests }] =
    await Promise.all([
      checked("count attendance today", admin.from("attendance").select("id", { count: "exact", head: true }).eq("date", today)),
      checked("count activities today", admin.from("activities").select("id", { count: "exact", head: true }).eq("activity_date", today)),
      checked("count pending activities", admin.from("activities").select("id", { count: "exact", head: true }).eq("status", "Pending")),
      checked("count leave requests", admin.from("leave_requests").select("id", { count: "exact", head: true })),
    ]);
  const { data: todayActivities } = await checked(
    "read today's activities for village count",
    admin.from("activities").select("village_name").eq("activity_date", today)
  );

  result.counts.dashboardExpected = {
    cadreCount: cadreIds.length,
    activeCadres: activeCadres.length,
    attendanceToday: attendanceToday ?? 0,
    activitiesToday: activitiesToday ?? 0,
    villagesCoveredToday: new Set((todayActivities ?? []).map((a) => a.village_name).filter(Boolean)).size,
    pendingApprovals: pendingActivities ?? 0,
    leaveRequests: leaveRequests ?? 0,
  };

  const tables = [
    ["attendance", "id, cadre_id, date, status, block_id, recorded_by, created_at, updated_at"],
    ["activities", "id, cadre_id, activity_date, status, village_name, block_id"],
    ["evidence_files", "id, cadre_id, activity_id, public_url, storage_path, mime_type, created_at"],
    ["leave_requests", "id, cadre_id, from_date, to_date, status, block_id"],
    ["notifications", "id, user_id, title, read, created_at"],
  ];
  for (const [table, select] of tables) {
    const { data, error } = await admin.from(table).select(select).limit(20);
    result.modules[table] = {
      status: error ? "FAIL" : "PASS",
      sampleCount: data?.length ?? 0,
      error: error?.message ?? null,
    };
  }

  const { data: evidenceRows } = await checked(
    "read evidence links",
    admin.from("evidence_files").select("id, activity_id, public_url, activities(id, block_id, cadre_id)").limit(100)
  );
  result.modules.evidenceGallery = {
    status: "PASS",
    sampled: evidenceRows?.length ?? 0,
    missingActivityLinks: (evidenceRows ?? []).filter((row) => !row.activity_id || !row.activities).length,
    missingUrls: (evidenceRows ?? []).filter((row) => !row.public_url).length,
  };

  result.roleAccess.frontendRecognizedRoles = ["admin", "block_officer", "cadre"];
  result.roleAccess.dbRoles = Object.keys(roleCounts);
  result.roleAccess.missingDistinctBpm = !roleCounts.bpm;
  result.roleAccess.missingDistinctDpm = !roleCounts.dpm;

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
