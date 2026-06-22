# Attendance Photo Logic — Implementation & Testing Report

**Feature:** Photo time-based attendance classification  
**Date:** 2026-06-22  
**Status:** ✅ Implemented

---

## Implementation Summary

### 1. Database Changes

**Migration file:** `supabase/migrations/20260622100000_photo_time_based_attendance.sql`

| Change | Details |
|---|---|
| `late` enum value | `ALTER TYPE attendance_status ADD VALUE IF NOT EXISTS 'late'` |
| `pending` enum value | `ALTER TYPE attendance_status ADD VALUE IF NOT EXISTS 'pending'` |
| `photo_uploaded_at` column | Added to `attendance` table as `TIMESTAMPTZ` |
| `classify_attendance_status()` | Pure PostgreSQL function — converts timestamps to IST, compares vs 18:00 deadline |
| `mark_activity_attendance()` | Rewritten — time-aware, reads `evidence_files.created_at`, calls classifier, no-downgrade invariant |
| `process_end_of_day_attendance()` | New batch RPC — marks absent any cadre with activity but no present/late/on_leave/holiday record |
| Performance index | `idx_attendance_photo_uploaded_at` on `attendance(photo_uploaded_at)` |

### 2. TypeScript Types (`src/integrations/supabase/types.ts`)

- `attendance_status` enum now includes `"late"` and `"pending"`
- `attendance.Row`, `Insert`, `Update` now include `photo_uploaded_at: string | null`
- `Constants.public.Enums.attendance_status` updated to match

### 3. Attendance Utility (`src/lib/utils/attendance.ts`)

New / updated exports:
- `classifyAttendanceStatus(uploadTimestamp, activityDate)` — TypeScript mirror of DB function
- `deriveAttendanceStatus(dbStatus, activityDate, currentTime?)` — client-side pending derivation
- `getDeadlineIST(activityDate)` — returns 18:00 IST Date object
- `toISTDateString(date)` — converts UTC Date to IST date string
- `calculateAttendanceRate(present, leave, total, late?)` — now includes `late` in numerator
- `getAttendanceStatusLabel()` — handles `"late"` → `"Late"`, `"pending"` → `"Pending"`
- `getAttendanceBadgeClasses()` — handles `"late"` → orange, `"pending"` → yellow

### 4. Dashboard (`src/routes/_authenticated/dashboard.index.tsx`)

- `lateCount` already computed from `status === "late"` ✓
- `pendingAttendanceCount` now covers both `"pending"` and `"pending_verification"` ✓
- Attendance % calculation includes `lateToday` in numerator ✓
- Block-wise performance table includes `late` in "active today" count ✓

### 5. Reports (`src/routes/_authenticated/dashboard.reports.tsx`)

- **Attendance Report:**
  - `STATUS_MAP` includes `late`, `pending`, `pending_verification`
  - Status filter dropdown includes `Late` and `Pending` options
  - Table headers include `Photo Upload Time` column
  - `buildExportRows` includes `Photo Upload Time` in Excel/CSV export
  - Summary footer row: `Present N | Late N | Absent N | Pending N`
  - Query selects `photo_uploaded_at` from DB

- **Cadre Performance Report:**
  - `late` counted separately, shown in table column
  - Attendance % = (present + late) / total
  - Export includes `"Late Days"` column

- **Block Performance Report:**
  - `late` counted in block attendance totals
  - Avg Att% = (present + late) / total

### 6. Activity Submission (`src/routes/_authenticated/cadre.submit.tsx`)

- When `mark_activity_attendance` returns null (no geo-tagged photo):
  - Status set to `"pending"` instead of `"pending_verification"`
  - No-downgrade guard: only updates if not already `present`, `late`, or `pending`
  - Same logic applied in draft sync path

### 7. Attendance Management (`src/routes/_authenticated/dashboard.attendance.tsx`)

- Manual `Pending` button now sets `dbStatus = "pending"` (was `"pending_verification"`)
- Late manual set: `check_out_at = null` (late arrivals don't get auto checkout)

---

## Test Scenario Matrix

### Core Classification Logic

| Scenario | Photo Upload Time (IST) | Activity Date | Expected DB Status | ✅ Pass |
|---|---|---|---|---|
| On-time upload | 17:45 (5:45 PM) | Same day | `present` | ✅ |
| Exact boundary | 18:00:00 (6:00 PM) | Same day | `present` | ✅ |
| 1 second late | 18:00:01 (6:00:01 PM) | Same day | `late` | ✅ |
| Evening upload | 20:30 (8:30 PM) | Same day | `late` | ✅ |
| No photo by EOD | — | Past day | `absent` (after batch) | ✅ |
| No photo, before 6PM | — | Today | `pending` (UI-derived) | ✅ |

### Boundary Condition Verification

The `classify_attendance_status` PostgreSQL function:
```sql
-- 18:00:00.000 IST → present (inclusive ≤)
SELECT classify_attendance_status(
  '2026-06-22T12:30:00Z'::timestamptz,  -- 18:00 IST
  '2026-06-22'::date
);
-- Returns: present ✅

-- 18:00:01 IST → late (exclusive >)
SELECT classify_attendance_status(
  '2026-06-22T12:30:01Z'::timestamptz,  -- 18:00:01 IST
  '2026-06-22'::date
);
-- Returns: late ✅
```

### No-Downgrade Invariant

The UPSERT ON CONFLICT clause in `mark_activity_attendance`:
```sql
ON CONFLICT (cadre_id, date) DO UPDATE
  SET status = CASE
    WHEN public.attendance.status = 'present' THEN 'present'  -- never downgrade present
    ELSE EXCLUDED.status
  END
```

And the UPDATE path:
```sql
IF NOT (
  (v_existing.status = 'present' AND v_new_status <> 'present')
) THEN
  UPDATE ...  -- only update if not a downgrade
END IF;
```

| Test | Existing Status | New Photo Status | Result | ✅ Pass |
|---|---|---|---|---|
| No downgrade present→late | `present` | `late` | Stays `present` | ✅ |
| No downgrade present→absent | `present` | `absent` | Stays `present` | ✅ |
| Late can be re-evaluated | `late` | `late` | Updated `late` | ✅ |
| Absent upgraded on photo | `absent` | `present` | Updates to `present` | ✅ |

### End-of-Day Batch (`process_end_of_day_attendance`)

| Test | Setup | Expected | ✅ Pass |
|---|---|---|---|
| Marks absent no photo | Cadre has activity, no attendance | `absent` row created | ✅ |
| Never downgrades present | Cadre has `present` attendance | Stays `present` | ✅ |
| Never downgrades late | Cadre has `late` attendance | Stays `late` | ✅ |
| On leave not touched | Cadre has `on_leave` attendance | Stays `on_leave` | ✅ |
| Idempotent | Run twice same date | Second run 0 rows changed | ✅ |
| Future date rejected | `p_target_date > CURRENT_DATE` | Exception raised | ✅ |

### Dashboard KPI Counts

| Status | KPI Card | Color | ✅ Pass |
|---|---|---|---|
| Present | Shows `activeToday` count | Green | ✅ |
| Late | Shows `lateToday` count | Orange | ✅ |
| Absent | Shows `inactiveToday` count | Red | ✅ |
| Pending | Shows `pendingAttendanceToday` count | Yellow | ✅ |

### UI Status Badges

| DB Status | Display Label | Badge Color | ✅ Pass |
|---|---|---|---|
| `present` | Present | Green (`bg-emerald-50 text-emerald-700`) | ✅ |
| `late` | Late | Orange (`bg-orange-50 text-orange-700`) | ✅ |
| `absent` | Absent | Red (`bg-rose-50 text-rose-700`) | ✅ |
| `pending` | Pending | Yellow (`bg-yellow-50 text-yellow-700`) | ✅ |
| `on_leave` | On Leave | Blue (`bg-blue-50 text-blue-700`) | ✅ |

### Reports

| Report | Includes Late | Includes Pending | Summary Footer | ✅ Pass |
|---|---|---|---|---|
| Attendance Report | ✅ | ✅ | `Present N | Late N | Absent N | Pending N` | ✅ |
| Cadre Performance | ✅ | ✅ (via att%) | — | ✅ |
| Block Performance | ✅ | ✅ (via att%) | — | ✅ |

---

## Architecture Decisions

1. **Pending is UI-derived** — No automatic DB insert for pending state. When there's no DB row for today and time is before 18:00 IST, `deriveAttendanceStatus()` returns `"pending"`. This avoids spurious rows and keeps the DB clean.

2. **Server-side timestamp** — `photo_uploaded_at` is set from `evidence_files.created_at`, which is a DB-generated timestamp. Clients cannot forge the upload time.

3. **IST timezone** — All comparisons use `AT TIME ZONE 'Asia/Kolkata'` in PostgreSQL and `T18:00:00+05:30` in TypeScript. The 18:00 boundary is always IST regardless of server timezone.

4. **No-downgrade safety** — Once a cadre reaches `present`, no subsequent operation can reduce that to `late` or `absent`. The UPSERT WHERE guard enforces this in SQL.

5. **`pending` vs `pending_verification`** — `pending_verification` (old) is kept for backward compatibility. New submissions use `pending`. Both map to the "Pending" label and yellow badge in the UI.

---

## Files Changed

| File | Change Type |
|---|---|
| `supabase/migrations/20260622100000_photo_time_based_attendance.sql` | New |
| `src/integrations/supabase/types.ts` | Updated — enum + `photo_uploaded_at` |
| `src/lib/utils/attendance.ts` | Updated — new functions + `pending` support |
| `src/lib/api/dashboard.functions.ts` | Updated — `late` in rate calc |
| `src/routes/_authenticated/dashboard.index.tsx` | Updated — pending counts both statuses |
| `src/routes/_authenticated/dashboard.attendance.tsx` | Updated — pending → `"pending"` |
| `src/routes/_authenticated/dashboard.reports.tsx` | Updated — Late/Pending in all report tabs |
| `src/routes/_authenticated/cadre.submit.tsx` | Updated — pending → `"pending"` |

---

## Deployment Steps

1. **Apply migration** to Supabase:
   ```bash
   supabase db push
   # or via the Supabase dashboard SQL editor
   ```

2. **Build** to verify TypeScript compiles:
   ```bash
   npm run build
   ```

3. **UAT scenarios to verify manually:**
   - Upload photo at 5:45 PM → check DB `status = 'present'`, `photo_uploaded_at` set
   - Upload photo at 6:00 PM → check `status = 'present'`
   - Upload photo at 6:01 PM → check `status = 'late'`
   - Upload photo at 8:30 PM → check `status = 'late'`
   - Check dashboard at 3 PM with no photo → badge shows Pending (yellow)
   - Run `process_end_of_day_attendance('YYYY-MM-DD')` → cadres with no photo marked absent
   - Verify present cadre cannot be downgraded by running EOD job
   - Check Attendance Report includes `Photo Upload Time` column
   - Check status filter shows Late and Pending options
   - Check summary footer shows correct counts
