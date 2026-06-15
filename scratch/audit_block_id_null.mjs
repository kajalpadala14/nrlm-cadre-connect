/**
 * Audit script: Investigate cadre profiles with block_id = NULL
 * READ ONLY — no mutations.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://tsussrheickvpshvwihw.supabase.co",
  "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI"
);

async function run() {
  console.log("============================================================");
  console.log("  AUDIT: cadre profiles with block_id = NULL");
  console.log("============================================================\n");

  // 1. All profiles (full detail)
  const { data: allProfiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, cadre_type, block_id, phone, village, gender, panchayat, join_date, status, created_at, updated_at")
    .order("created_at", { ascending: true });
  if (pErr) { console.error("profiles error:", pErr.message); process.exit(1); }

  // 2. All user_roles
  const { data: allRoles, error: rErr } = await supabase
    .from("user_roles")
    .select("user_id, role");
  if (rErr) { console.error("user_roles error:", rErr.message); process.exit(1); }

  // 3. All blocks
  const { data: blocks, error: bErr } = await supabase
    .from("blocks")
    .select("id, name, created_at")
    .order("name");
  if (bErr) { console.error("blocks error:", bErr.message); process.exit(1); }

  const roleMap = new Map();
  allRoles.forEach(r => {
    if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, []);
    roleMap.get(r.user_id).push(r.role);
  });

  const blockMap = new Map(blocks.map(b => [b.id, b.name]));

  // ---------- SECTION 1: ALL PROFILES ----------
  console.log(`=== SECTION 1: ALL ${allProfiles.length} PROFILES ===`);
  allProfiles.forEach((p, i) => {
    const roles = roleMap.get(p.id) ?? ["(no role row)"];
    const blockName = p.block_id ? (blockMap.get(p.block_id) ?? `UUID:${p.block_id}`) : "NULL ⚠";
    console.log(`[${i+1}] ${p.full_name} (${p.user_id})`);
    console.log(`     id:          ${p.id}`);
    console.log(`     roles:       ${roles.join(", ")}`);
    console.log(`     cadre_type:  ${p.cadre_type ?? "NULL"}`);
    console.log(`     block_id:    ${p.block_id ?? "NULL ⚠"} → ${blockName}`);
    console.log(`     village:     ${p.village ?? "NULL"}`);
    console.log(`     panchayat:   ${p.panchayat ?? "NULL"}`);
    console.log(`     gender:      ${p.gender ?? "NULL"}`);
    console.log(`     join_date:   ${p.join_date ?? "NULL"}`);
    console.log(`     status:      ${p.status ?? "NULL"}`);
    console.log(`     created_at:  ${p.created_at}`);
    console.log(`     updated_at:  ${p.updated_at}`);
    console.log("");
  });

  // ---------- SECTION 2: CADRE-ROLE ONLY ----------
  const cadreProfiles = allProfiles.filter(p => (roleMap.get(p.id) ?? []).includes("cadre"));
  const nullBlockCadres = cadreProfiles.filter(p => !p.block_id);
  const withBlockCadres = cadreProfiles.filter(p => !!p.block_id);

  console.log(`=== SECTION 2: CADRE-ROLE PROFILES (${cadreProfiles.length} total) ===`);
  console.log(`  With block_id:    ${withBlockCadres.length}`);
  console.log(`  block_id = NULL:  ${nullBlockCadres.length}`);
  console.log("");

  // ---------- SECTION 3: CADRES WITH NULL block_id (THE PROBLEM SET) ----------
  console.log(`=== SECTION 3: CADRES WITH block_id = NULL (${nullBlockCadres.length} records) ===`);
  nullBlockCadres.forEach((p, i) => {
    console.log(`[NULL-${i+1}] ${p.full_name}`);
    console.log(`  user_id:     ${p.user_id}`);
    console.log(`  id:          ${p.id}`);
    console.log(`  cadre_type:  ${p.cadre_type ?? "NULL"}`);
    console.log(`  village:     ${p.village ?? "NULL"}`);
    console.log(`  panchayat:   ${p.panchayat ?? "NULL"}`);
    console.log(`  gender:      ${p.gender ?? "NULL"}`);
    console.log(`  join_date:   ${p.join_date ?? "NULL"}`);
    console.log(`  status:      ${p.status ?? "NULL"}`);
    console.log(`  created_at:  ${p.created_at}   ← key timestamp`);
    console.log(`  updated_at:  ${p.updated_at}`);
    // Is created_at == updated_at? (never edited)
    const neverEdited = p.created_at === p.updated_at;
    console.log(`  never_edited: ${neverEdited} (created_at === updated_at)`);
    console.log("");
  });

  // ---------- SECTION 4: CADRES WITH block_id (for comparison) ----------
  console.log(`=== SECTION 4: CADRES WITH block_id SET (${withBlockCadres.length} records) ===`);
  withBlockCadres.forEach((p, i) => {
    const blockName = blockMap.get(p.block_id) ?? `UNKNOWN UUID:${p.block_id}`;
    console.log(`[OK-${i+1}] ${p.full_name}`);
    console.log(`  user_id:    ${p.user_id}`);
    console.log(`  block_id:   ${p.block_id} → "${blockName}"`);
    console.log(`  created_at: ${p.created_at}`);
    console.log(`  updated_at: ${p.updated_at}`);
    const neverEdited = p.created_at === p.updated_at;
    console.log(`  never_edited: ${neverEdited}`);
    console.log("");
  });

  // ---------- SECTION 5: AVAILABLE BLOCKS ----------
  console.log(`=== SECTION 5: BLOCKS TABLE (${blocks.length} blocks) ===`);
  blocks.forEach(b => {
    console.log(`  "${b.name}" → id: ${b.id} | created: ${b.created_at}`);
  });

  // ---------- SECTION 6: ADMIN profile (who created users) ----------
  const adminProfiles = allProfiles.filter(p => (roleMap.get(p.id) ?? []).includes("admin"));
  console.log(`\n=== SECTION 6: ADMIN PROFILES (who can create cadres) ===`);
  adminProfiles.forEach(p => {
    console.log(`  ${p.full_name} (${p.user_id}) | created_at: ${p.created_at}`);
  });

  // ---------- SECTION 7: TIMELINE ANALYSIS ----------
  console.log(`\n=== SECTION 7: ALL PROFILES SORTED BY created_at (TIMELINE) ===`);
  const sorted = [...allProfiles].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  sorted.forEach((p, i) => {
    const roles = roleMap.get(p.id) ?? ["no-role"];
    const blockLabel = p.block_id ? (blockMap.get(p.block_id) ?? p.block_id) : "NULL ⚠";
    console.log(`[${i+1}] ${p.created_at}  ${p.full_name.padEnd(25)} roles=[${roles.join(",")}]  block=${blockLabel}`);
  });

  // ---------- SECTION 8: NULL block cadres — any activities? ----------
  console.log(`\n=== SECTION 8: ACTIVITIES for NULL-block cadres ===`);
  for (const p of nullBlockCadres) {
    const { data: acts, error: aErr } = await supabase
      .from("activities")
      .select("id, activity_date, activity_type, block_id, submitted_at")
      .eq("cadre_id", p.id)
      .order("submitted_at", { ascending: false })
      .limit(5);
    if (aErr) { console.log(`  [${p.full_name}] activities error: ${aErr.message}`); continue; }
    console.log(`  [${p.full_name}] activities: ${acts.length}`);
    acts.forEach(a => {
      const actBlock = a.block_id ? (blockMap.get(a.block_id) ?? a.block_id) : "NULL";
      console.log(`    → ${a.activity_date} | ${a.activity_type} | block_id=${actBlock} | submitted: ${a.submitted_at}`);
    });
  }

  // ---------- SUMMARY ----------
  console.log("\n============================================================");
  console.log("  SUMMARY");
  console.log("============================================================");
  console.log(`Total profiles:          ${allProfiles.length}`);
  console.log(`Cadre profiles:          ${cadreProfiles.length}`);
  console.log(`Cadres WITH block_id:    ${withBlockCadres.length}`);
  console.log(`Cadres WITH NULL block:  ${nullBlockCadres.length}  ← PROBLEM`);

  // Date range: when were null-block cadres created vs non-null
  if (nullBlockCadres.length > 0 && withBlockCadres.length > 0) {
    const nullDates = nullBlockCadres.map(p => p.created_at).sort();
    const okDates = withBlockCadres.map(p => p.created_at).sort();
    console.log(`\nNULL-block cadre created_at range:  ${nullDates[0]}  →  ${nullDates[nullDates.length-1]}`);
    console.log(`OK-block cadre created_at range:    ${okDates[0]}  →  ${okDates[okDates.length-1]}`);
  }

  // Pattern analysis on null-block cadres
  if (nullBlockCadres.length > 0) {
    console.log("\nNULL-block cadres — other fields populated?");
    nullBlockCadres.forEach(p => {
      const hasVillage  = !!p.village;
      const hasPanchayat = !!p.panchayat;
      const hasGender   = !!p.gender;
      const hasJoinDate = !!p.join_date;
      const hasStatus   = !!p.status;
      const hasPhone    = !!p.phone;
      const hasCadreType = !!p.cadre_type;
      console.log(`  ${p.full_name}: village=${hasVillage} panchayat=${hasPanchayat} gender=${hasGender} join_date=${hasJoinDate} status=${hasStatus} phone=${hasPhone} cadre_type=${hasCadreType}`);
    });
  }
}

run().catch(e => { console.error("FATAL:", e); process.exit(1); });
