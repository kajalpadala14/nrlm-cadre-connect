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

async function investigate() {
  // List all blocks
  const { data: blocks } = await supabase.from('blocks').select('id, name');
  console.log("=== ALL BLOCKS ===");
  console.log(JSON.stringify(blocks, null, 2));

  // List all distinct statuses in profiles
  const { data: profiles } = await supabase.from('profiles').select('id, status, block_id');
  const statuses = [...new Set(profiles.map(p => p.status))];
  console.log("\n=== DISTINCT PROFILE STATUSES ===");
  console.log(statuses);

  // Count per block
  for (const block of blocks) {
    const blockProfiles = profiles.filter(p => p.block_id === block.id);
    const allCount = blockProfiles.length;
    const activeCount = blockProfiles.filter(p => !p.status || p.status === 'Active').length;
    console.log(`Block: ${block.name} | Total profiles: ${allCount} | Active: ${activeCount}`);
  }
}

investigate();
