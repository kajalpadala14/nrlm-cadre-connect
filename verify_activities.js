import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tsussrheickvpshvwihw.supabase.co";
const supabaseKey = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Fetching a single row from public.activities...");
  const { data, error } = await supabase.from("activities").select("*").limit(1);
  if (error) {
    console.error("Fetch error:", error);
  } else {
    console.log("Fetch success. Row count:", data.length);
    if (data.length > 0) {
      console.log("Columns in activities:", Object.keys(data[0]));
      console.log("Row data:", data[0]);
    } else {
      console.log("Activities table is empty. Testing column queries...");
      const colsToTest = [
        "id",
        "cadre_id",
        "activity_date",
        "block_id",
        "village_name",
        "activity_type",
        "description",
        "photo_url",
        "submitted_at",
        "panchayat",
        "beneficiaries",
        "gps",
        "voice_url",
        "pdf_url",
        "status",
        "comment",
        "approval_status",
        "participants_count",
        "geolocation_lat",
        "geolocation_lng",
      ];

      for (const col of colsToTest) {
        const { error: colErr } = await supabase.from("activities").select(col).limit(1);
        if (colErr) {
          console.log(`- activities [${col}]: NOT PRESENT (${colErr.message})`);
        } else {
          console.log(`- activities [${col}]: PRESENT`);
        }
      }

      console.log("\nTesting profiles table columns...");
      const profileCols = [
        "id",
        "user_id",
        "full_name",
        "phone",
        "cadre_type",
        "block_id",
        "gender",
        "panchayat",
        "join_date",
        "status",
      ];
      for (const col of profileCols) {
        const { error: colErr } = await supabase.from("profiles").select(col).limit(1);
        if (colErr) {
          console.log(`- profiles [${col}]: NOT PRESENT (${colErr.message})`);
        } else {
          console.log(`- profiles [${col}]: PRESENT`);
        }
      }

      console.log("\nTesting storage buckets...");
      const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
      if (bucketErr) {
        console.log("Bucket listing error:", bucketErr.message);
      } else {
        console.log(
          "Found buckets:",
          buckets.map((b) => b.name),
        );
        const hasPhotoBucket = buckets.some((b) => b.name === "activity-photos");
        console.log(`- activity-photos bucket: ${hasPhotoBucket ? "PRESENT" : "NOT PRESENT"}`);
      }
    }
  }

  // Let's run a query to get columns of activities via sql if possible, or query information_schema if permitted
  console.log("\nAttempting to query table schema...");
}

check();
