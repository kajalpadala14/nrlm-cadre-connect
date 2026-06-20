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

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
  const { data: users, error: userErr } = await supabase
    .from('profiles')
    .select('id, full_name, phone');
    
  if (userErr) {
    console.error('Error finding user:', userErr);
    return;
  }
  
  const matches = users.filter(u => 
    (u.full_name && u.full_name.toLowerCase().includes('basanti')) || 
    (u.phone && u.phone.toLowerCase().includes('8058')) ||
    (u.phone && u.phone.toLowerCase().includes('basanti'))
  );
  
  if (matches.length > 0) {
    console.log("Found potential matches:");
    console.log(matches);
    
    // Clear data for these matches
    for (const user of matches) {
      console.log(`Clearing data for ${user.full_name} (${user.id})...`);
      await supabase.from('evidence_files').delete().eq('cadre_id', user.id);
      await supabase.from('activity_attendance_links').delete().eq('cadre_id', user.id);
      await supabase.from('activities').delete().eq('cadre_id', user.id);
      await supabase.from('attendance').delete().eq('cadre_id', user.id);
      await supabase.from('leave_requests').delete().eq('cadre_id', user.id);
      console.log("Done.");
    }
  } else {
    console.log("Still no users found containing 'basanti' or '8058'. Showing a sample of 10 users:");
    console.log(users.slice(0, 10));
  }
}

listUsers();
