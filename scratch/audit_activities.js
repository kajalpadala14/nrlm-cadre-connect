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
  console.log("=== AUDIT START ===");
  // Local dateStr logic from dashboard:
  const date = new Date();
  const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  console.log("Local dateStr (today):", localDateStr);

  // 1. Fetch activities submitted today
  const { data: activities, error: actError } = await supabase
    .from("activities")
    .select("id, cadre_id, activity_date, submitted_at, block_id, status, village_name, activity_type");
  if (actError) throw actError;

  console.log(`\nTotal activities in DB: ${activities.length}`);

  const activitiesToday = activities.filter(a => a.activity_date === localDateStr);
  console.log(`Activities with activity_date = '${localDateStr}': ${activitiesToday.length}`);
  activitiesToday.forEach(a => {
    console.log(`- ID: ${a.id}, Cadre ID: ${a.cadre_id}, Block ID: ${a.block_id}, Date: ${a.activity_date}, Submitted At: ${a.submitted_at}, Status: ${a.status}`);
  });

  // 2. Fetch all profiles to map cadre names and blocks
  const { data: profiles, error: profError } = await supabase
    .from("profiles")
    .select("id, full_name, block_id");
  if (profError) throw profError;
  const profileMap = new Map(profiles.map(p => [p.id, p]));

  // 3. Fetch blocks
  const { data: blocks, error: blockError } = await supabase
    .from("blocks")
    .select("id, name");
  if (blockError) throw blockError;
  const blockMap = new Map(blocks.map(b => [b.id, b.name]));

  console.log("\nActivities list for today mapped:");
  activitiesToday.forEach(a => {
    const prof = profileMap.get(a.cadre_id);
    const cadreName = prof ? prof.full_name : "Unknown";
    const cadreBlockId = prof ? prof.block_id : null;
    const cadreBlockName = cadreBlockId ? blockMap.get(cadreBlockId) : "None";
    const actBlockName = a.block_id ? blockMap.get(a.block_id) : "None";
    console.log(`- Activity ${a.id}: Cadre: ${cadreName} (Profile Block: ${cadreBlockName}), Activity Block: ${actBlockName}, Type: ${a.activity_type}, Village: ${a.village_name}`);
  });

  // 4. Fetch recent entries in activities to check if there are timezone/date offsets
  console.log("\nLatest 10 activities by submitted_at:");
  const sortedActivities = [...activities].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)).slice(0, 10);
  sortedActivities.forEach(a => {
    const prof = profileMap.get(a.cadre_id);
    const cadreName = prof ? prof.full_name : "Unknown";
    console.log(`- ID: ${a.id}, Date: ${a.activity_date}, Submitted At: ${a.submitted_at}, Cadre: ${cadreName}, Type: ${a.activity_type}`);
  });

  // 5. Check attendance count today
  const { data: attData, error: attError } = await supabase
    .from("attendance")
    .select("id, cadre_id, status, date, block_id");
  if (attError) throw attError;
  const attToday = attData.filter(a => a.date === localDateStr);
  console.log(`\nAttendance with date = '${localDateStr}': ${attToday.length}`);
  attToday.forEach(a => {
    const prof = profileMap.get(a.cadre_id);
    const cadreName = prof ? prof.full_name : "Unknown";
    console.log(`- Cadre: ${cadreName}, Status: ${a.status}, Block ID: ${a.block_id}`);
  });

  console.log("=== AUDIT END ===");
}

run().catch(console.error);
