import { createClient } from "@supabase/supabase-js";

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
  if (urError) return [];
  const allCadreIds = userRoles.map((r) => r.user_id);
  if (allCadreIds.length === 0) return [];

  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("id")
    .eq("block_id", blockId)
    .in("id", allCadreIds);
  if (pError) return [];
  return profiles.map((p) => p.id);
}

function applyScopeToQuery(query, tableHasBlockId, blockId, cadreIds) {
  if (!blockId || !isValidUUID(blockId)) return query;

  if (cadreIds.length > 0) {
    return query.in("cadre_id", cadreIds);
  }
  return query.eq("cadre_id", "00000000-0000-0000-0000-000000000000");
}

async function run() {
  const email = "dharmedrathakur_339@nrlm.local";
  const password = "NRLM-1234";

  console.log("=== FILTERED DATA COUNTS (USER SESSION) ===");
  const { data: authData } = await supabase.auth.signInWithPassword({ email, password });
  const userId = authData.user.id;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  const blockId = profile.block_id;

  const cadreIds = await getCadreIdsInBlock(blockId);
  console.log(`Block ID: ${blockId}, Cadre Count: ${cadreIds.length}`);

  // 1. Attendance
  let attQ = supabase.from("attendance").select("*");
  attQ = applyScopeToQuery(attQ, true, blockId, cadreIds);
  const { data: attData } = await attQ;
  console.log("Filtered Attendance Count:", attData?.length);

  // 2. Activities
  let actQ = supabase.from("activities").select("*");
  actQ = applyScopeToQuery(actQ, true, blockId, cadreIds);
  const { data: actData } = await actQ;
  console.log("Filtered Activities Count:", actData?.length);

  // 3. Evidence
  let activityIds = actData.map(a => a.id);
  let evCount = 0;
  if (activityIds.length > 0) {
    const { data: evData } = await supabase.from("evidence_files").select("*").in("activity_id", activityIds);
    evCount = evData?.length || 0;
  }
  console.log("Filtered Evidence Files Count:", evCount);

  // 4. Approvals
  let appQ = supabase.from("activities").select("*").eq("status", "Pending");
  appQ = applyScopeToQuery(appQ, true, blockId, cadreIds);
  const { data: appData } = await appQ;
  console.log("Filtered Approvals (Pending Activities) Count:", appData?.length);

  // 5. Reports
  console.log("Filtered Reports Count:", actData?.length);
}

run();
