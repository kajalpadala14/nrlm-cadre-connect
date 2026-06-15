import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tsussrheickvpshvwihw.supabase.co";
const supabaseKey = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runE2ETest() {
  console.log("=== STARTING E2E DB INTEGRATION TEST ===");

  try {
    // 1. Fetch a block
    const { data: blocks, error: blockErr } = await supabase
      .from("blocks")
      .select("id, name")
      .limit(1);

    if (blockErr || !blocks || blocks.length === 0) {
      throw new Error(`Failed to fetch a block: ${blockErr?.message || "no blocks found"}`);
    }
    const targetBlock = blocks[0];
    console.log(`- Target Block: ${targetBlock.name} (${targetBlock.id})`);

    // 2. Fetch a cadre profile
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, full_name, cadre_type")
      .limit(1);

    if (profileErr || !profiles || profiles.length === 0) {
      throw new Error(`Failed to fetch a profile: ${profileErr?.message || "no profiles found"}`);
    }
    const targetCadre = profiles[0];
    console.log(
      `- Target Cadre: ${targetCadre.full_name} (${targetCadre.id}) [Role: ${targetCadre.cadre_type}]`,
    );

    // 3. Insert a test activity using the current database columns
    console.log("- Attempting to insert an activity record...");
    const testActivity = {
      cadre_id: targetCadre.id,
      activity_date: new Date().toISOString().slice(0, 10),
      block_id: targetBlock.id,
      village_name: "E2E Test Village",
      activity_type: "Other",
      description: "This is a programmatic end-to-end test description.",
      photo_url: "https://example.com/e2e-test-photo.jpg",
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("activities")
      .insert(testActivity)
      .select();

    if (insertErr) {
      throw new Error(`Insert failed: ${insertErr.message}`);
    }

    const newActivity = inserted[0];
    console.log("✔ Insert Successful!");
    console.log("Inserted Activity details:", newActivity);

    // 4. Clean up: delete the test activity
    console.log("- Cleaning up: deleting the test activity...");
    const { error: deleteErr } = await supabase
      .from("activities")
      .delete()
      .eq("id", newActivity.id);

    if (deleteErr) {
      console.warn("Clean up warning: Failed to delete test activity:", deleteErr.message);
    } else {
      console.log("✔ Cleanup complete. Database status clean.");
    }

    console.log("\n=== E2E DB INTEGRATION TEST PASSED SUCCESSFULLY ===");
  } catch (err) {
    console.error("\n❌ E2E DB INTEGRATION TEST FAILED:", err.message);
    process.exit(1);
  }
}

runE2ETest();
