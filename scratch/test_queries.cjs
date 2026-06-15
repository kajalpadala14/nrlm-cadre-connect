// Test Dashboard Queries
const { createClient } = require("@supabase/supabase-js");

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

async function test() {
  console.log("--- Querying profs with user_roles!inner(role) ---");
  try {
    const { data: profs, error: profsError } = await supabase
      .from("profiles")
      .select("id, block_id, user_roles!inner(role)")
      .eq("user_roles.role", "cadre");
    
    if (profsError) {
      console.error("Profs Error:", profsError);
    } else {
      console.log("Profs Count:", profs?.length);
      console.log("Profs Data:", profs);
    }
  } catch (err) {
    console.error("Caught error:", err);
  }

  console.log("\n--- Querying activities on 2025-05-20 ---");
  try {
    const { data: acts, error: actsError } = await supabase
      .from("activities")
      .select("block_id, cadre_id, village_name")
      .eq("activity_date", "2025-05-20");
    if (actsError) console.error("Acts Error:", actsError);
    else console.log("Acts 2025-05-20 Count:", acts?.length, acts);
  } catch (err) {
    console.error(err);
  }

  console.log("\n--- Querying activities on 2026-06-08 ---");
  try {
    const { data: acts, error: actsError } = await supabase
      .from("activities")
      .select("block_id, cadre_id, village_name")
      .eq("activity_date", "2026-06-08");
    if (actsError) console.error("Acts Error:", actsError);
    else console.log("Acts 2026-06-08 Count:", acts?.length, acts);
  } catch (err) {
    console.error(err);
  }
}

test().catch(console.error);
