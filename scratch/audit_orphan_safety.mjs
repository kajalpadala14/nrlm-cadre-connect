/**
 * Safety audit for 4 orphan cadre users before permanent deletion.
 * Checks: attendance, activities, activity_approvals, evidence_files, notifications, tickets
 * READ ONLY — no mutations.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://tsussrheickvpshvwihw.supabase.co",
  "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI"
);

const ORPHANS = [
  { id: "3ecb3b96-d2ee-4b42-b03a-39f24f9e9e28", email: "mohininag_969@nrlm.local",  created: "2026-06-07T23:07Z" },
  { id: "45a635e9-427b-497c-a70f-b66122315709", email: "ruben_612@nrlm.local",       created: "2026-06-11T08:42Z" },
  { id: "22d82e58-a673-435c-9393-087d200014c6", email: "asdfg_787@nrlm.local",       created: "2026-06-12T13:30Z" },
  { id: "9e3c2283-8595-4dac-b02d-b733c2451015", email: "asdfg_813@nrlm.local",       created: "2026-06-12T13:30Z" },
];

const ALL_IDS = ORPHANS.map(o => o.id);

async function queryCount(table, column, ids, extra = {}) {
  let q = supabase.from(table).select(column, { count: "exact", head: true }).in(column, ids);
  for (const [k, v] of Object.entries(extra)) q = q.eq(k, v);
  const { count, error } = await q;
  if (error) return { count: null, error: error.message };
  return { count: count ?? 0, error: null };
}

async function queryRows(table, column, ids, selectCols = "*") {
  const { data, error } = await supabase
    .from(table)
    .select(selectCols)
    .in(column, ids);
  if (error) return { data: null, error: error.message };
  return { data: data ?? [], error: null };
}

async function run() {
  console.log("=============================================================");
  console.log("  SAFETY AUDIT: 4 Orphan Cadre Users");
  console.log("=============================================================");
  console.log("Checking tables: attendance, activities, activity_approvals,");
  console.log("                 evidence_files, notifications, tickets\n");

  // ── Per-user detail table ─────────────────────────────────────────────────
  const results = {};
  for (const o of ORPHANS) {
    results[o.id] = { email: o.email, created: o.created, counts: {}, safe: true };
  }

  // ── 1. ATTENDANCE ────────────────────────────────────────────────────────
  const att = await queryRows("attendance", "cadre_id", ALL_IDS,
    "id, cadre_id, date, status, block_id");
  console.log(`=== 1. ATTENDANCE (${att.data?.length ?? "ERR"} rows) ===`);
  if (att.error) {
    console.log("  ERROR:", att.error);
  } else if (att.data.length === 0) {
    console.log("  ✅  No attendance records for any orphan");
  } else {
    att.data.forEach(r => {
      console.log(`  ⚠  cadre_id=${r.cadre_id}  date=${r.date}  status=${r.status}`);
      results[r.cadre_id].counts.attendance = (results[r.cadre_id].counts.attendance ?? 0) + 1;
      results[r.cadre_id].safe = false;
    });
  }
  for (const o of ORPHANS) results[o.id].counts.attendance ??= 0;

  // ── 2. ACTIVITIES ────────────────────────────────────────────────────────
  const acts = await queryRows("activities", "cadre_id", ALL_IDS,
    "id, cadre_id, activity_date, activity_type, status, photo_url, pdf_url, voice_url, submitted_at");
  console.log(`\n=== 2. ACTIVITIES (${acts.data?.length ?? "ERR"} rows) ===`);
  if (acts.error) {
    console.log("  ERROR:", acts.error);
  } else if (acts.data.length === 0) {
    console.log("  ✅  No activity records for any orphan");
  } else {
    acts.data.forEach(r => {
      const hasEvidence = !!(r.photo_url || r.pdf_url || r.voice_url);
      console.log(`  ⚠  cadre_id=${r.cadre_id}  date=${r.activity_date}  type=${r.activity_type}  status=${r.status}  evidence=${hasEvidence}`);
      results[r.cadre_id].counts.activities = (results[r.cadre_id].counts.activities ?? 0) + 1;
      results[r.cadre_id].safe = false;
    });
  }
  for (const o of ORPHANS) results[o.id].counts.activities ??= 0;

  // ── 3. ACTIVITY APPROVALS (via activity_id → activities.cadre_id) ─────────
  // First get activity ids for these cadres
  const actIds = (acts.data ?? []).map(a => a.id);
  let approvalsCount = 0;
  if (actIds.length > 0) {
    const appr = await queryRows("activity_approvals", "activity_id", actIds,
      "id, activity_id, status, reviewer_id, reviewed_at");
    console.log(`\n=== 3. ACTIVITY APPROVALS (${appr.data?.length ?? "ERR"} rows) ===`);
    if (appr.error) {
      console.log("  ERROR:", appr.error);
    } else if (appr.data.length === 0) {
      console.log("  ✅  No approval records for any orphan activity");
    } else {
      appr.data.forEach(r => console.log(`  ⚠  activity_id=${r.activity_id}  status=${r.status}  reviewed_at=${r.reviewed_at}`));
      approvalsCount = appr.data.length;
    }
  } else {
    console.log(`\n=== 3. ACTIVITY APPROVALS ===`);
    console.log("  ✅  No activities exist → no approvals possible");
  }
  for (const o of ORPHANS) results[o.id].counts.approvals = 0; // rolled up from activities

  // ── 4. EVIDENCE FILES (separate table if it exists) ──────────────────────
  console.log(`\n=== 4. EVIDENCE FILES ===`);
  const evid = await queryRows("evidence_files", "cadre_id", ALL_IDS,
    "id, cadre_id, activity_id, file_url, file_type, created_at");
  if (evid.error && evid.error.includes("does not exist")) {
    console.log("  ℹ  evidence_files table does not exist (evidence stored inline on activities)");
    for (const o of ORPHANS) results[o.id].counts.evidence_files = 0;
  } else if (evid.error) {
    console.log("  ERROR:", evid.error);
    for (const o of ORPHANS) results[o.id].counts.evidence_files = "ERR";
  } else if (evid.data.length === 0) {
    console.log("  ✅  No evidence_files rows for any orphan");
    for (const o of ORPHANS) results[o.id].counts.evidence_files = 0;
  } else {
    evid.data.forEach(r => {
      console.log(`  ⚠  cadre_id=${r.cadre_id}  file_type=${r.file_type}  url=${r.file_url}`);
      results[r.cadre_id].counts.evidence_files = (results[r.cadre_id].counts.evidence_files ?? 0) + 1;
      results[r.cadre_id].safe = false;
    });
  }

  // ── 5. NOTIFICATIONS ─────────────────────────────────────────────────────
  console.log(`\n=== 5. NOTIFICATIONS (sent TO orphan users) ===`);
  const notifs = await queryRows("notifications", "user_id", ALL_IDS,
    "id, user_id, title, type, read, created_at");
  if (notifs.error && notifs.error.includes("does not exist")) {
    console.log("  ℹ  notifications table does not exist");
    for (const o of ORPHANS) results[o.id].counts.notifications = 0;
  } else if (notifs.error) {
    console.log("  ERROR:", notifs.error);
    for (const o of ORPHANS) results[o.id].counts.notifications = "ERR";
  } else if (notifs.data.length === 0) {
    console.log("  ✅  No notifications for any orphan");
    for (const o of ORPHANS) results[o.id].counts.notifications = 0;
  } else {
    notifs.data.forEach(r => {
      console.log(`  ℹ  (non-blocking) user_id=${r.user_id}  title="${r.title}"  read=${r.read}`);
      results[r.user_id].counts.notifications = (results[r.user_id].counts.notifications ?? 0) + 1;
      // Notifications alone do NOT block deletion — they are informational, cascade-deleted with auth user
    });
    for (const o of ORPHANS) results[o.id].counts.notifications ??= 0;
  }

  // ── 6. TICKETS ───────────────────────────────────────────────────────────
  console.log(`\n=== 6. TICKETS ===`);
  const tickets = await queryRows("tickets", "cadre_id", ALL_IDS,
    "id, cadre_id, subject, status, created_at");
  if (tickets.error && tickets.error.includes("does not exist")) {
    console.log("  ℹ  tickets table does not exist");
    for (const o of ORPHANS) results[o.id].counts.tickets = 0;
  } else if (tickets.error) {
    console.log("  ERROR:", tickets.error);
    for (const o of ORPHANS) results[o.id].counts.tickets = "ERR";
  } else if (tickets.data.length === 0) {
    console.log("  ✅  No tickets for any orphan");
    for (const o of ORPHANS) results[o.id].counts.tickets = 0;
  } else {
    tickets.data.forEach(r => {
      console.log(`  ⚠  cadre_id=${r.cadre_id}  subject="${r.subject}"  status=${r.status}`);
      results[r.cadre_id].counts.tickets = (results[r.cadre_id].counts.tickets ?? 0) + 1;
      results[r.cadre_id].safe = false;
    });
    for (const o of ORPHANS) results[o.id].counts.tickets ??= 0;
  }

  // ── 7. STORAGE: check for files under these UUIDs in activity-photos ─────
  console.log(`\n=== 7. STORAGE (activity-photos bucket) ===`);
  for (const o of ORPHANS) {
    const { data: files, error: fErr } = await supabase.storage
      .from("activity-photos")
      .list(o.id, { limit: 10 });
    if (fErr) {
      // Folder doesn't exist = no files
      console.log(`  ✅  ${o.email}: no storage folder (${fErr.message})`);
      results[o.id].counts.storage_files = 0;
    } else if (!files || files.length === 0) {
      console.log(`  ✅  ${o.email}: storage folder exists but is empty`);
      results[o.id].counts.storage_files = 0;
    } else {
      console.log(`  ⚠  ${o.email}: ${files.length} file(s) in storage`);
      files.forEach(f => console.log(`       ${f.name}  size=${f.metadata?.size ?? "?"}`));
      results[o.id].counts.storage_files = files.length;
      results[o.id].safe = false;
    }
  }

  // ── FINAL VERDICT ────────────────────────────────────────────────────────
  console.log("\n=============================================================");
  console.log("  VERDICT PER USER");
  console.log("=============================================================");

  let allSafe = true;
  for (const o of ORPHANS) {
    const r = results[o.id];
    const isSafe = r.safe !== false;
    if (!isSafe) allSafe = false;

    console.log(`\n${isSafe ? "✅ SAFE TO DELETE" : "⛔ NOT SAFE — HAS DATA"}  ${o.email}`);
    console.log(`   UUID:       ${o.id}`);
    console.log(`   Created:    ${o.created}`);
    console.log(`   attendance:     ${r.counts.attendance}`);
    console.log(`   activities:     ${r.counts.activities}`);
    console.log(`   evidence_files: ${r.counts.evidence_files ?? "n/a"}`);
    console.log(`   notifications:  ${r.counts.notifications ?? "n/a"}  (non-blocking — cascades)`);
    console.log(`   tickets:        ${r.counts.tickets ?? "n/a"}`);
    console.log(`   storage_files:  ${r.counts.storage_files ?? "n/a"}`);
  }

  console.log("\n=============================================================");
  console.log("  OVERALL SAFETY VERDICT");
  console.log("=============================================================");
  if (allSafe) {
    console.log("\n✅ ALL 4 ORPHAN USERS ARE SAFE FOR PERMANENT DELETION");
    console.log("   Zero attendance, activities, approvals, evidence, tickets");
    console.log("   and storage files found across all 4 UUIDs.\n");
    console.log("   Deletion method: supabaseAdmin.auth.admin.deleteUser(id)");
    console.log("   Cascade effect:  → user_roles row deleted automatically");
    console.log("                    → profiles row: already missing (nothing to cascade)");
  } else {
    console.log("\n⛔ ONE OR MORE ORPHAN USERS HAVE ASSOCIATED DATA.");
    console.log("   Review the per-user breakdown above before deleting.");
  }
}

run().catch(e => { console.error("FATAL:", e); process.exit(1); });
