/**
 * Permanently delete 4 orphan cadre users from Supabase auth.
 * Safety audit confirmed: zero attendance, activities, approvals, evidence, tickets.
 * Cascade: user_roles rows will be auto-deleted via FK ON DELETE CASCADE.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://tsussrheickvpshvwihw.supabase.co",
  "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI"
);

const ORPHANS = [
  { id: "3ecb3b96-d2ee-4b42-b03a-39f24f9e9e28", email: "mohininag_969@nrlm.local" },
  { id: "45a635e9-427b-497c-a70f-b66122315709", email: "ruben_612@nrlm.local" },
  { id: "22d82e58-a673-435c-9393-087d200014c6", email: "asdfg_787@nrlm.local" },
  { id: "9e3c2283-8595-4dac-b02d-b733c2451015", email: "asdfg_813@nrlm.local" },
];

async function run() {
  console.log("=== DELETING 4 ORPHAN CADRE USERS ===\n");

  let successCount = 0;

  for (const user of ORPHANS) {
    process.stdout.write(`Deleting ${user.email} (${user.id}) ... `);
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.log(`FAILED: ${error.message}`);
    } else {
      console.log("DELETED ✅");
      successCount++;
    }
  }

  console.log(`\n=== DONE: ${successCount}/${ORPHANS.length} users deleted ===`);

  // Verify: confirm user_roles are gone
  console.log("\n=== VERIFYING user_roles cleanup ===");
  const { data: remaining } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("user_id", ORPHANS.map(o => o.id));
  
  if (!remaining || remaining.length === 0) {
    console.log("✅ user_roles: all orphan rows removed (cascade worked)");
  } else {
    console.log(`⚠  ${remaining.length} user_roles rows still present:`);
    remaining.forEach(r => console.log(`   user_id=${r.user_id}  role=${r.role}`));
  }

  // Verify: confirm auth users are gone
  console.log("\n=== VERIFYING auth.users cleanup ===");
  const { data: authData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const remainingAuth = authData?.users.filter(u => ORPHANS.some(o => o.id === u.id)) ?? [];
  if (remainingAuth.length === 0) {
    console.log("✅ auth.users: all 4 orphan users removed");
  } else {
    console.log(`⚠  ${remainingAuth.length} auth users still present:`);
    remainingAuth.forEach(u => console.log(`   ${u.email}`));
  }

  // Final state
  console.log("\n=== FINAL STATE ===");
  const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
  const cadreCount = allRoles?.filter(r => r.role === "cadre").length ?? 0;
  console.log(`Total cadre roles remaining: ${cadreCount}`);
  console.log("(Should be 1 — Kajal Padala only)");
}

run().catch(e => { console.error("FATAL:", e); process.exit(1); });
