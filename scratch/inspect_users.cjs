const { createClient } = require("@supabase/supabase-js");

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

async function inspect() {
  const { data: userRoles } = await supabase.from("user_roles").select("*");
  console.log("=== USER ROLES ===");
  console.log(userRoles);

  const { data: profiles } = await supabase.from("profiles").select("*");
  console.log("=== PROFILES ===");
  console.log(profiles);

  const { data: blocks } = await supabase.from("blocks").select("*");
  console.log("=== BLOCKS ===");
  console.log(blocks);
}

inspect().catch(console.error);
