import { createClient } from "@supabase/supabase-js";

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

async function inspectUsers() {
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, block_id, blocks(name)");
  
  if (error) {
    console.error("Error fetching profiles:", error.message);
    return;
  }
  
  const { data: userRoles } = await supabase.from("user_roles").select("*");
  const roleMap = new Map();
  userRoles?.forEach(ur => {
    const list = roleMap.get(ur.user_id) || [];
    list.push(ur.role);
    roleMap.set(ur.user_id, list);
  });
  
  console.log("=== USERS IN SYSTEM ===");
  users.forEach(u => {
    const roles = roleMap.get(u.id) || [];
    const bn = u.blocks ? u.blocks.name : "No Block";
    console.log(`User: ${u.full_name} | ID: ${u.id} | Block: ${bn} (${u.block_id}) | Roles: ${roles.join(", ")}`);
  });
}

inspectUsers();
