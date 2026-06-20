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
        if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
        process.env[key] = value;
      }
    });
  }
};
loadEnv(path.resolve(process.cwd(), ".env"));
loadEnv(path.resolve(process.cwd(), ".env.local"));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugBlockSummary() {
  const { data: blocks } = await supabase.from('blocks').select('id, name');
  const { data: cadreRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'cadre');
  const cadreIds = (cadreRoles || []).map(r => r.user_id);
  const { data: profiles } = await supabase.from('profiles').select('id, block_id, status').in('id', cadreIds);
  const { data: activities } = await supabase.from('activities').select('id, block_id, activity_date, status, village_name');
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: attendance } = await supabase.from('attendance').select('cadre_id, date, status').eq('date', todayStr);

  console.log("=== BLOCK-WISE SUMMARY DEBUG ===\n");
  console.log("Issues in current table:");
  console.log("1. 'Activities' = ALL TIME activities (not today / not filtered)");
  console.log("2. 'Cadres' = ALL profiles (incl. Inactive) — should be Active cadres only");
  console.log("3. No attendance rate per block");
  console.log("4. Block name shows with Hindi in parentheses (looks messy)\n");
  
  for (const block of blocks) {
    const blockProfiles = (profiles || []).filter(p => p.block_id === block.id);
    const activeCadres = blockProfiles.filter(p => (p.status ?? 'Active') === 'Active').length;
    const blockCadreIds = blockProfiles.map(p => p.id);
    
    const allActs = (activities || []).filter(a => a.block_id === block.id);
    const approvedActs = allActs.filter(a => a.status === 'Approved').length;
    const pendingActs = allActs.filter(a => a.status === 'Pending').length;
    const villages = new Set(allActs.map(a => a.village_name).filter(Boolean)).size;
    
    const todayAtt = (attendance || []).filter(a => blockCadreIds.includes(a.cadre_id));
    const present = todayAtt.filter(a => a.status === 'present').length;
    const leave = todayAtt.filter(a => a.status === 'on_leave').length;
    const attRate = activeCadres > 0 ? Math.round(((present + leave) / activeCadres) * 100) : 0;

    console.log(`Block: ${block.name}`);
    console.log(`  Active Cadres : ${activeCadres}`);
    console.log(`  Activities    : ${allActs.length} (Approved: ${approvedActs}, Pending: ${pendingActs})`);
    console.log(`  Villages      : ${villages}`);
    console.log(`  Today's Att.  : Present=${present}, Leave=${leave}, Rate=${attRate}%`);
    console.log();
  }
}

debugBlockSummary();
