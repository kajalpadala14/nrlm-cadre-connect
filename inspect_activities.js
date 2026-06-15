import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tsussrheickvpshvwihw.supabase.co";
const supabaseKey = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data: activities, error } = await supabase
    .from("activities")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching activities:", error.message);
    return;
  }

  const { data: profiles } = await supabase.from("profiles").select("id, full_name");
  const { data: blocks } = await supabase.from("blocks").select("id, name");

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]));
  const blockMap = new Map(blocks?.map((b) => [b.id, b.name]));

  console.log("=== LATEST 10 ACTIVITIES IN DATABASE ===");
  activities.forEach((a, i) => {
    console.log(`[${i + 1}] Submitted At: ${a.submitted_at}`);
    console.log(`    ID: ${a.id}`);
    console.log(`    Cadre Name: ${profileMap.get(a.cadre_id) || "Unknown"} (ID: ${a.cadre_id})`);
    console.log(`    Block Name in DB: ${blockMap.get(a.block_id) || "NULL"} (ID: ${a.block_id})`);
    console.log(`    Village: ${a.village_name} | Type: ${a.activity_type}`);
    console.log("------------------------------------------");
  });
}

inspect();
