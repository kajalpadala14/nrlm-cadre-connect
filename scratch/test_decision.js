import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tsussrheickvpshvwihw.supabase.co";
const supabaseKey = "sb_publishable_v6TFVl8a8uOIRvoItEEeyg_f9h5DZ0G";
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log("Signing in as admin...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: "admin@nrlm.local",
      password: "NRLM-1234",
    });

    if (authError) {
      console.error("Auth error:", authError.message);
      return;
    }

    console.log("Auth success. User ID:", authData.user.id);

    // Get any attendance record
    const { data: attendance, error: attError } = await supabase
      .from("attendance")
      .select("*")
      .limit(1);

    if (attError) {
      console.error("Error fetching attendance:", attError.message);
    } else if (attendance.length > 0) {
      const att = attendance[0];
      console.log(`Found attendance ID: ${att.id}. Attempting update...`);
      const { error: updateError } = await supabase
        .from("attendance")
        .update({ status: "present", updated_at: new Date().toISOString() })
        .eq("id", att.id);

      if (updateError) {
        console.error("Failed to update attendance status:", updateError.message);
      } else {
        console.log("Successfully updated attendance status!");
      }
    } else {
      console.log("No attendance records found to test update.");
    }

    // Try inserting notification
    console.log("\nAttempting to insert a notification...");
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: authData.user.id, // Notification to admin self
        title: "Test Notification",
        message: "This is a test notification from diagnosis script.",
        type: "info",
        read: false,
      });

    if (notifError) {
      console.error("Failed to insert notification:", notifError.message);
    } else {
      console.log("Successfully inserted notification!");
    }

  } catch (err) {
    console.error("Exception during test:", err);
  }
}

test();
