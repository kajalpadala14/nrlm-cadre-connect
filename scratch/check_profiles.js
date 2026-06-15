import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tsussrheickvpshvwihw.supabase.co";
const supabaseKey = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: activities } = await supabase.from("activities").select("cadre_id");
  const { data: profiles } = await supabase.from("profiles").select("id");

  const profileIds = new Set(profiles.map(p => p.id));
  const orphans = activities.filter(a => !profileIds.has(a.cadre_id));

  console.log("Total activities:", activities.length);
  console.log("Orphan activities (cadre_id not in profiles):", orphans.length);
  if (orphans.length > 0) {
    console.log("Orphan cadre_ids:", orphans.map(o => o.cadre_id));
  }
}

test();
