# NRLM Reports Module — Requirements

## Overview
A unified, exportable Reports Module for Government NRLM field operations. Replaces the current
`dashboard.reports.tsx` (activity-only, no attendance/evidence/approvals) with a complete
six-report system. All reports are accessible to `admin` and `block_officer` roles only.

---

## Actors

| Actor | Access |
|---|---|
| Admin | All reports, all blocks |
| Block Officer | All reports, own block only (auto-scoped) |
| Cadre | No access to this module |

---

## Global Requirements

### GR-1 — Custom Date Range Filter
Every report must include a date range filter with:
- **From Date** (कब से) — date input, defaults to first day of current month
- **To Date** (कब तक) — date input, defaults to today
- Validation: `to_date >= from_date`; reject if reversed

### GR-2 — Quick Selection Presets
Every report must provide one-click presets that auto-fill From/To:
1. **Today** — from = today, to = today
2. **This Week** — from = Monday of current week, to = today
3. **This Month** — from = first of current month, to = today
4. **Last Month** — from = first of last month, to = last day of last month
5. **Custom Range** — user manually sets both dates (no auto-fill)

### GR-3 — Block Filter
- Admins see a block selector dropdown (All Blocks + each block by name)
- Block Officers see only their assigned block (selector hidden or locked)
- Default: All Blocks for admins

### GR-4 — Date Range in Report Headers
The rendered preview table must show the selected date range in a header line:
> "रिपोर्ट अवधि / Report Period: 01-06-2026 to 30-06-2026"

### GR-5 — Export File Naming
All exported files must embed the date range in the filename using the pattern:
`{report-type}-{from_date}-to-{to_date}.xlsx`

Examples:
- `activity-report-01-06-2026-to-30-06-2026.xlsx`
- `attendance-report-01-06-2026-to-30-06-2026.xlsx`
- `cadre-performance-01-06-2026-to-30-06-2026.xlsx`
- `block-performance-01-06-2026-to-30-06-2026.xlsx`
- `approval-report-01-06-2026-to-30-06-2026.xlsx`
- `evidence-report-01-06-2026-to-30-06-2026.xlsx`

### GR-6 — Export Format
- Primary export: `.xlsx` via the existing `exportToExcel()` in `src/lib/excel.ts`
- The `exportToExcel(rows, filename, sheetName)` function is reused as-is; no changes needed
- No CSV export in the Reports module (evidence page already has a standalone CSV)

### GR-7 — Preview Limit
- Screen preview capped at **200 rows** with a footer note:
  "Showing 200 of N. Use Excel export for full data."
- Excel export has a **5000 row hard limit** with a visible warning banner if results exceed 4800

### GR-8 — Role-based Query Scoping
- Block Officers: all queries automatically append `.eq("block_id", profile.block_id)`
- Admins: block filter is optional; when set, same `.eq("block_id", selectedBlockId)` applied

### GR-9 — Report Navigation
All six reports live inside a single page at `/dashboard/reports`.
Navigation between reports uses a tab strip (not separate routes).
Tab labels (bilingual):
- उपस्थिति / Attendance
- गतिविधि / Activity
- साक्ष्य / Evidence
- अनुमोदन / Approvals
- कैडर प्रदर्शन / Cadre Performance
- ब्लॉक प्रदर्शन / Block Performance

---

## Report 1 — Attendance Report (उपस्थिति रिपोर्ट)

### Purpose
Daily and period-wise attendance register for all cadres. Replaces the manual CSV export on
`dashboard.attendance.tsx` with a proper date-range report.

### Filters
| Filter | Type | Default |
|---|---|---|
| From Date | Date input | First of current month |
| To Date | Date input | Today |
| Block | Dropdown | All Blocks |
| Status | Multi-select: Present / Absent / On Leave / Holiday | All |
| Cadre Name | Text search | Empty |
| Quick Preset | Button group | This Month |

### Preview Columns
| Column | Source |
|---|---|
| Date (तारीख) | `attendance.date` |
| Cadre Name (नाम) | `profiles.full_name` |
| User ID | `profiles.user_id` |
| Cadre Type (प्रकार) | `profiles.cadre_type` |
| Block (ब्लॉक) | `blocks.name` |
| Village (गाँव) | `profiles.village` |
| Status (स्थिति) | `attendance.status` mapped to Present / Absent / On Leave / Holiday |
| Check-In | `attendance.check_in_at` formatted HH:MM |
| Check-Out | `attendance.check_out_at` formatted HH:MM |
| Remarks | `attendance.remarks` |
| Recorded By | `recorded_by_profile.full_name` (join on `attendance.recorded_by`) |

### Export Columns (xlsx)
All preview columns plus raw `attendance.id` as first column (hidden in preview, included in export).

### Database Tables
- `attendance` — primary
- `profiles` — join on `attendance.cadre_id = profiles.id`
- `blocks` — join on `profiles.block_id = blocks.id`
- `profiles` (alias `recorder`) — join on `attendance.recorded_by = recorder.id`

### Required Query
```
SELECT
  attendance.date,
  attendance.status,
  attendance.check_in_at,
  attendance.check_out_at,
  attendance.remarks,
  profiles.full_name,
  profiles.user_id,
  profiles.cadre_type,
  profiles.village,
  blocks.name AS block_name,
  recorder.full_name AS recorded_by_name
FROM attendance
JOIN profiles ON attendance.cadre_id = profiles.id
LEFT JOIN blocks ON profiles.block_id = blocks.id
LEFT JOIN profiles recorder ON attendance.recorded_by = recorder.id
WHERE attendance.date >= :from_date
  AND attendance.date <= :to_date
  [AND attendance.status = :status]
  [AND profiles.block_id = :block_id]
  [AND profiles.full_name ILIKE :search]
ORDER BY attendance.date DESC, profiles.full_name ASC
LIMIT 5000
```

PostgREST equivalent:
```
supabase
  .from("attendance")
  .select(`
    date, status, check_in_at, check_out_at, remarks,
    profiles!attendance_cadre_id_fkey(full_name, user_id, cadre_type, village,
      blocks!profiles_block_id_fkey(name)),
    recorder:profiles!attendance_recorded_by_fkey(full_name)
  `)
  .gte("date", from)
  .lte("date", to)
  [.eq("block_id", blockId)]
  [.eq("status", status)]
  .order("date", { ascending: false })
  .limit(5000)
```

---

## Report 2 — Activity Report (गतिविधि रिपोर्ट)

### Purpose
Full detail register of all submitted activities in a date range. Replaces and extends the
current `daily/weekly/monthly` modes in `dashboard.reports.tsx` by adding `status`, `beneficiaries`,
and activity type filter which are currently missing.

### Filters
| Filter | Type | Default |
|---|---|---|
| From Date | Date input | First of current month |
| To Date | Date input | Today |
| Block | Dropdown | All Blocks |
| Activity Type | Dropdown: All + 7 DB types | All |
| Status | Dropdown: All / Pending / Approved / Rejected | All |
| Village | Text search | Empty |
| Cadre Name | Text search | Empty |
| Quick Preset | Button group | This Month |

### Preview Columns
| Column | Source |
|---|---|
| Date (तारीख) | `activities.activity_date` |
| Cadre Name | `profiles.full_name` |
| User ID | `profiles.user_id` |
| Cadre Type | `profiles.cadre_type` |
| Block | `blocks.name` |
| Panchayat | `activities.panchayat` |
| Village (गाँव) | `activities.village_name` |
| Activity Type (प्रकार) | `activities.activity_type` (human-readable via i18n) |
| Beneficiaries (लाभार्थी) | `activities.beneficiaries` |
| Status (स्थिति) | `activities.status` |
| Photo Evidence | `activities.photo_url` — "Yes" / "No" |
| Submitted At | `activities.submitted_at` |
| Approved By | `approver.full_name` via `activities.approved_by` |

### Export Columns (xlsx)
All preview columns. Status is exported as raw value (Pending/Approved/Rejected).
`photo_url` exported as full URL rather than "Yes/No".

### Database Tables
- `activities` — primary
- `profiles` — join on `activities.cadre_id = profiles.id`
- `blocks` — join on `activities.block_id = blocks.id`
- `profiles` (alias `approver`) — join on `activities.approved_by = approver.id`

### Required Query
```
supabase
  .from("activities")
  .select(`
    activity_date, activity_type, village_name, panchayat,
    description, beneficiaries, status, photo_url, submitted_at,
    profiles!activities_cadre_id_fkey_profiles(full_name, user_id, cadre_type),
    blocks!activities_block_id_fkey(name),
    approver:profiles!activities_approved_by_fkey(full_name)
  `)
  .gte("activity_date", from)
  .lte("activity_date", to)
  [.eq("block_id", blockId)]
  [.eq("activity_type", activityType)]
  [.eq("status", status)]
  .order("activity_date", { ascending: false })
  .limit(5000)
```

---

## Report 3 — Evidence Report (साक्ष्य रिपोर्ट)

### Purpose
Metadata register of all uploaded photo/document evidence in a date range.
This is separate from the Evidence Gallery interactive page (`dashboard.evidence.tsx`).
The gallery handles visual browsing and inline approvals. This report provides a flat
downloadable register of evidence file metadata for audit purposes.

### Separate from Evidence Gallery
The Evidence Gallery (`dashboard.evidence.tsx`) must remain unchanged. The Evidence Report
in Reports module is read-only metadata export — no inline approval controls.

### Filters
| Filter | Type | Default |
|---|---|---|
| From Date | Date input | First of current month |
| To Date | Date input | Today |
| Block | Dropdown | All Blocks |
| File Type | Dropdown: All / Image / PDF / Video | All |
| Quick Preset | Button group | This Month |

### Preview Columns
| Column | Source |
|---|---|
| Upload Date | `evidence_files.created_at` |
| Cadre Name | `profiles.full_name` |
| User ID | `profiles.user_id` |
| Block | `blocks.name` |
| Activity Date | `activities.activity_date` |
| Activity Type | `activities.activity_type` |
| Village | `activities.village_name` |
| File Name | `evidence_files.file_name` |
| File Type | `evidence_files.mime_type` |
| File Size (KB) | `evidence_files.file_size / 1024` |
| GPS Latitude | `evidence_files.latitude` |
| GPS Longitude | `evidence_files.longitude` |
| Activity Status | `activities.status` |
| Public URL | `evidence_files.public_url` |

### Export Columns (xlsx)
All preview columns. `public_url` exported as full URL.

### Database Tables
- `evidence_files` — primary
- `activities` — join on `evidence_files.activity_id = activities.id`
- `profiles` — join on `evidence_files.cadre_id = profiles.id`
- `blocks` — join on `activities.block_id = blocks.id`

### Required Query
```
supabase
  .from("evidence_files")
  .select(`
    created_at, file_name, mime_type, file_size,
    latitude, longitude, public_url,
    activities!evidence_files_activity_id_fkey(
      activity_date, activity_type, village_name, status,
      blocks!activities_block_id_fkey(name)
    ),
    profiles!evidence_files_cadre_id_fkey(full_name, user_id)
  `)
  .gte("created_at", from + "T00:00:00")
  .lte("created_at", to + "T23:59:59")
  [.eq("activities.block_id", blockId)]
  .order("created_at", { ascending: false })
  .limit(5000)
```

Note: Date filter is on `evidence_files.created_at` (upload date), not activity date.

---

## Report 4 — Approval Report (अनुमोदन रिपोर्ट)

### Purpose
Audit trail of all approval decisions in a date range. Shows who approved/rejected what
and when. Separate from the live `dashboard.approvals.tsx` workflow page.

### Separate from Approvals Workspace
The Approvals Workspace (`dashboard.approvals.tsx`) is the operational tool for making
decisions. This report is a read-only historical audit log. They must remain separate.

### Filters
| Filter | Type | Default |
|---|---|---|
| From Date | Date input | First of current month |
| To Date | Date input | Today |
| Block | Dropdown | All Blocks |
| Decision | Dropdown: All / Approved / Rejected / Pending / Revision Requested | All |
| Quick Preset | Button group | This Month |

### Preview Columns
| Column | Source |
|---|---|
| Activity Date | `activities.activity_date` |
| Submitted At | `activities.submitted_at` |
| Reviewed At | `activities.approved_at` |
| Cadre Name | `profiles.full_name` (via `activities.cadre_id`) |
| Cadre Type | `profiles.cadre_type` |
| Block | `blocks.name` |
| Village | `activities.village_name` |
| Activity Type | `activities.activity_type` |
| Decision | `activities.status` |
| Comment | `activities.comment` |
| Approved By | `approver.full_name` (via `activities.approved_by`) |
| Days to Review | Computed: `approved_at - submitted_at` in days |

### Export Columns (xlsx)
All preview columns.

### Database Tables
- `activities` — primary (filter on status to get reviewed items)
- `profiles` — join on `activities.cadre_id = profiles.id`
- `blocks` — join on `activities.block_id = blocks.id`
- `profiles` (alias `approver`) — join on `activities.approved_by = approver.id`

### Note on activity_approvals table
The `activity_approvals` table exists but has inconsistent status casing vs `activities.status`
and is not reliably populated (audit showed the `reviewActivity` server function has a case
mismatch bug). This report queries `activities` directly for `approved_at` and `approved_by`
which are reliably set by both `dashboard.approvals.tsx` and `dashboard.index.tsx`.

### Required Query
```
supabase
  .from("activities")
  .select(`
    activity_date, submitted_at, approved_at,
    activity_type, village_name, status, comment,
    profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type),
    blocks!activities_block_id_fkey(name),
    approver:profiles!activities_approved_by_fkey(full_name)
  `)
  .not("status", "eq", "Pending")        // only reviewed activities
  .gte("activity_date", from)
  .lte("activity_date", to)
  [.eq("block_id", blockId)]
  [.eq("status", decision)]
  .order("approved_at", { ascending: false })
  .limit(5000)
```

---

## Report 5 — Cadre Performance Report (कैडर प्रदर्शन रिपोर्ट)

### Purpose
Per-cadre summary aggregating attendance and activity data for the selected period.
The single most important management report — shows at a glance which cadres are
underperforming on attendance, activity count, or approval rate.

This replaces what the existing `cadre_wise` mode in `dashboard.reports.tsx` shows
(currently only activity count + villages) with a complete performance picture.

### Dead Server Function to Connect
`getMonthlyReport` in `src/lib/api/reports.functions.ts` calls the PostgreSQL RPC
`get_cadre_activity_report(p_start_date, p_end_date, p_block_id)` which already returns
`present_days, absent_days, activity_count, villages_covered, pending_approvals, approved_activities`.
This server function must be connected to this report.

If the RPC does not exist on the remote DB, a fallback client-side aggregation query
must be used (described below).

### Filters
| Filter | Type | Default |
|---|---|---|
| From Date | Date input | First of current month |
| To Date | Date input | Today |
| Block | Dropdown | All Blocks |
| Cadre Type | Dropdown: All / PRP / FLCRP / RBK / IFC_Anchor / SR_CRP | All |
| Quick Preset | Button group | This Month |

### Preview Columns
| Column | Source |
|---|---|
| User ID | `profiles.user_id` |
| Cadre Name (नाम) | `profiles.full_name` |
| Cadre Type (प्रकार) | `profiles.cadre_type` |
| Block (ब्लॉक) | `blocks.name` |
| Village (गाँव) | `profiles.village` |
| Present Days (उपस्थित दिन) | Count of `attendance.status = 'present'` |
| Absent Days (अनुपस्थित दिन) | Count of `attendance.status = 'absent'` |
| Leave Days (अवकाश दिन) | Count of `attendance.status = 'on_leave'` |
| Attendance % (उपस्थिति %) | `present / (present + absent + leave) * 100` |
| Total Activities (कुल गतिविधियाँ) | Count of `activities` in period |
| Approved Activities (स्वीकृत) | Count of `activities.status = 'Approved'` |
| Pending Activities (लंबित) | Count of `activities.status = 'Pending'` |
| Rejected Activities (अस्वीकृत) | Count of `activities.status = 'Rejected'` |
| Approval Rate % | `approved / total_activities * 100` |
| Villages Covered (गाँव कवर) | Count of distinct `village_name` in activities |
| Beneficiaries (लाभार्थी) | Sum of `activities.beneficiaries` |

### Export Columns (xlsx)
All preview columns.

### Database Tables
- `profiles` — primary (one row per cadre)
- `user_roles` — to filter only `role = 'cadre'`
- `blocks` — join on `profiles.block_id = blocks.id`
- `attendance` — aggregate per cadre in date range
- `activities` — aggregate per cadre in date range

### Required Query Strategy
Two parallel queries, joined in JavaScript:

Query A — All cadres:
```
supabase
  .from("user_roles")
  .select("user_id")
  .eq("role", "cadre")
→ then fetch profiles for those user_ids filtered by block_id if set
```

Query B — Attendance aggregates:
```
supabase
  .from("attendance")
  .select("cadre_id, status")
  .gte("date", from)
  .lte("date", to)
  [.eq("block_id", blockId)]
```

Query C — Activity aggregates:
```
supabase
  .from("activities")
  .select("cadre_id, status, village_name, beneficiaries")
  .gte("activity_date", from)
  .lte("activity_date", to)
  [.eq("block_id", blockId)]
```

JavaScript joins all three into one row per cadre for display and export.

### RPC Shortcut (if available)
If `get_cadre_activity_report` RPC exists on DB, call `getMonthlyReport` server function
(already written in `reports.functions.ts`) and use its output directly. The date range
maps to `p_start_date` and `p_end_date`.

---

## Report 6 — Block Performance Report (ब्लॉक प्रदर्शन रिपोर्ट)

### Purpose
Per-block summary for district-level management. Shows which blocks have the best/worst
attendance and activity rates. Extends what `dashboard.index.tsx` shows in the Block Wise
Performance Table, but over a date range rather than a single day.

The existing `block_wise` mode in `dashboard.reports.tsx` only shows activity count and
villages — this replaces it with the full picture.

### Dead Server Function to Connect
`getBlockSummary` in `src/lib/api/dashboard.functions.ts` calls the RPC
`get_block_attendance_summary(p_date)` — but this is single-day only.
It cannot be reused directly for date ranges. A new client-side aggregation is needed.

### Filters
| Filter | Type | Default |
|---|---|---|
| From Date | Date input | First of current month |
| To Date | Date input | Today |
| Quick Preset | Button group | This Month |

Note: No block filter (this report IS the block breakdown). Block Officers see only their own block row.

### Preview Columns
| Column | Source |
|---|---|
| Block Name (ब्लॉक) | `blocks.name` |
| Total Cadres (कुल कैडर) | Count of profiles with `block_id = block.id` and `role = cadre` |
| Total Working Days | Count of distinct dates in the range with attendance records |
| Total Present Days | Sum of `attendance.status = 'present'` for block |
| Total Absent Days | Sum of `attendance.status = 'absent'` for block |
| Average Attendance % | `present / (present + absent) * 100` averaged across cadres |
| Total Activities | Count of `activities` for block in range |
| Approved Activities | Count of `activities.status = 'Approved'` |
| Pending Activities | Count of `activities.status = 'Pending'` |
| Rejected Activities | Count of `activities.status = 'Rejected'` |
| Approval Rate % | `approved / total * 100` |
| Villages Covered | Count of distinct `village_name` in activities |
| Total Beneficiaries | Sum of `activities.beneficiaries` |

### Export Columns (xlsx)
All preview columns.

### Database Tables
- `blocks` — one row per block
- `profiles` + `user_roles` — to count cadres per block
- `attendance` — aggregated by `block_id` in date range
- `activities` — aggregated by `block_id` in date range

### Required Query Strategy
Three parallel queries:

Query A:
```
supabase.from("blocks").select("id, name")
```

Query B:
```
supabase
  .from("attendance")
  .select("block_id, cadre_id, status, date")
  .gte("date", from)
  .lte("date", to)
```

Query C:
```
supabase
  .from("activities")
  .select("block_id, status, village_name, beneficiaries")
  .gte("activity_date", from)
  .lte("activity_date", to)
```

JavaScript aggregates B and C grouped by `block_id`, merged with A.

---

## What Existing Code Can Be Reused

| Existing Asset | Reuse Plan |
|---|---|
| `src/lib/excel.ts` — `exportToExcel()` | Use as-is for all 6 reports. No changes. |
| `src/routes/_authenticated/dashboard.reports.tsx` — `Table` component | Extract as shared `ReportTable` component. Reuse mobile card + desktop table rendering. |
| `src/routes/_authenticated/dashboard.reports.tsx` — date state + `setQuick()` | The quick-preset date logic is correct. Lift it into a shared `useDateRangeFilter` hook covering Today / This Week / This Month / Last Month / Custom. |
| `src/lib/filter-context.tsx` — `useDashboardFilters()` | Reuse `blockId` from FilterContext as the default block selection in Reports. |
| `src/hooks/use-auth.tsx` — `useProfile()`, `highestRole()` | Reuse for role-scoping (block officer auto-filter). |
| `src/integrations/supabase/client.ts` — `supabase` browser client | All report queries use the browser client directly (same pattern as attendance page). |
| `dashboard.attendance.tsx` — block dropdown pattern | Copy the `blocks` query + Select component pattern for the shared block filter. |
| `dashboard.index.tsx` — block-wise JS aggregation pattern | The 3-query parallel strategy for block stats is already proven here. Lift it into Report 6. |

---

## Dead Server Functions — Connection Plan

| Function | Location | Status | Plan |
|---|---|---|---|
| `getMonthlyReport` | `reports.functions.ts` | Dead — never called | Connect to Report 5 (Cadre Performance). Call it when date range is selected; use its `present_days / absent_days / activity_count` output. Fallback to client queries if RPC missing. |
| `getActivityTypeReport` | `reports.functions.ts` | Dead — never called | Do NOT connect. Its output (per-block activity type breakdown) is a subset of Report 6 (Block Performance). Deprecate it; the block performance report covers this need with more columns. |
| `getPendingApprovalsSummary` | `reports.functions.ts` | Dead — has PostgREST bug | Do NOT connect. Its block filter uses `.eq("activities.block_id", ...)` which is broken PostgREST syntax. Report 4 queries `activities` directly, which is more reliable. Deprecate this function. |
| `getCoverageReport` | `reports.functions.ts` | Dead — never called | Do NOT connect. Village coverage data is included inside Report 5 (villages_covered column) and Report 6. Deprecate as standalone. |
| `getBlockSummary` | `dashboard.functions.ts` | Live — used nowhere | Do NOT use for Report 6. It is single-day only (takes `p_date`, not a range). Report 6 uses direct queries over a date range instead. |
| `getDashboardStats` | `dashboard.functions.ts` | Live — used nowhere in reports | Do NOT use for reports. It is a single-day KPI function for the dashboard header. Not relevant to range reports. |

---

## Reports That Must Remain Separate

| Page | Reason |
|---|---|
| `dashboard.attendance.tsx` | Operational tool for marking attendance day by day. Has inline edit buttons. Must stay separate from the read-only Attendance Report. |
| `dashboard.approvals.tsx` | Operational workflow for approve/reject decisions. Has interactive forms. Must stay separate from the read-only Approval Report. |
| `dashboard.evidence.tsx` | Visual gallery with inline approval controls and bulk select. Must stay separate from the read-only Evidence metadata Report. |

---

## Page Structure

```
/dashboard/reports
  ├── Shared Filter Bar (Date Range + Quick Presets + Block Filter)
  ├── Report Tab Strip (6 tabs)
  ├── Active Report Panel
  │   ├── Report Header (title + period line)
  │   ├── Report-specific additional filters (status, type, etc.)
  │   ├── Preview Table (200 row cap)
  │   └── Export Button → exportToExcel()
  └── [Warning banner if row count > 4800]
```

---

## File Plan

| File | Action |
|---|---|
| `src/routes/_authenticated/dashboard.reports.tsx` | Replace entirely with new 6-tab reports page |
| `src/lib/excel.ts` | No changes |
| `src/lib/filter-context.tsx` | No changes |
| `src/hooks/use-auth.tsx` | No changes |
| `src/lib/api/reports.functions.ts` | Connect `getMonthlyReport` for Cadre Performance. Mark others as deprecated with comments. |

---

## i18n Keys Required (additions to `src/lib/i18n.tsx`)

```
attendance_report:      { en: "Attendance Report",       hi: "उपस्थिति रिपोर्ट" }
activity_report:        { en: "Activity Report",         hi: "गतिविधि रिपोर्ट" }
evidence_report:        { en: "Evidence Report",         hi: "साक्ष्य रिपोर्ट" }
approval_report:        { en: "Approval Report",         hi: "अनुमोदन रिपोर्ट" }
cadre_performance:      { en: "Cadre Performance",       hi: "कैडर प्रदर्शन" }
block_performance:      { en: "Block Performance",       hi: "ब्लॉक प्रदर्शन" }
report_period:          { en: "Report Period",           hi: "रिपोर्ट अवधि" }
present_days:           { en: "Present Days",            hi: "उपस्थित दिन" }
absent_days:            { en: "Absent Days",             hi: "अनुपस्थित दिन" }
leave_days:             { en: "Leave Days",              hi: "अवकाश दिन" }
attendance_pct:         { en: "Attendance %",            hi: "उपस्थिति %" }
approval_rate:          { en: "Approval Rate %",         hi: "अनुमोदन दर %" }
beneficiaries:          { en: "Beneficiaries",           hi: "लाभार्थी" }
today_preset:           { en: "Today",                   hi: "आज" }
this_week:              { en: "This Week",               hi: "इस सप्ताह" }
this_month:             { en: "This Month",              hi: "इस महीने" }
last_month:             { en: "Last Month",              hi: "पिछले महीने" }
custom_range:           { en: "Custom Range",            hi: "कस्टम रेंज" }
from_date:              already exists
to_date:                already exists
download_excel:         already exists
```
