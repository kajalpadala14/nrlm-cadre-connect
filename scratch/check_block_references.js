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

async function checkReferences() {
  const { data: blocks } = await supabase.from('blocks').select('id, name, district_name');
  
  const { data: profiles } = await supabase.from('profiles').select('id, block_id');
  const { data: activities } = await supabase.from('activities').select('id, block_id');
  const { data: attendance } = await supabase.from('attendance').select('id, block_id');
  
  let leaves = [];
  try {
    const { data } = await supabase.from('leave_requests').select('id, block_id');
    leaves = data || [];
  } catch (e) {
    console.log("No leave_requests table or query failed");
  }

  console.log("=== BLOCK REFERENCE COUNTS ===");
  for (const block of blocks) {
    const pCount = profiles.filter(p => p.block_id === block.id).length;
    const actCount = activities.filter(a => a.block_id === block.id).length;
    const attCount = attendance.filter(a => a.block_id === block.id).length;
    const lCount = leaves.filter(l => l.block_id === block.id).length;
    
    console.log(`Block ID: ${block.id}`);
    console.log(`  Name: ${block.name} (District: ${block.district_name})`);
    console.log(`  Profiles: ${pCount}`);
    console.log(`  Activities: ${actCount}`);
    console.log(`  Attendance: ${attCount}`);
    console.log(`  Leave Requests: ${lCount}`);
    console.log("-----------------------------------------");
  }
}

checkReferences();
