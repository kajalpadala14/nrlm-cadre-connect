import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tsussrheickvpshvwihw.supabase.co";
const supabaseKey = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log("=== DB MUTATION TEST (SERVICE ROLE) ===");

    // Fetch an attendance record
    const { data: attendance, error: attError } = await supabase
      .from("attendance")
      .select("*")
      .limit(1);

    if (attError) {
      console.error("Error fetching attendance:", attError.message);
      return;
    }

    if (attendance.length === 0) {
      console.log("No attendance records found.");
      return;
    }

    const att = attendance[0];
    console.log(`Testing update on attendance ID: ${att.id}`);

    const { data: updatedAtt, error: updateError } = await supabase
      .from("attendance")
      .update({ status: "present", updated_at: new Date().toISOString() })
      .eq("id", att.id)
      .select();

    if (updateError) {
      console.error("Attendance update failed:", updateError.message);
    } else {
      console.log("Attendance update succeeded! Updated record:", updatedAtt[0]);
    }

    // Testing notifications insert
    console.log("\nTesting insert on notifications...");
    const { data: insertedNotif, error: insertError } = await supabase
      .from("notifications")
      .insert({
        user_id: att.cadre_id,
        title: "Test Verification Title",
        message: "Test message from service role.",
        type: "success",
        read: false,
      })
      .select();

    if (insertError) {
      console.error("Notification insert failed:", insertError.message);
    } else {
      console.log("Notification insert succeeded! Inserted record:", insertedNotif[0]);
      
      // Clean up the notification
      await supabase.from("notifications").delete().eq("id", insertedNotif[0].id);
      console.log("Cleaned up notification.");
    }

    console.log("=== TEST COMPLETED ===");
  } catch (err) {
    console.error("Exception in test:", err);
  }
}

run();
