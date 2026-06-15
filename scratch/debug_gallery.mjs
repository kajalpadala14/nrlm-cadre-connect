import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://tsussrheickvpshvwihw.supabase.co",
  "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI"
);

console.log("=== EVIDENCE GALLERY FIX VERIFICATION ===\n");

// Exact query now used in dashboard.evidence.tsx after fix
const { data: activities, error } = await supabase
  .from("activities")
  .select("*, profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type), blocks(name)")
  .order("submitted_at", { ascending: false });

if (error) {
  console.error("❌ Query still failing:", error.message);
  process.exit(1);
}

const filtered = (activities ?? []).filter(a => !!a.photo_url);

console.log(`Total activities returned : ${(activities ?? []).length}`);
console.log(`Filtered (with photo_url) : ${filtered.length}`);
console.log(`Query error               : NONE ✅`);
console.log("");
console.log("Sample items:");
filtered.slice(0, 3).forEach((a, i) => {
  const profiles = a.profiles;
  console.log(`  [${i+1}] id=${a.id.slice(0,8)} | cadre=${profiles?.full_name ?? "?"} | village=${a.village_name} | status=${a.status}`);
  console.log(`       photo_url=${a.photo_url?.slice(0, 60)}...`);
});
console.log("\n✅ Evidence Gallery will now show " + filtered.length + " images");
