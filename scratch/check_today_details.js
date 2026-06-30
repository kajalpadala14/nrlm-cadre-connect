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
  const { data: activities, error } = await supabase
    .from("activities")
    .select("id, activity_date, cadre_id, block_id, photo_url, gps, submitted_at")
    .eq("activity_date", "2026-06-24");
  if (error) throw error;

  const { data: profiles } = await supabase.from("profiles").select("id, full_name");
  const profileMap = new Map(profiles.map(p => [p.id, p.full_name]));

  console.log("=== TODAY'S ACTIVITIES WITH DETAILS ===");
  activities.forEach(a => {
    const name = profileMap.get(a.cadre_id) || "Unknown";
    console.log(`Cadre: ${name}`);
    console.log(`  ID: ${a.id}`);
    console.log(`  Block ID: ${a.block_id}`);
    console.log(`  Photo URL: ${a.photo_url ? "SET" : "NULL"}`);
    console.log(`  GPS: ${a.gps}`);
    console.log(`  Submitted At: ${a.submitted_at}`);
  });
}

run().catch(console.error);
