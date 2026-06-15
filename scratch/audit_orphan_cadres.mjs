/**
 * Deep audit: 5 cadre roles but only 1 profile fetched.
 * Find the 4 "missing" cadre UUIDs and check their profiles directly.
 * READ ONLY.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://tsussrheickvpshvwihw.supabase.co",
  "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI"
);

async function run() {
  console.log("============================================================");
  console.log("  DEEP AUDIT: 5 cadre roles vs 1 profile in query");
  console.log("============================================================\n");

  // 1. ALL user_roles
  const { data: allRoles, error: rErr } = await supabase
    .from("user_roles")
    .select("id, user_id, role");
  if (rErr) { console.error(rErr); process.exit(1); }

  console.log(`=== ALL user_roles (${allRoles.length} rows) ===`);
  allRoles.forEach(r => console.log(`  role_id=${r.id}  user_id=${r.user_id}  role=${r.role}`));

  const cadreRows = allRoles.filter(r => r.role === "cadre");
  const cadreIds = cadreRows.map(r => r.user_id);
  console.log(`\nCadre UUIDs in user_roles: ${cadreIds.length}`);
  cadreIds.forEach((id, i) => console.log(`  [${i+1}] ${id}`));

  // 2. Fetch ALL profiles (not filtered)
  const { data: allProfiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, cadre_type, block_id, village, panchayat, gender, join_date, status, created_at, updated_at");
  if (pErr) { console.error(pErr); process.exit(1); }

  console.log(`\n=== ALL profiles rows returned (${allProfiles.length}) ===`);
  allProfiles.forEach(p => console.log(`  ${p.id}  ${p.full_name}  block_id=${p.block_id ?? "NULL"}`));

  const profileIds = new Set(allProfiles.map(p => p.id));

  // 3. Cross-reference: which cadre UUIDs have NO matching profile?
  const missingProfileIds = cadreIds.filter(id => !profileIds.has(id));
  const foundProfileIds = cadreIds.filter(id => profileIds.has(id));

  console.log(`\n=== CROSS-REFERENCE ===`);
  console.log(`Cadre UUIDs with a profiles row: ${foundProfileIds.length}`);
  foundProfileIds.forEach(id => {
    const p = allProfiles.find(p => p.id === id);
    console.log(`  FOUND:   ${id} → ${p.full_name} | block_id=${p.block_id ?? "NULL"} | created_at=${p.created_at}`);
  });

  console.log(`\nCadre UUIDs WITHOUT a profiles row: ${missingProfileIds.length}`);
  missingProfileIds.forEach(id => {
    console.log(`  MISSING: ${id}`);
  });

  // 4. Try fetching each missing UUID directly by id
  if (missingProfileIds.length > 0) {
    console.log(`\n=== DIRECT LOOKUP: profiles WHERE id IN (missing cadre UUIDs) ===`);
    const { data: directLookup, error: dlErr } = await supabase
      .from("profiles")
      .select("*")
      .in("id", missingProfileIds);
    if (dlErr) {
      console.error("Direct lookup error:", dlErr.message);
    } else {
      console.log(`Rows returned: ${directLookup.length}`);
      directLookup.forEach(p => {
        console.log(`  id=${p.id}  full_name=${p.full_name}  block_id=${p.block_id ?? "NULL ⚠"}  created_at=${p.created_at}  updated_at=${p.updated_at}`);
      });
    }

    // 5. Check via Supabase auth.admin to see if these are real auth users (requires service role)
    console.log(`\n=== CHECK: do these UUIDs exist in Supabase auth? ===`);
    console.log(`(Listing all auth users with service role key...)`);
    // We have service role key so can use auth.admin.listUsers
    const { data: authUsers, error: auErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (auErr) {
      console.error("auth.admin.listUsers error:", auErr.message);
    } else {
      const authUserMap = new Map(authUsers.users.map(u => [u.id, u]));
      console.log(`Total auth users: ${authUsers.users.length}`);
      console.log("\nAll auth users:");
      authUsers.users.forEach(u => {
        const hasProfile = profileIds.has(u.id);
        const role = allRoles.find(r => r.user_id === u.id)?.role ?? "(no role row)";
        console.log(`  ${u.id}  email=${u.email}  created=${u.created_at}  has_profile=${hasProfile}  role=${role}`);
      });

      console.log("\nMissing profile UUIDs — in auth?");
      missingProfileIds.forEach(id => {
        const authU = authUserMap.get(id);
        if (authU) {
          console.log(`  ${id} → AUTH EXISTS: email=${authU.email}  created=${authU.created_at}  confirmed=${authU.email_confirmed_at ? "yes" : "no"}`);
        } else {
          console.log(`  ${id} → NOT IN AUTH (orphan user_roles row!)`);
        }
      });
    }
  }

  // 6. Summary of all profiles: which have null block_id?
  console.log(`\n=== ALL PROFILES: block_id status ===`);
  const nullBlockProfiles = allProfiles.filter(p => !p.block_id);
  const withBlockProfiles = allProfiles.filter(p => !!p.block_id);
  console.log(`  With block_id:     ${withBlockProfiles.length}`);
  console.log(`  block_id = NULL:   ${nullBlockProfiles.length}`);
  if (nullBlockProfiles.length > 0) {
    console.log("  NULL block profiles:");
    nullBlockProfiles.forEach(p => {
      const roles = allRoles.filter(r => r.user_id === p.id).map(r => r.role);
      console.log(`    ${p.full_name} (${p.user_id}) | role=${roles.join(",")} | cadre_type=${p.cadre_type ?? "NULL"} | created_at=${p.created_at}`);
    });
  }
}

run().catch(e => { console.error("FATAL:", e); process.exit(1); });
