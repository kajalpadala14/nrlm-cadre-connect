const { createClient } = require("@supabase/supabase-js");

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

async function check() {
  console.log("Checking if attendance_date exists in attendance table...");
  const { data, error } = await supabase
    .from("attendance")
    .select("id, date, attendance_date")
    .limit(1);

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log("Success! Columns: id, date, attendance_date exist.", data);
  }
}

check().catch(console.error);
