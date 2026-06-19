/**
 * FK RELATIONSHIP AUDIT
 * Tests if the FK join names used in the queries actually exist in Supabase
 */
import { createClient } from "@supabase/supabase-js";

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

// Test 1: The FK join used in dashboard.activities.tsx
console.log("\n=== TEST 1: activities.tsx FK join ===");
const { data: t1, error: e1 } = await supabase
  .from("activities")
  .select("id, cadre_id, profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type, block_id, blocks!profiles_block_id_fkey(name)), blocks(name)")
  .limit(3);
if (e1) console.log("ERROR:", e1.message, e1.hint);
else console.log("OK - rows:", t1?.length, "sample:", JSON.stringify(t1?.[0]?.profiles));

// Test 2: Simple join
console.log("\n=== TEST 2: activities simple join (no FK name) ===");
const { data: t2, error: e2 } = await supabase
  .from("activities")
  .select("id, cadre_id, profiles(full_name), blocks(name)")
  .limit(3);
if (e2) console.log("ERROR:", e2.message, e2.hint);
else console.log("OK - rows:", t2?.length, "sample profile:", t2?.[0]?.profiles?.full_name);

// Test 3: Attendance FK join used in reports
console.log("\n=== TEST 3: attendance FK join (reports.tsx) ===");
const { data: t3, error: e3 } = await supabase
  .from("attendance")
  .select("date, status, profiles!attendance_cadre_id_fkey(full_name, user_id, cadre_type, village, blocks!profiles_block_id_fkey(name))")
  .limit(3);
if (e3) console.log("ERROR:", e3.message, e3.hint);
else console.log("OK - rows:", t3?.length, "sample:", JSON.stringify(t3?.[0]?.profiles));

// Test 4: Check what FK names actually exist
console.log("\n=== TEST 4: Test attendance simple join ===");
const { data: t4, error: e4 } = await supabase
  .from("attendance")
  .select("date, status, profiles(full_name)")
  .limit(3);
if (e4) console.log("ERROR:", e4.message, e4.hint);
else console.log("OK - rows:", t4?.length, "sample:", t4?.[0]?.profiles?.full_name);

// Test 5: Evidence files table with cadre_id join
console.log("\n=== TEST 5: evidence_files join ===");
const { data: t5, error: e5 } = await supabase
  .from("evidence_files")
  .select("id, activity_id, cadre_id, public_url, mime_type")
  .limit(5);
if (e5) console.log("ERROR:", e5.message);
else console.log("OK - rows:", t5?.length, "sample:", JSON.stringify(t5?.[0]));

// Test 6: Test activities with cadre_id IN filter
console.log("\n=== TEST 6: activities with IN filter ===");
// Use known Dantewada cadre IDs from previous audit
const dantewadaCadreIds = [
  "59b5e307-0000-0000-0000-000000000000",  // wrong UUID, just testing
];
// Actually get real cadre IDs
const { data: uroles } = await supabase.from("user_roles").select("user_id").eq("role", "cadre");
const allCadreIds = (uroles ?? []).map(r => r.user_id);
const { data: dantewadaProfiles } = await supabase
  .from("profiles")
  .select("id, full_name")
  .eq("block_id", "1a61a61a-38bd-4178-9ca0-5dd236dabda1")
  .in("id", allCadreIds);
const dIds = (dantewadaProfiles ?? []).map(p => p.id);
console.log(`Dantewada cadre IDs: ${dIds.length}`);

if (dIds.length > 0) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: acts, error: actsErr } = await supabase
    .from("activities")
    .select("id, cadre_id, village_name, activity_date, status, profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type, block_id, blocks!profiles_block_id_fkey(name)), blocks(name)")
    .in("cadre_id", dIds)
    .order("submitted_at", { ascending: false })
    .limit(10);
  if (actsErr) console.log("ERROR with FK join + IN filter:", actsErr.message);
  else {
    console.log(`Activities for Dantewada cadres: ${acts?.length}`);
    acts?.slice(0, 3).forEach(a => {
      const pName = a.profiles?.full_name;
      const bName = a.blocks?.name || a.profiles?.blocks?.name;
      console.log(`  ${a.village_name} | ${a.status} | cadre=${pName || a.cadre_id.slice(0,8)} | block=${bName || "?"}`);
    });
  }
}

// Test 7: Check if getCadreIdsInBlock("none") returns empty correctly
console.log("\n=== TEST 7: getCadreIdsInBlock with invalid block ID ===");
const { data: badProfiles, error: badErr } = await supabase
  .from("profiles")
  .select("id")
  .eq("block_id", "none")
  .in("id", allCadreIds);
console.log(`Profiles with block_id='none': ${badProfiles?.length ?? 0} (should be 0)`);
if (badErr) console.log("Error:", badErr.message);

console.log("\n=== ALL FK TESTS COMPLETE ===\n");
