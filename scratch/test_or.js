import { createClient } from "@supabase/supabase-js";

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

async function test() {
  const blockId = "1a61a61a-38bd-4178-9ca0-5dd236dabda1"; // Dantewada
  
  // SANGITA THAKUR and RADHIKA NAGESH are in Dantewada and have activities
  const cadreIds = [
    "d210080e-3a5d-450a-9847-7de31efc9fe2", // SANGITA THAKUR
    "ac30f9a1-0406-44a7-974d-6685fb714482"  // RADHIKA NAGESH
  ];
  
  // Test using .or with .in
  const { data: activities, error } = await supabase
    .from("activities")
    .select("id, cadre_id, block_id, village_name")
    .or(`block_id.eq.${blockId},cadre_id.in.(${cadreIds.join(",")})`)
    .limit(5);
    
  if (error) {
    console.error("Query Error:", error.message);
  } else {
    console.log("Query Succeeded. Results:");
    console.log(activities);
  }
}

test();
