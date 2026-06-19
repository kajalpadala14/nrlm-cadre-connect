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
  console.log("=== RAW DATA COUNTS (ADMIN/UNFILTERED) ===");
  try {
    const { count: rawAtt, error: errAtt } = await supabase.from("attendance").select("*", { count: "exact", head: true });
    if (errAtt) console.error("Attendance query error:", errAtt);
    else console.log("Total Raw Attendance Rows:", rawAtt);

    const { count: rawAct, error: errAct } = await supabase.from("activities").select("*", { count: "exact", head: true });
    if (errAct) console.error("Activities query error:", errAct);
    else console.log("Total Raw Activities Rows:", rawAct);

    const { count: rawEv, error: errEv } = await supabase.from("evidence_files").select("*", { count: "exact", head: true });
    if (errEv) console.error("Evidence query error:", errEv);
    else console.log("Total Raw Evidence Files Rows:", rawEv);

    const { count: rawApp, error: errApp } = await supabase.from("activity_approvals").select("*", { count: "exact", head: true });
    if (errApp) console.error("Approvals query error:", errApp);
    else console.log("Total Raw Approvals Rows:", rawApp);
  } catch (e) {
    console.error("Exception occurred:", e);
  }
}

check();
