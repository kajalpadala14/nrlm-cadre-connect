// Dashboard Data Audit Script — no dotenv dependency
import { createClient } from "@supabase/supabase-js";

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

const today = new Date().toISOString().slice(0, 10);
console.log("=== DASHBOARD AUDIT ===");
console.log("Today:", today);

// 1. BLOCKS
const { data: blocks } = await supabase.from("blocks").select("id, name");
console.log("\n=== BLOCKS ===");
blocks?.forEach(b => console.log(`  ${b.name} -> ${b.id}`));
console.log("Count:", blocks?.length);

// 2. CADRES (user_roles + profiles)
const { data: cadreRoles, count: cadreCount } = await supabase
  .from("user_roles")
  .select("user_id", { count: "exact" })
  .eq("role", "cadre");
console.log("\n=== CADRES ===");
console.log("Total cadre roles:", cadreCount);

const cadreIds = cadreRoles?.map(r => r.user_id) || [];
let profiles = [];
if (cadreIds.length > 0) {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, block_id, cadre_type")
    .in("id", cadreIds);
  profiles = data || [];
}

const blockMap = new Map(blocks?.map(b => [b.id, b.name]) || []);
console.log("\nCadre -> Block mapping:");
profiles.forEach(p => {
  console.log(`  ${p.full_name} | block_id=${p.block_id} -> ${blockMap.get(p.block_id) || "NOT_FOUND"}`);
});

// 3. ATTENDANCE today
const { data: attToday } = await supabase.from("attendance").select("*").eq("date", today);
console.log("\n=== ATTENDANCE TODAY ===");
console.log("Records:", attToday?.length || 0);
attToday?.forEach(a => console.log(`  cadre=${a.cadre_id?.slice(0,8)} block=${a.block_id?.slice(0,8)||"NULL"} status=${a.status}`));

// All attendance
const { data: attAll } = await supabase.from("attendance").select("cadre_id, date, status, block_id").order("date", { ascending: false }).limit(20);
console.log("\n=== ALL ATTENDANCE (latest 20) ===");
attAll?.forEach(a => console.log(`  ${a.date} | cadre=${a.cadre_id?.slice(0,8)} | block=${a.block_id?.slice(0,8) || "NULL"} | ${a.status}`));

// 4. ALL ACTIVITIES
const { data: allActs } = await supabase
  .from("activities")
  .select("id, activity_date, activity_type, village_name, block_id, status, cadre_id, photo_url, submitted_at")
  .order("submitted_at", { ascending: false });
console.log("\n=== ALL ACTIVITIES ===");
console.log("Total:", allActs?.length);
allActs?.forEach(a => {
  const bn = blockMap.get(a.block_id) || "UNMAPPED";
  console.log(`  ${a.id.slice(0,8)} | date=${a.activity_date} | type=${a.activity_type} | village=${a.village_name} | block=${a.block_id?.slice(0,8)||"NULL"}->${bn} | status=${a.status} | photo=${a.photo_url?"Y":"N"}`);
});

// 5. ACTIVITIES TODAY
const actToday = allActs?.filter(a => a.activity_date === today) || [];
console.log("\n=== ACTIVITIES TODAY (date=" + today + ") ===");
console.log("Count:", actToday.length);
actToday.forEach(a => console.log(`  ${a.village_name} | ${a.activity_type} | ${a.status}`));
const villagesToday = new Set(actToday.map(r => r.village_name));
console.log("Villages:", [...villagesToday], "Count:", villagesToday.size);

// 6. PENDING
const pending = allActs?.filter(a => a.status === "Pending") || [];
console.log("\n=== PENDING ACTIVITIES ===");
console.log("Count:", pending.length);

// 7. BLOCK-WISE for today
console.log("\n=== BLOCK-WISE PERFORMANCE (today) ===");
blocks?.forEach(b => {
  const cadresInBlock = profiles.filter(p => p.block_id === b.id);
  const actsInBlock = actToday.filter(a => a.block_id === b.id);
  const attInBlock = attToday?.filter(a => a.block_id === b.id) || [];
  const presentInBlock = attInBlock.filter(a => a.status === "present");
  const villagesInBlock = new Set(actsInBlock.map(a => a.village_name));
  console.log(`  ${b.name}: cadres=${cadresInBlock.length} present=${presentInBlock.length} activities=${actsInBlock.length} villages=${villagesInBlock.size}`);
});

// 8. TYPE BREAKDOWN
console.log("\n=== ACTIVITY TYPE COUNTS ===");
const typeMap = {};
allActs?.forEach(a => { typeMap[a.activity_type] = (typeMap[a.activity_type] || 0) + 1; });
Object.entries(typeMap).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

// 9. DIAGNOSIS
console.log("\n=== ROOT CAUSE DIAGNOSIS ===");
const unmapped = allActs?.filter(a => a.block_id && !blockMap.has(a.block_id)) || [];
console.log("Activities with block_id NOT in blocks:", unmapped.length);
unmapped.forEach(a => console.log(`  ORPHAN: ${a.id.slice(0,8)} block_id=${a.block_id}`));

const nullBlock = allActs?.filter(a => !a.block_id) || [];
console.log("Activities with NULL block_id:", nullBlock.length);

const attUnmapped = attAll?.filter(a => a.block_id && !blockMap.has(a.block_id)) || [];
console.log("Attendance with block_id NOT in blocks:", attUnmapped.length);
attUnmapped.forEach(a => console.log(`  ORPHAN ATT: ${a.cadre_id?.slice(0,8)} block_id=${a.block_id}`));

const attNullBlock = attAll?.filter(a => !a.block_id) || [];
console.log("Attendance with NULL block_id:", attNullBlock.length);

// All unique activity dates
const allDates = [...new Set(allActs?.map(a => a.activity_date) || [])].sort();
console.log("\nAll activity dates:", allDates);
console.log("Dashboard query uses date:", today);
if (!allDates.includes(today)) {
  console.log("WARNING: No activities exist for today. Dashboard shows 0 for 'today' queries.");
  console.log("Activities exist on:", allDates.join(", "));
}

console.log("\n=== AUDIT COMPLETE ===");
