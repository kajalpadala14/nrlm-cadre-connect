import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually parse .env file
const envPath = path.resolve(process.cwd(), ".env");
const envConfig = fs.readFileSync(envPath, "utf-8");
envConfig.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    process.env[key] = value;
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
  console.log("Fetching profiles, roles and auth users...");

  // 1. Get blocks mapping
  const { data: blocks } = await supabase.from("blocks").select("id, name");
  const blockMap = new Map(blocks?.map(b => [b.id, b.name]) || []);

  // 2. Get profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, block_id, phone");

  // 3. Get user roles
  const { data: userRoles } = await supabase.from("user_roles").select("user_id, role");

  // 4. Get auth users
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error("Error listing auth users:", authErr);
    return;
  }

  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
  const rolesMap = new Map();
  userRoles?.forEach(ur => {
    if (!rolesMap.has(ur.user_id)) {
      rolesMap.set(ur.user_id, []);
    }
    rolesMap.get(ur.user_id).push(ur.role);
  });

  console.log("\n=== ADMIN & BLOCK OFFICERS ===");
  users.forEach(u => {
    const email = u.email || "";
    const userId = email.replace("@nrlm.local", "");
    const profile = profilesMap.get(u.id);
    const roles = rolesMap.get(u.id) || [];
    if (roles.includes("admin") || roles.includes("block_officer")) {
      const blockName = profile ? (blockMap.get(profile.block_id) || "None") : "None";
      console.log(`User ID (Login): ${userId}`);
      console.log(`  Email: ${email}`);
      console.log(`  Full Name: ${profile?.full_name || "N/A"}`);
      console.log(`  Roles: ${roles.join(", ")}`);
      console.log(`  Block: ${blockName} (ID: ${profile?.block_id || "N/A"})`);
      console.log(`  Phone: ${profile?.phone || "N/A"}`);
      console.log("-----------------------------------------");
    }
  });
}

listUsers();
