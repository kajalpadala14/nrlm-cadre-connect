import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = "https://tsussrheickvpshvwihw.supabase.co";
const supabaseKey = "sb_publishable_v6TFVl8a8uOIRvoItEEeyg_f9h5DZ0G";
const supabase = createClient(supabaseUrl, supabaseKey);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(v) {
  return !!v && UUID_RE.test(v);
}

async function getCadreIdsInBlock(blockId) {
  const { data: userRoles, error: urError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "cadre");
  if (urError) {
    console.error("getCadreIdsInBlock: user_roles error:", urError);
    return [];
  }
  const allCadreIds = userRoles.map((r) => r.user_id);
  if (allCadreIds.length === 0) return [];

  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("id")
    .eq("block_id", blockId)
    .in("id", allCadreIds);
  if (pError) {
    console.error("getCadreIdsInBlock: profiles error:", pError);
    return [];
  }
  return profiles.map((p) => p.id);
}

function applyScopeToQuery(query, tableHasBlockId, blockId, cadreIds) {
  if (!blockId || !isValidUUID(blockId)) return query;

  if (cadreIds.length > 0) {
    return query.in("cadre_id", cadreIds);
  }
  // Block has no cadres — force empty result (valid UUID, no match)
  return query.eq("cadre_id", "00000000-0000-0000-0000-000000000000");
}

async function diagnose() {
  console.log("=== DIAGNOSING BLOCK OFFICER SCOPING ISSUES ===");
  const email = "dharmedrathakur_339@nrlm.local";
  const password = "NRLM-1234";

  console.log(`Signing in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error("Sign-in failed:", authError);
    return;
  }
  console.log("Sign-in successful. User ID:", authData.user.id);

  // Fetch profile for user scope
  const [{ data: profile, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authData.user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", authData.user.id),
  ]);

  if (pErr || rErr) {
    console.error("Failed to load profile/roles:", pErr || rErr);
    return;
  }

  console.log("Profile details:", {
    full_name: profile.full_name,
    block_id: profile.block_id,
    roles: roles?.map(r => r.role)
  });

  const blockId = profile.block_id;
  const dateStr = "2026-06-19";

  console.log("\n--- Resolving Cadre IDs ---");
  const cadreIds = await getCadreIdsInBlock(blockId);
  console.log(`Block ID: ${blockId}, Cadre Count: ${cadreIds.length}`);

  // Test 1: Attendance Page Query
  console.log("\n--- Test 1: Attendance page query ---");
  let attQ = supabase
    .from("attendance")
    .select("*")
    .eq("date", dateStr);
  attQ = applyScopeToQuery(attQ, true, blockId, cadreIds);
  const { data: attData, error: attError } = await attQ;
  if (attError) {
    console.error("Attendance query failed:", attError);
  } else {
    console.log("Attendance success. Rows returned:", attData?.length);
  }

  // Test 2: Activities Page Query
  console.log("\n--- Test 2: Activities page query ---");
  let actsListQ = supabase
    .from("activities")
    .select(`
      *,
      profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type, block_id, blocks!profiles_block_id_fkey(name)),
      blocks(name)
    `)
    .order("submitted_at", { ascending: false })
    .limit(500);
  actsListQ = applyScopeToQuery(actsListQ, true, blockId, cadreIds);
  const { data: actsData, error: actsError } = await actsListQ;
  if (actsError) {
    console.error("Activities query failed:", actsError);
  } else {
    console.log("Activities success. Rows returned:", actsData?.length);
  }

  // Test 3: Evidence Gallery Query
  console.log("\n--- Test 3: Evidence activities query ---");
  let evQ = supabase
    .from("activities")
    .select("*, profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type, block_id, blocks(name)), blocks(name)");
  evQ = applyScopeToQuery(evQ, true, blockId, cadreIds);
  const { data: evData, error: evError } = await evQ;
  if (evError) {
    console.error("Evidence activities query failed:", evError);
  } else {
    console.log("Evidence activities success. Rows returned:", evData?.length);
  }

  // Test 4: Approvals Page Queries
  console.log("\n--- Test 4: Approvals query ---");
  let appQ = supabase
    .from("activities")
    .select("*, profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type), blocks(name)")
    .eq("status", "Pending");
  appQ = applyScopeToQuery(appQ, true, blockId, cadreIds);
  const { data: appData, error: appError } = await appQ;
  if (appError) {
    console.error("Approvals query failed:", appError);
  } else {
    console.log("Approvals success. Rows returned:", appData?.length);
  }

  // Test 5: Reports Page Queries
  console.log("\n--- Test 5: Reports query ---");
  let repQ = supabase
    .from("activities")
    .select("*, profiles!activities_cadre_id_fkey_profiles(full_name, user_id, cadre_type, block_id, blocks!profiles_block_id_fkey(name)), blocks!activities_block_id_fkey(name)");
  repQ = applyScopeToQuery(repQ, true, blockId, cadreIds);
  const { data: repData, error: repError } = await repQ;
  if (repError) {
    console.error("Reports query failed:", repError);
  } else {
    console.log("Reports success. Rows returned:", repData?.length);
  }
}

diagnose();
