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
  console.log("=== TIMEZONE AUDIT START ===");

  // 1. Fetch activities
  const { data: activities, error } = await supabase
    .from("activities")
    .select("id, cadre_id, activity_date, submitted_at, block_id, status");
  if (error) throw error;

  console.log(`Loaded ${activities.length} activities.`);

  // 2. Map profiles to check cadre names
  const { data: profiles } = await supabase.from("profiles").select("id, full_name");
  const profileMap = new Map(profiles.map(p => [p.id, p.full_name]));

  // Compare activity_date (DATE, local) vs submitted_at (TIMESTAMPTZ, UTC) converted to IST date
  let mismatches = 0;
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;

  activities.forEach(a => {
    const submittedUtc = new Date(a.submitted_at);
    const submittedIst = new Date(submittedUtc.getTime() + IST_OFFSET);
    const submittedIstDateStr = submittedIst.toISOString().slice(0, 10);

    if (a.activity_date !== submittedIstDateStr) {
      mismatches++;
      const cadreName = profileMap.get(a.cadre_id) || "Unknown";
      console.log(`Mismatch found!`);
      console.log(`  Activity ID: ${a.id}`);
      console.log(`  Cadre: ${cadreName}`);
      console.log(`  DB activity_date: ${a.activity_date}`);
      console.log(`  DB submitted_at (UTC): ${a.submitted_at}`);
      console.log(`  Derived IST Date: ${submittedIstDateStr}`);
    }
  });

  console.log(`\nTotal mismatches: ${mismatches} out of ${activities.length} activities.`);
  console.log("=== TIMEZONE AUDIT END ===");
}

run().catch(console.error);
