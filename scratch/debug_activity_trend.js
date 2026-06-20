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

function last30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

async function debugActivityTrend() {
  const days = last30Days();
  const sinceStr = days[0];
  
  console.log(`=== ACTIVITY TREND DEBUG ===`);
  console.log(`Date range: ${sinceStr} to ${days[29]}`);
  console.log(`Total days array length: ${days.length}`);

  const { data: allActivities } = await supabase
    .from('activities')
    .select('id, activity_date, status')
    .gte('activity_date', sinceStr);

  console.log(`\nTotal activities in last 30 days: ${(allActivities || []).length}`);
  
  // Show what current buggy 5-day bucket logic produces
  console.log("\n=== CURRENT BUGGY 5-DAY BUCKET LOGIC ===");
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const start = days[i * 5];
    const end = days[Math.min(i * 5 + 4, 29)];
    const label = new Date(start).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const slice = (allActivities || []).filter(a => a.activity_date >= start && a.activity_date <= end);
    console.log(`  Bucket ${i+1}: ${start} to ${end} → ${slice.length} activities (label: "${label}")`);
    return { label, total: slice.length, approved: slice.filter(a => a.status === "Approved").length };
  });
  
  // Show what CORRECT daily logic would produce for last 30 days
  console.log("\n=== CORRECT DAILY LOGIC (last 30 days, grouped by day) ===");
  const dailyData = days.map(day => {
    const dayActs = (allActivities || []).filter(a => a.activity_date === day);
    if (dayActs.length > 0) {
      const label = new Date(day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      console.log(`  ${day} (${label}): total=${dayActs.length} approved=${dayActs.filter(a => a.status === "Approved").length}`);
    }
    return { day, count: dayActs.length };
  });
  
  const activeDays = dailyData.filter(d => d.count > 0);
  console.log(`\n  Active days (with ≥1 activity): ${activeDays.length} out of ${days.length}`);
}

debugActivityTrend();
