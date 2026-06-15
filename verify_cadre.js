import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://iqcvszljcbhdpeqasthv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxY3ZzemxqY2JoZHBlcWFzdGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTEyMDMsImV4cCI6MjA5NjIyNzIwM30.6Xaf-NHNeMhZiAgbfgxgxjkR3OqesyHGNtHjvgDYYCE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    console.log("Checking for cadres in the database...");

    // Get all user roles with role = 'cadre'
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("role", "cadre");

    if (rolesError) {
      console.log("Error fetching user roles:", rolesError.message);
      return;
    }

    console.log(`Found ${roles.length} user role(s) with 'cadre' role.`);

    if (roles.length > 0) {
      console.log("Cadre role entries:");
      console.log(roles);

      const cadreIds = roles.map((r) => r.user_id);

      // Fetch corresponding profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", cadreIds);

      if (profilesError) {
        console.log("Error fetching profiles:", profilesError.message);
      } else {
        console.log(`Found ${profiles.length} corresponding cadre profiles.`);
        console.log("Profiles list:");
        console.log(profiles);
      }
    } else {
      console.log("No cadres found. Try adding a cadre in the UI first.");
    }
  } catch (err) {
    console.error("Diagnostic error:", err);
  }
}

check();
