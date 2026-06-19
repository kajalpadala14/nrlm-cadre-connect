import { createClient } from "@supabase/supabase-js";

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

// Mimic local data-scope functions in JS
async function getCadreIdsInBlock(blockId) {
  const { data: userRoles, error: urError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "cadre");
  if (urError || !userRoles) return [];
  const allCadreIds = userRoles.map((r) => r.user_id);
  if (allCadreIds.length === 0) return [];

  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("id")
    .eq("block_id", blockId)
    .in("id", allCadreIds);
  if (pError || !profiles) return [];
  return profiles.map((p) => p.id);
}

function applyScope(query, tableHasBlockId, blockId, cadreIds) {
  if (!blockId) return query;
  if (tableHasBlockId) {
    if (cadreIds.length > 0) {
      return query.or(`block_id.eq.${blockId},cadre_id.in.(${cadreIds.join(",")})`);
    } else {
      return query.eq("block_id", blockId);
    }
  } else {
    if (cadreIds.length > 0) {
      return query.in("cadre_id", cadreIds);
    } else {
      return query.eq("cadre_id", "00000000-0000-0000-0000-000000000000");
    }
  }
}

async function runVerification() {
  console.log("=== UNIVERSAL MULTI-BLOCK DATA SCOPING VERIFICATION ===");
  
  // 1. Fetch all blocks
  const { data: blocks } = await supabase.from("blocks").select("id, name").order("name");
  console.log("\nBlocks found in DB:");
  blocks.forEach(b => console.log(`  - ${b.name} (ID: ${b.id})`));
  
  // 2. We'll run the verify for each block and for admin
  const testCases = [
    { roleName: "Admin", blockId: null, blockName: "District-wide" },
    ...blocks.map(b => ({ roleName: `BPM / Block Officer`, blockId: b.id, blockName: b.name }))
  ];
  
  for (const tc of testCases) {
    console.log(`\n======================================================`);
    console.log(`TESTING ROLE: ${tc.roleName} | Scope: ${tc.blockName}`);
    console.log(`======================================================`);
    
    const blockId = tc.blockId;
    const cadreIds = blockId ? await getCadreIdsInBlock(blockId) : [];
    console.log(`Total Cadres in scope: ${blockId ? cadreIds.length : "All"}`);
    
    // Test 1: Cadre list
    let cadreQ = supabase.from("profiles").select("id, full_name");
    const { count: totalCadresGlobal } = await supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "cadre");
    
    let cadreCountLocal = 0;
    if (!blockId) {
      cadreCountLocal = totalCadresGlobal;
    } else {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("block_id", blockId).in("id", cadreIds);
      cadreCountLocal = count ?? 0;
    }
    console.log(`1. Cadre Management:`);
    console.log(`   - Before Filtering (District Total): ${totalCadresGlobal}`);
    console.log(`   - After Filtering: ${cadreCountLocal}`);
    
    // Test 2: Attendance (Today)
    const today = new Date().toISOString().slice(0, 10);
    const { count: attGlobal } = await supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today);
    
    let attQ = supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today);
    if (blockId) attQ = applyScope(attQ, true, blockId, cadreIds);
    const { count: attLocal } = await attQ;
    console.log(`2. Attendance Today (${today}):`);
    console.log(`   - Before Filtering (District Total): ${attGlobal ?? 0}`);
    console.log(`   - After Filtering: ${attLocal ?? 0}`);
    
    // Test 3: Activities Total
    const { count: actGlobal } = await supabase.from("activities").select("id", { count: "exact", head: true });
    
    let actQ = supabase.from("activities").select("id", { count: "exact", head: true });
    if (blockId) actQ = applyScope(actQ, true, blockId, cadreIds);
    const { count: actLocal } = await actQ;
    console.log(`3. Activity Tracking (Lifetime Total):`);
    console.log(`   - Before Filtering (District Total): ${actGlobal ?? 0}`);
    console.log(`   - After Filtering: ${actLocal ?? 0}`);
    
    // Test 4: Pending Approvals
    const { count: pendGlobal } = await supabase.from("activities").select("id", { count: "exact", head: true }).eq("status", "Pending");
    
    let pendQ = supabase.from("activities").select("id", { count: "exact", head: true }).eq("status", "Pending");
    if (blockId) pendQ = applyScope(pendQ, true, blockId, cadreIds);
    const { count: pendLocal } = await pendQ;
    console.log(`4. Pending Activity Approvals:`);
    console.log(`   - Before Filtering (District Total): ${pendGlobal ?? 0}`);
    console.log(`   - After Filtering: ${pendLocal ?? 0}`);

    // Test 5: Attendance Verifications
    const { count: avGlobal } = await supabase.from("attendance").select("id", { count: "exact", head: true }).eq("status", "pending_verification");
    
    let avQ = supabase.from("attendance").select("id", { count: "exact", head: true }).eq("status", "pending_verification");
    if (blockId) avQ = applyScope(avQ, true, blockId, cadreIds);
    const { count: avLocal } = await avQ;
    console.log(`5. Pending Attendance Verifications:`);
    console.log(`   - Before Filtering (District Total): ${avGlobal ?? 0}`);
    console.log(`   - After Filtering: ${avLocal ?? 0}`);

    // Test 6: Evidence Gallery
    // First fetch activities scoped, then evidence_files linked
    let evActsQ = supabase.from("activities").select("id");
    if (blockId) evActsQ = applyScope(evActsQ, true, blockId, cadreIds);
    const { data: evActs } = await evActsQ;
    const evActIds = (evActs ?? []).map(a => a.id);
    
    const { count: evGlobal } = await supabase.from("evidence_files").select("id", { count: "exact", head: true }).like("mime_type", "image/%");
    
    let evCountLocal = 0;
    if (!blockId) {
      evCountLocal = evGlobal ?? 0;
    } else if (evActIds.length > 0) {
      const { count } = await supabase.from("evidence_files").select("id", { count: "exact", head: true }).in("activity_id", evActIds).like("mime_type", "image/%");
      evCountLocal = count ?? 0;
    }
    console.log(`6. Evidence Gallery (Photos):`);
    console.log(`   - Before Filtering (District Total): ${evGlobal ?? 0}`);
    console.log(`   - After Filtering: ${evCountLocal}`);
  }
  
  console.log("\n=== VERIFICATION COMPLETE ===");
}

runVerification();
