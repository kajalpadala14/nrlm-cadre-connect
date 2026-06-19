import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
const envConfig = fs.readFileSync(envPath, "utf-8");
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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: activities } = await supabase.from("activities").select("id, block_id, cadre_id").limit(10);
  console.log("--- Activities (First 10) ---");
  console.log(activities);

  const { data: attendance } = await supabase.from("attendance").select("id, block_id, cadre_id").limit(10);
  console.log("\n--- Attendance (First 10) ---");
  console.log(attendance);
}

check();
