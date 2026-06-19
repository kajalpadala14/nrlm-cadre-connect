import { createClient } from "@supabase/supabase-js";

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

async function findAdmin() {
  const { data: admins } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .eq("role", "admin");
    
  console.log("Admins:", admins);
}

findAdmin();
