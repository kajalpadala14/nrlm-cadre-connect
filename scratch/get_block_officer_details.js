import { createClient } from "@supabase/supabase-js";

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

async function getBlockOfficers() {
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "block_officer");
    
  const ids = userRoles.map(ur => ur.user_id);
  
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", ids);
    
  console.log("Block Officers:", profiles);
}

getBlockOfficers();
