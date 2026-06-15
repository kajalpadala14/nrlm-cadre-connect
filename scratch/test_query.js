import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tsussrheickvpshvwihw.supabase.co";
const supabaseKey = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Running query...");
  const { data, error } = await supabase
    .from("activities")
    .select(`
      *,
      profiles(full_name, cadre_type),
      blocks(name)
    `)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error details:", error.details);
    console.error("Error hint:", error.hint);
  } else {
    console.log("Success! Fetched rows:", data.length);
  }
}

test();
