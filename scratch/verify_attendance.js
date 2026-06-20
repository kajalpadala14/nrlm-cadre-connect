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

// SSOT formula — same as src/lib/utils/attendance.ts
function calculateAttendanceRate(presentCount, leaveCount, totalActiveCadres) {
  if (!totalActiveCadres || totalActiveCadres <= 0) return 0;
  return Math.min(100, Math.round(((presentCount + leaveCount) / totalActiveCadres) * 100));
}

async function runVerification() {
  console.log("==========================================");
  console.log("    ATTENDANCE VERIFICATION (All Blocks)  ");
  console.log("==========================================\n");

  const todayStr = new Date().toISOString().slice(0, 10);
  console.log(`Date: ${todayStr}\n`);

  // Fetch all blocks
  const { data: blocks } = await supabase.from('blocks').select('id, name');

  // Fetch cadre user_ids (only cadre role)
  const { data: cadreRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'cadre');
  const cadreIds = (cadreRoles || []).map(r => r.user_id);

  // Fetch profiles of only cadres
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, block_id, status')
    .in('id', cadreIds);

  // Fetch today's attendance
  const { data: attendance } = await supabase
    .from('attendance')
    .select('id, cadre_id, date, status')
    .eq('date', todayStr);

  let districtActive = 0;
  let districtPresent = 0;
  let districtLeave = 0;
  let districtAbsent = 0;

  for (const block of blocks) {
    const blockProfiles = (profiles || []).filter(p => p.block_id === block.id);
    const activeCadres = blockProfiles.filter(p => (p.status ?? 'Active') === 'Active').length;

    const blockCadreIds = blockProfiles.map(p => p.id);
    const blockAtt = (attendance || []).filter(a => blockCadreIds.includes(a.cadre_id));

    const present = blockAtt.filter(a => a.status === 'present').length;
    const leave = blockAtt.filter(a => a.status === 'on_leave').length;
    const absentExplicit = blockAtt.filter(a => a.status === 'absent').length;
    const noRecord = activeCadres - present - leave - absentExplicit;
    const totalAbsent = absentExplicit + noRecord;

    const rate = calculateAttendanceRate(present, leave, activeCadres);

    districtActive += activeCadres;
    districtPresent += present;
    districtLeave += leave;
    districtAbsent += totalAbsent;

    console.log(`Block : ${block.name}`);
    console.log(`  Total Active Cadres : ${activeCadres}`);
    console.log(`  Present             : ${present}`);
    console.log(`  Leave (Approved)    : ${leave}`);
    console.log(`  Absent (Total)      : ${totalAbsent}  [Explicit: ${absentExplicit}, No Record: ${noRecord}]`);
    console.log(`  --> Attendance Rate : ${rate}%\n`);
  }

  const districtRate = calculateAttendanceRate(districtPresent, districtLeave, districtActive);
  console.log("==========================================");
  console.log("  DISTRICT-WIDE SUMMARY (Public Dashboard)");
  console.log("==========================================");
  console.log(`  Total Active Cadres : ${districtActive}`);
  console.log(`  Present             : ${districtPresent}`);
  console.log(`  Leave (Approved)    : ${districtLeave}`);
  console.log(`  Absent              : ${districtAbsent}`);
  console.log(`  --> Attendance Rate : ${districtRate}%`);
  console.log("==========================================");
}

runVerification();
