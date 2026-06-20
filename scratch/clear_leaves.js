import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables manually without dotenv
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
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
}

// Support both .env and .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, "utf-8");
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

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env or .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDummyLeaves() {
  console.log('Fetching leave requests...');
  const { data, error } = await supabase.from('leave_requests').select('*');
  
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log(`Found ${data.length} leave requests.`);
  
  if (data.length > 0) {
    console.log('Deleting all leave requests...');
    const { error: delErr } = await supabase
      .from('leave_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
      
    if (delErr) {
      console.error('Error deleting:', delErr);
    } else {
      console.log('Successfully deleted all dummy leave requests.');
    }
  }
  
  console.log('Cleaning up any dummy attendance records marked as on_leave...');
  const { error: attErr } = await supabase
    .from('attendance')
    .delete()
    .eq('status', 'on_leave');
    
  if (attErr) {
    console.error('Error cleaning attendance:', attErr);
  } else {
    console.log('Cleaned up associated attendance records.');
  }
}

clearDummyLeaves();
