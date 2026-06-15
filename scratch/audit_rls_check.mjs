/**
 * Check RLS policies on profiles table and verify why 4 cadre auth users
 * have no profiles row. Use service role (bypasses RLS) to confirm.
 * READ ONLY.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tsussrheickvpshvwihw.supabase.co";
const SERVICE_KEY  = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";

// Service role client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const MISSING_IDS = [
  "3ecb3b96-d2ee-4b42-b03a-39f24f9e9e28",  // mohininag_969  created 2026-06-07
  "45a635e9-427b-497c-a70f-b66122315709",  // ruben_612       created 2026-06-11
  "22d82e58-a673-435c-9393-087d200014c6",  // asdfg_787       created 2026-06-12
  "9e3c2283-8595-4dac-b02d-b733c2451015",  // asdfg_813       created 2026-06-12
];

async function run() {
  console.log("=== RLS + PROFILE EXISTENCE AUDIT ===\n");

  // Confirm service role can see everything (no RLS)
  const { data: allProfiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, block_id, created_at");
  if (pErr) { console.error("profiles query error:", pErr); process.exit(1); }

  console.log(`Total profiles (service role, no RLS): ${allProfiles.length}`);
  allProfiles.forEach(p => console.log(`  ${p.id}  ${p.full_name}  ${p.user_id}  block_id=${p.block_id ?? "NULL"}`));

  // Try inserting a dummy profile for one of the missing IDs (dry run — we'll rollback)
  // Actually, just check if they exist anywhere
  const { data: directCheck, error: dcErr } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, block_id, created_at")
    .in("id", MISSING_IDS);
  if (dcErr) { console.error("direct check error:", dcErr); }
  else {
    console.log(`\nDirect lookup for 4 missing UUIDs: ${directCheck.length} rows returned`);
    if (directCheck.length === 0) {
      console.log("CONFIRMED: No profiles rows exist for these 4 UUIDs — even with service role");
    }
    directCheck.forEach(p => console.log(`  FOUND: ${p.id}  ${p.full_name}`));
  }

  // Check auth user creation timestamps vs profile creation
  console.log("\n=== AUTH USERS: creation timeline ===");
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (authErr) { console.error(authErr); }
  else {
    const sorted = authData.users.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    sorted.forEach(u => {
      const profileExists = allProfiles.find(p => p.id === u.id);
      const isMissing = MISSING_IDS.includes(u.id);
      const status = profileExists ? `profile EXISTS (${profileExists.full_name})` : "NO PROFILE ROW ⚠";
      console.log(`  ${u.created_at}  ${u.email}  ${isMissing ? "← MISSING" : ""}  ${status}`);
    });
  }

  // Inspect user_id format for missing users vs working user
  console.log("\n=== user_id FORMAT ANALYSIS ===");
  const allRoles = await supabase.from("user_roles").select("user_id, role");
  const roleMap = new Map(allRoles.data?.map(r => [r.user_id, r.role]) ?? []);

  if (authData) {
    authData.users.forEach(u => {
      const userId = u.user_metadata?.user_id ?? "(no user_metadata.user_id)";
      const isMissing = MISSING_IDS.includes(u.id);
      console.log(`  ${isMissing ? "MISSING" : "OK     "}  email=${u.email}  user_metadata.user_id="${userId}"`);
    });
  }

  // Check if the createUser server fn rollback deleted profiles
  // (i.e. did profiles.insert succeed but user_roles.insert fail, causing auth user deletion but not profile deletion?)
  // We'll check: are there profiles with user_id matching pattern of deleted users?
  console.log("\n=== CHECKING: any profile with user_id matching 'mohininag', 'ruben', 'asdfg'? ===");
  const patterns = ["mohininag", "ruben", "asdfg"];
  for (const pat of patterns) {
    const { data: like, error: likeErr } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, block_id, created_at")
      .ilike("user_id", `%${pat}%`);
    if (likeErr) console.error(pat, likeErr.message);
    else console.log(`  Pattern '${pat}': ${like.length} rows → ${like.map(p => p.full_name).join(", ") || "none"}`);
  }

  // Summary
  console.log("\n=== CONCLUSION ===");
  console.log("4 auth users exist (confirmed email, confirmed=yes) with NO corresponding profiles row.");
  console.log("This means either:");
  console.log("  (A) profiles.insert() succeeded but auth user was deleted (rollback) but user_roles row persisted");
  console.log("  (B) profiles.insert() failed silently, but user_roles.insert succeeded, and no cleanup happened");
  console.log("  (C) profiles.insert() was never called (createUser bug)");
  console.log("  (D) profiles row was manually deleted later");
}

run().catch(e => { console.error("FATAL:", e); process.exit(1); });
