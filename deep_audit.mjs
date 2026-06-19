/**
 * DEEP AUDIT SCRIPT
 * Simulates exactly what each page query does for a block officer user
 * Tests with REAL cadre IDs from the actual database
 */
import { createClient } from "@supabase/supabase-js";

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

const today = new Date().toISOString().slice(0, 10);

// ─── Step 1: Get all blocks and their block officers ──────────────────────
console.log("\n========== STEP 1: BLOCKS & BLOCK OFFICER USERS ==========");
const { data: blocks } = await supabase.from("blocks").select("id,name").order("name");
console.log("Blocks:", blocks?.map(b => `${b.name} (${b.id.slice(0,8)})`));

// Get all block_officer users and their profiles
const { data: boRoles } = await supabase.from("user_roles").select("user_id").eq("role", "block_officer");
console.log(`\nBlock Officer user count: ${boRoles?.length ?? 0}`);

if (boRoles && boRoles.length > 0) {
  const boIds = boRoles.map(r => r.user_id);
  const { data: boProfiles } = await supabase.from("profiles").select("id,full_name,block_id").in("id", boIds);
  console.log("Block Officers:");
  for (const p of (boProfiles ?? [])) {
    const block = blocks?.find(b => b.id === p.block_id);
    console.log(`  ${p.full_name || "Unknown"} | block=${block?.name ?? "NULL (NO BLOCK ASSIGNED!)"} | user_id=${p.id.slice(0,8)}`);
  }
}

// ─── Step 2: Test getCadreIdsInBlock for each block ───────────────────────
console.log("\n========== STEP 2: getCadreIdsInBlock() RESULTS ==========");

async function getCadreIdsInBlock(blockId) {
  const { data: userRoles } = await supabase.from("user_roles").select("user_id").eq("role", "cadre");
  if (!userRoles || userRoles.length === 0) return [];
  const allCadreIds = userRoles.map(r => r.user_id);
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id,full_name")
    .eq("block_id", blockId)
    .in("id", allCadreIds);
  if (error) { console.log("  ERROR in getCadreIdsInBlock:", error.message); return []; }
  return profiles ?? [];
}

for (const block of (blocks ?? [])) {
  const cadres = await getCadreIdsInBlock(block.id);
  console.log(`\n${block.name}: ${cadres.length} cadres`);
  if (cadres.length > 0) {
    cadres.slice(0,5).forEach(c => console.log(`  - ${c.full_name || "?"} (${c.id.slice(0,8)})`));
    if (cadres.length > 5) console.log(`  ... and ${cadres.length - 5} more`);
  }
}

// ─── Step 3: Attendance query as block officer would see ──────────────────
console.log("\n========== STEP 3: ATTENDANCE QUERY SIMULATION ==========");

for (const block of (blocks ?? [])) {
  const cadres = await getCadreIdsInBlock(block.id);
  const cadreIds = cadres.map(c => c.id);
  
  console.log(`\n[${block.name}] cadreIds count: ${cadreIds.length}`);
  
  if (cadreIds.length === 0) {
    console.log("  → Block has no cadres → attendance will show 0 (forced empty query)");
    continue;
  }
  
  // Attendance for today
  const { data: att, error: attErr } = await supabase
    .from("attendance")
    .select("cadre_id, status, date, block_id")
    .eq("date", today)
    .in("cadre_id", cadreIds);
  
  if (attErr) console.log("  ERROR:", attErr.message);
  else console.log(`  Attendance today: ${att?.length ?? 0} records`);
  
  // All attendance
  const { data: attAll } = await supabase
    .from("attendance")
    .select("cadre_id, status, date, block_id")
    .in("cadre_id", cadreIds)
    .limit(10);
  console.log(`  All attendance (any date): ${attAll?.length ?? 0} records`);
  attAll?.slice(0,3).forEach(a => console.log(`    ${a.date} | cadre=${a.cadre_id.slice(0,8)} | ${a.status} | block=${a.block_id?.slice(0,8) ?? "NULL"}`));
}

// ─── Step 4: Activities query as block officer would see ──────────────────
console.log("\n========== STEP 4: ACTIVITIES QUERY SIMULATION ==========");

for (const block of (blocks ?? [])) {
  const cadres = await getCadreIdsInBlock(block.id);
  const cadreIds = cadres.map(c => c.id);
  
  console.log(`\n[${block.name}] cadreIds count: ${cadreIds.length}`);
  
  if (cadreIds.length === 0) {
    console.log("  → No cadres → activities will be 0");
    continue;
  }
  
  const { data: acts, error } = await supabase
    .from("activities")
    .select("id, cadre_id, village_name, activity_date, status, block_id")
    .in("cadre_id", cadreIds)
    .order("submitted_at", { ascending: false })
    .limit(100);
  
  if (error) console.log("  ERROR:", error.message);
  else {
    console.log(`  Total activities: ${acts?.length ?? 0}`);
    const today_acts = acts?.filter(a => a.activity_date === today) ?? [];
    console.log(`  Activities today (${today}): ${today_acts.length}`);
    const pending = acts?.filter(a => a.status === "Pending") ?? [];
    console.log(`  Pending: ${pending.length}`);
    const villages = new Set(today_acts.map(a => a.village_name));
    console.log(`  Villages today: ${villages.size} (${[...villages].join(", ")})`);
    if (acts && acts.length > 0) {
      acts.slice(0,3).forEach(a => console.log(`    ${a.activity_date} | ${a.village_name} | ${a.status} | block=${a.block_id?.slice(0,8) ?? "NULL"}`));
    }
  }
}

// ─── Step 5: Check which cadres submitted today's activities ──────────────
console.log("\n========== STEP 5: CADRE->BLOCK MAPPING FOR TODAY'S ACTIVITIES ==========");

const { data: todayActs } = await supabase
  .from("activities")
  .select("cadre_id, village_name, block_id")
  .eq("activity_date", today);

console.log(`Activities today: ${todayActs?.length ?? 0}`);

const actCadreIds = [...new Set((todayActs ?? []).map(a => a.cadre_id))];
if (actCadreIds.length > 0) {
  const { data: actProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, block_id, blocks(name)")
    .in("id", actCadreIds);
  
  console.log("Cadres who submitted today:");
  for (const p of (actProfiles ?? [])) {
    const act = todayActs?.find(a => a.cadre_id === p.id);
    console.log(`  ${p.full_name || "?"} | profile.block_id=${p.blocks?.name ?? "NULL"} | activity.block_id=${act?.block_id?.slice(0,8) ?? "NULL"}`);
  }
}

// ─── Step 6: Check attendance cadre→block mapping ────────────────────────
console.log("\n========== STEP 6: CADRE->BLOCK MAPPING FOR TODAY'S ATTENDANCE ==========");

const { data: todayAtt } = await supabase
  .from("attendance")
  .select("cadre_id, status, block_id")
  .eq("date", today);

console.log(`Attendance today: ${todayAtt?.length ?? 0}`);

const attCadreIds = [...new Set((todayAtt ?? []).map(a => a.cadre_id))];
if (attCadreIds.length > 0) {
  const { data: attProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, block_id, blocks(name)")
    .in("id", attCadreIds);
  
  console.log("Cadres who have attendance today:");
  for (const p of (attProfiles ?? [])) {
    console.log(`  ${p.full_name || "?"} | block=${p.blocks?.name ?? "NULL"}`);
  }
}

// ─── Step 7: Check block officer profile data ─────────────────────────────
console.log("\n========== STEP 7: BLOCK OFFICER PROFILE BLOCK_ID CHECK ==========");
const { data: allBlockOfficers } = await supabase
  .from("user_roles")
  .select("user_id")
  .eq("role", "block_officer");

if (allBlockOfficers && allBlockOfficers.length > 0) {
  const ids = allBlockOfficers.map(r => r.user_id);
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, full_name, block_id, blocks(name)")
    .in("id", ids);
  
  for (const p of (profs ?? [])) {
    const blockName = p.blocks?.name ?? "NULL ⚠️  NO BLOCK ASSIGNED";
    console.log(`  ${p.full_name || "Unknown"} | user_id=${p.id.slice(0,8)} | block=${blockName}`);
  }
} else {
  console.log("  NO block_officer users found!");
}

// ─── Step 8: Route permission check ──────────────────────────────────────
console.log("\n========== STEP 8: ROUTE PERMISSION ANALYSIS ==========");
console.log("route.tsx line 41:");
console.log('  const isStaff = roles.includes("admin") || roles.includes("block_officer");');
console.log("  → block_officer IS included in isStaff check ✓");
console.log("  → BPM/DPM/AC roles NOT in the enum (only admin, block_officer, cadre exist)");
console.log("  → If a user has role 'bpm' in DB, they will be redirected to /auth !");

// Check if any user has non-standard roles
const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
const uniqueRoles = [...new Set((allRoles ?? []).map(r => r.role))];
console.log(`\nAll unique roles in DB: ${JSON.stringify(uniqueRoles)}`);

// ─── Step 9: Simulate dashboard KPI for Dantewada block officer ───────────
console.log("\n========== STEP 9: DASHBOARD KPI SIMULATION FOR DANTEWADA ==========");
const dantewada = blocks?.find(b => b.name.includes("Dantewada"));
if (dantewada) {
  const cadres = await getCadreIdsInBlock(dantewada.id);
  const cadreIds = cadres.map(c => c.id);
  console.log(`Block: ${dantewada.name}`);
  console.log(`Cadres: ${cadreIds.length}`);
  
  // Attendance KPI
  const { data: attKPI } = await supabase
    .from("attendance")
    .select("status, cadre_id")
    .eq("date", today)
    .in("cadre_id", cadreIds);
  console.log(`Attendance today (cadre_id filter): ${attKPI?.length ?? 0}`);
  console.log(`  Present: ${attKPI?.filter(a => a.status === "present").length ?? 0}`);
  
  // Activities KPI
  const { data: actsKPI } = await supabase
    .from("activities")
    .select("status, village_name, activity_date")
    .eq("activity_date", today)
    .in("cadre_id", cadreIds);
  console.log(`Activities today (cadre_id filter): ${actsKPI?.length ?? 0}`);
  
  // Evidence files
  const { data: evFiles } = await supabase
    .from("evidence_files")
    .select("id, cadre_id, activity_id")
    .in("cadre_id", cadreIds)
    .limit(10);
  console.log(`Evidence files for block cadres: ${evFiles?.length ?? 0}`);
}

console.log("\n========== AUDIT COMPLETE ==========\n");
