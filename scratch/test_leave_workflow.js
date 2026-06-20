import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
const envConfig = fs.readFileSync(envPath, "utf-8");
envConfig.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    process.env[key] = value;
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWorkflow() {
  console.log("=== LEAVE WORKFLOW DB DIAGNOSTICS ===");

  // 1. Fetch a cadre profile and their block
  const { data: cadres, error: cadreErr } = await supabase
    .from("profiles")
    .select("id, full_name, block_id")
    .limit(1);

  if (cadreErr || !cadres || cadres.length === 0) {
    console.error("No cadres found to test with:", cadreErr);
    return;
  }

  const testCadre = cadres[0];
  console.log(`Using test cadre: ${testCadre.full_name} (${testCadre.id}) in block ${testCadre.block_id}`);

  // Fetch block officers in this block
  const { data: officers, error: offErr } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("block_id", testCadre.block_id);
  
  console.log(`Found ${officers?.length || 0} profiles in this block:`, officers?.map(o => o.full_name));

  const fromDate = "2026-06-25";
  const toDate = "2026-06-27"; // 3 days

  // Clear any existing leave requests for these dates to avoid conflicts
  await supabase.from("leave_requests").delete().eq("cadre_id", testCadre.id).eq("from_date", fromDate);
  await supabase.from("attendance").delete().eq("cadre_id", testCadre.id).eq("date", fromDate);

  // 2. Insert leave request
  console.log("\n1. Inserting pending leave request...");
  const { data: leave, error: leaveErr } = await supabase
    .from("leave_requests")
    .insert({
      cadre_id: testCadre.id,
      block_id: testCadre.block_id,
      leave_type: "Casual",
      from_date: fromDate,
      to_date: toDate,
      total_days: 3,
      reason: "Automated verification test run",
      status: "pending"
    })
    .select()
    .single();

  if (leaveErr) {
    console.error("Failed to insert leave request:", leaveErr);
    return;
  }
  console.log("Leave request inserted:", leave.id);

  // 3. Verify notification created for block officer
  console.log("\n2. Checking new leave notification...");
  // Wait a moment for trigger
  await new Promise(r => setTimeout(r, 500));
  const { data: notifs, error: notifErr } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const newLeaveNotif = notifs?.find(n => n.title.includes("अवकाश अनुरोध / New Leave Request Received"));
  if (newLeaveNotif) {
    console.log("✅ Success! Notification created for block officer:", newLeaveNotif.message);
  } else {
    console.log("❌ Failed! No notification found for new leave request.");
  }

  // 4. Update status to approved
  console.log("\n3. Approving leave request...");
  const { data: updatedLeave, error: approveErr } = await supabase
    .from("leave_requests")
    .update({
      status: "approved",
      approved_by: testCadre.id, // simulating self or admin approval
      approval_remarks: "Looks good, approved."
    })
    .eq("id", leave.id)
    .select()
    .single();

  if (approveErr) {
    console.error("Failed to approve leave request:", approveErr);
    return;
  }
  console.log("Leave request updated to:", updatedLeave.status);

  // 5. Verify attendance updated automatically to 'on_leave'
  console.log("\n4. Checking attendance sync...");
  await new Promise(r => setTimeout(r, 500));
  const { data: attData, error: attErr } = await supabase
    .from("attendance")
    .select("*")
    .eq("cadre_id", testCadre.id)
    .gte("date", fromDate)
    .lte("date", toDate);

  if (attErr) {
    console.error("Failed to query attendance:", attErr);
  } else {
    console.log(`Found ${attData.length} attendance rows for dates ${fromDate} to ${toDate}`);
    attData.forEach(row => {
      console.log(`  Date: ${row.date} | Status: ${row.status} | Remarks: ${row.remarks}`);
    });
    if (attData.length === 3 && attData.every(r => r.status === "on_leave")) {
      console.log("✅ Success! Attendance rows automatically created and marked as 'on_leave'.");
    } else {
      console.log("❌ Failed! Attendance rows missing or incorrect status.");
    }
  }

  // 6. Verify approval notification sent to cadre
  console.log("\n5. Checking approval notification to cadre...");
  const { data: updatedNotifs } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", testCadre.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const approvalNotif = updatedNotifs?.find(n => n.title.includes("अवकाश स्वीकृत / Leave Approved"));
  if (approvalNotif) {
    console.log("✅ Success! Notification sent to cadre:", approvalNotif.message);
  } else {
    console.log("❌ Failed! No approval notification found for cadre.");
  }

  // Cleanup
  console.log("\n=== Cleaning up test data ===");
  await supabase.from("leave_requests").delete().eq("id", leave.id);
  await supabase.from("attendance").delete().eq("cadre_id", testCadre.id).gte("date", fromDate).lte("date", toDate);
  if (newLeaveNotif) await supabase.from("notifications").delete().eq("id", newLeaveNotif.id);
  if (approvalNotif) await supabase.from("notifications").delete().eq("id", approvalNotif.id);
  console.log("Cleanup complete!");
}

testWorkflow();
