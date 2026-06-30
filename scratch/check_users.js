import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const loadEnv = (filePath) => {
  if (fs.existsSync(filePath)) {
    const envConfig = fs.readFileSync(filePath, "utf-8");
    envConfig.split("\n").forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
};
loadEnv(path.resolve(process.cwd(), ".env"));
loadEnv(path.resolve(process.cwd(), ".env.local"));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function run() {
  console.log("=== USERS & ROLES ===");
  const { data: userRoles } = await supabase.from("user_roles").select("*");
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, block_id");
  const { data: blocks } = await supabase.from("blocks").select("id, name");

  const blockMap = new Map(blocks.map(b => [b.id, b.name]));
  const profileMap = new Map(profiles.map(p => [p.id, p]));

  userRoles.forEach(ur => {
    const prof = profileMap.get(ur.user_id);
    const name = prof ? prof.full_name : "Unknown";
    const blockName = prof && prof.block_id ? blockMap.get(prof.block_id) : "None";
    console.log(`User ID: ${ur.user_id} | Name: ${name} | Role: ${ur.role} | Block: ${blockName}`);
  });
}

run().catch(console.error);
