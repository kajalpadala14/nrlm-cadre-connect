import { createClient } from "@supabase/supabase-js";

const url = "https://tsussrheickvpshvwihw.supabase.co";
const key = "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI";
const supabase = createClient(url, key);

// local helpers
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

function applyScopeToQuery(query, tableHasBlockId, blockId, cadreIds) {
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

async function simulate() {
  console.log("Simulating Dantewada Block Officer (dharmedrathakur_339)");
  
  // Dantewada Block ID
  const blockId = "1a61a61a-38bd-4178-9ca0-5dd236dabda1"; 
  const dateStr = "2026-06-19";
  const cadreIds = await getCadreIdsInBlock(blockId);
  console.log("Resolved Dantewada Cadre IDs count:", cadreIds.length);
  
  try {
    // 1. Dashboard Overview Queries (dbStats)
    console.log("\n1. Testing dashboard overview queries...");
    
    // total cadres
    const totalCadres = cadreIds.length;
    
    // attendance
    let attendanceQ = supabase.from("attendance").select("status, cadre_id, block_id");
    attendanceQ = applyScopeToQuery(attendanceQ, true, blockId, cadreIds);
    attendanceQ = attendanceQ.eq("date", dateStr);
    const { data: attData } = await attendanceQ;
    console.log("   - Attendance data length:", attData?.length);
    
    // activities overall
    let actAllQ = supabase.from("activities").select("status, activity_type, cadre_id, block_id");
    actAllQ = applyScopeToQuery(actAllQ, true, blockId, cadreIds);
    const { data: allActs } = await actAllQ;
    console.log("   - Activities overall length:", allActs?.length);
    
    // activities today
    let actTodayQ = supabase.from("activities").select("cadre_id, village_name, panchayat, photo_url, block_id");
    actTodayQ = applyScopeToQuery(actTodayQ, true, blockId, cadreIds);
    actTodayQ = actTodayQ.eq("activity_date", dateStr);
    const { data: actTodayRows } = await actTodayQ;
    console.log("   - Activities today length:", actTodayRows?.length);
    
    // pending list
    let pendingListQ = supabase
      .from("activities")
      .select("id, cadre_id, village_name, activity_type, submitted_at, status, block_id")
      .eq("status", "Pending");
    pendingListQ = applyScopeToQuery(pendingListQ, true, blockId, cadreIds);
    const { data: pendingActivitiesList } = await pendingListQ;
    console.log("   - Pending list length:", pendingActivitiesList?.length);
    
    // block-wise performance
    let blocksQuery = supabase.from("blocks").select("id, name");
    blocksQuery = blocksQuery.eq("id", blockId);
    const { data: blocksData } = await blocksQuery;
    console.log("   - Blocks data length:", blocksData?.length);
    
    if (blocksData) {
      const { data: cadreRoles } = await supabase.from("user_roles").select("user_id").eq("role", "cadre");
      const cadreIdsForBlock = cadreRoles?.map((r) => r.user_id) || [];
      const { data: profs } = await supabase.from("profiles").select("id, block_id, status").in("id", cadreIdsForBlock);
      const { data: acts } = await supabase.from("activities").select("block_id, cadre_id, village_name").eq("activity_date", dateStr);
      const { data: atts } = await supabase.from("attendance").select("block_id, status, cadre_id").eq("date", dateStr);
      
      const cadreToBlockMap = new Map(profs.map((p) => [p.id, p.block_id]));
      
      blocksData.map((b) => {
        const cadresInBlock = profs?.filter((p) => p.block_id === b.id) ?? [];
        const total = cadresInBlock.length;
        const presentAttInBlock = atts?.filter((a) => (a.block_id === b.id || cadreToBlockMap.get(a.cadre_id) === b.id) && a.status === "present") ?? [];
        const actsInBlock = acts?.filter((a) => a.block_id === b.id || cadreToBlockMap.get(a.cadre_id) === b.id) ?? [];
        return { name: b.name, total, activities: actsInBlock.length };
      });
      console.log("   - Block-wise mapping completed.");
    }
    
    // recent activities
    let recentQ = supabase.from("activities").select("id, cadre_id, village_name, activity_type, status, submitted_at, block_id").order("submitted_at", { ascending: false }).limit(6);
    recentQ = applyScopeToQuery(recentQ, true, blockId, cadreIds);
    const { data: dbRecent } = await recentQ;
    console.log("   - Recent activities length:", dbRecent?.length);
    
    // 2. lazy attDetailRows
    console.log("\n2. Testing lazy attendance detail queries...");
    let attDetailQ = supabase.from("attendance").select("cadre_id, status, check_in_at, block_id").eq("date", dateStr).eq("status", "present");
    attDetailQ = applyScopeToQuery(attDetailQ, true, blockId, cadreIds);
    const { data: attRecords } = await attDetailQ;
    console.log("   - Att records for details length:", attRecords?.length);
    
    // 3. Activities Page Query
    console.log("\n3. Testing Activities Page query...");
    let actsListQ = supabase.from("activities").select("*, profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type, block_id, blocks!profiles_block_id_fkey(name)), blocks(name)").order("submitted_at", { ascending: false }).limit(500);
    actsListQ = applyScopeToQuery(actsListQ, true, blockId, cadreIds);
    const { data: dbActivities, error: dbActErr } = await actsListQ;
    if (dbActErr) throw dbActErr;
    console.log("   - Activities page data length:", dbActivities?.length);
    
    const activitiesMapped = dbActivities.map((a) => ({
      id: a.id,
      block_name: a.blocks?.name || a.profiles?.blocks?.name || "Unknown Block",
    }));
    console.log("   - Activities mapped output first entry block name:", activitiesMapped[0]?.block_name);
    
    // 4. Attendance Page Query
    console.log("\n4. Testing Attendance Page queries...");
    let profilesQuery = supabase.from("profiles").select("id, full_name, cadre_type, block_id, blocks(name)").in("id", cadreIds);
    profilesQuery = profilesQuery.eq("block_id", blockId);
    const { data: attendanceProfiles } = await profilesQuery;
    console.log("   - Attendance profiles length:", attendanceProfiles?.length);
    
    // 5. Approvals Page Queries
    console.log("\n5. Testing Approvals Page queries...");
    let approvalQ = supabase.from("activities").select("*");
    approvalQ = applyScopeToQuery(approvalQ, true, blockId, cadreIds);
    const { data: approvals } = await approvalQ;
    console.log("   - Approvals activities length:", approvals?.length);
    
    // 6. Reports Page Queries
    console.log("\n6. Testing Reports Page queries...");
    let rptActQ = supabase.from("activities").select("*, profiles!activities_cadre_id_fkey_profiles(full_name, user_id, cadre_type, block_id, blocks!profiles_block_id_fkey(name)), blocks!activities_block_id_fkey(name)").order("activity_date", { ascending: false }).limit(5000);
    rptActQ = applyScopeToQuery(rptActQ, true, blockId, cadreIds);
    const { data: rptActData } = await rptActQ;
    console.log("   - Report activity raw length:", rptActData?.length);
    
    // 7. Evidence Gallery Queries
    console.log("\n7. Testing Evidence Gallery queries...");
    let evActQ = supabase.from("activities").select("*, profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type, block_id, blocks!profiles_block_id_fkey(name)), blocks(name)");
    evActQ = applyScopeToQuery(evActQ, true, blockId, cadreIds);
    const { data: evActs } = await evActQ;
    console.log("   - Evidence activities length:", evActs?.length);
    
    console.log("\nALL SIMULATIONS COMPLETED SUCCESSFULLY! NO CRASHES DETECTED.");
  } catch (err) {
    console.error("\nCRASH DETECTED IN SIMULATION:");
    console.error(err);
  }
}

simulate();
