import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tsussrheickvpshvwihw.supabase.co";
const supabaseKey = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log("=== DIAGNOSIS START ===");
    
    // Fetch profiles
    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("*");
    if (profError) throw profError;
    console.log(`Profiles: ${profiles.length} found`);
    profiles.forEach(p => console.log(`- ID: ${p.id}, Name: ${p.full_name}, Cadre Type: ${p.cadre_type}, Status: ${p.status}`));

    // Fetch user roles
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");
    if (rolesError) throw rolesError;
    console.log(`\nUser Roles: ${roles.length} found`);
    roles.forEach(r => console.log(`- User: ${r.user_id}, Role: ${r.role}`));

    // Fetch enum values
    const { data: enumValues, error: enumError } = await supabase
      .rpc("get_enum_values", { enum_name: "attendance_status" }) // or we can use custom sql query using postgrest if we have a function, or just run query via rpc if available. Let's run raw SQL via a quick supabase RPC if exists, or query it. Wait, if there is no RPC, let's write an RPC or run a direct query. Wait! Let's run raw SQL. Does Supabase allow raw SQL? No, only via RPC. Let's see if we can query pg_enum using a standard select or RPC.
    
    // Instead of RPC, let's do a query that might fail if the enum value is wrong. Let's try inserting a dummy attendance record with status = 'pending_verification' to see if it succeeds or fails!
    console.log("\nTesting if we can insert 'pending_verification' status...");
    try {
      const tempId = "f1ba2965-0eae-4cc6-8df7-633ead580627"; // Pratik's ID
      const { data: testAtt, error: testError } = await supabase
        .from("attendance")
        .insert({
          cadre_id: tempId,
          date: "2026-06-09",
          status: "pending_verification"
        })
        .select();
      if (testError) {
        console.error("Failed to insert pending_verification status:", testError);
      } else {
        console.log("Successfully inserted pending_verification status!");
        // clean up
        await supabase.from("attendance").delete().eq("id", testAtt[0].id);
      }
    } catch (e) {
      console.error("Exception during test insert:", e);
    }

    // Fetch notifications
    const { data: notifications, error: notifError } = await supabase
      .from("notifications")
      .select("*");
    if (notifError) {
      console.log("Error fetching notifications table (maybe it doesn't exist?):", notifError.message);
    } else {
      console.log(`\nNotifications: ${notifications.length} records found`);
      notifications.forEach(n => console.log(`- ID: ${n.id}, User: ${n.user_id}, Title: ${n.title}, Type: ${n.type}`));
    }

    console.log("\n=== DIAGNOSIS END ===");
  } catch (err) {
    console.error("Error during diagnosis:", err);
  }
}

run();
