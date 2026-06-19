import { createClient } from "@supabase/supabase-js";

// Use the service role key to act as supabaseAdmin
const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function reset() {
  const users = [
    { id: '6f99e2a6-62ed-4cb9-b2ad-562b763dbd83', username: 'dharmedrathakur_339' },
    { id: 'e7beec78-b944-4f62-b667-641cb57b5d74', username: 'hemant_279' }
  ];
  
  for (const user of users) {
    console.log(`Resetting password for ${user.username}...`);
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: "NRLM-1234"
    });
    
    if (error) {
      console.error(`Error resetting ${user.username}:`, error.message);
    } else {
      console.log(`Success! Password reset to NRLM-1234 for ${user.username}`);
    }
  }
}

reset();
