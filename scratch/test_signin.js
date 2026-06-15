import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tsussrheickvpshvwihw.supabase.co";
const supabaseKey = "sb_publishable_v6TFVl8a8uOIRvoItEEeyg_f9h5DZ0G";
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Starting...");
supabase.auth.signInWithPassword({
  email: "admin@nrlm.local",
  password: "NRLM-1234",
}).then(({ data, error }) => {
  if (error) {
    console.log("Signin failed:", error.message);
  } else {
    console.log("Signin succeeded:", data.user.id);
  }
}).catch(err => {
  console.log("Caught exception:", err);
});
