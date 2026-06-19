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

async function checkPins() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  users.forEach(u => {
    const email = u.email || "";
    const userId = email.replace("@nrlm.local", "");
    if (userId.includes("dharmedra") || userId.includes("hemant") || userId === "admin") {
      console.log(`User: ${userId}`);
      console.log(`  Metadata:`, JSON.stringify(u.user_metadata));
      console.log(`  Raw user:`, JSON.stringify(u));
      console.log("-----------------------------------------");
    }
  });
}

checkPins();
