/**
 * Utility functions for calculating and classifying attendance metrics.
 *
 * Attendance Rules (photo-based, IST deadline):
 *   - Photo uploaded on activity_date at or before 19:00 IST → present
 *   - Photo uploaded on activity_date after  19:00 IST       → late
 *   - No photo by end of day                                  → absent
 *   - No photo yet, current time before 19:00 IST (today)    → pending (UI-derived)
 *
 * All classification is authoritative on the DB side via classify_attendance_status().
 * This file provides client-side display helpers and the same logic in TypeScript
 * for local status derivation when no DB record exists yet.
 */

// ── Types ────────────────────────────────────────────────────────────────

export type AttendanceDbStatus =
  | "present"
  | "late"
  | "absent"
  | "pending"
  | "pending_verification"
  | "on_leave"
  | "holiday";

export type AttendanceBusinessStatus =
  | "Present"
  | "Late"
  | "Absent"
  | "Pending"
  | "On Leave"
  | "Holiday";

export interface AttendanceCountSummary {
  totalUsers: number;
  expectedCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  pendingCount: number;
  leaveCount: number;
  holidayCount: number;
  duplicateRows: number;
  finalAttendanceRate: number;
}

// ── IST helpers ──────────────────────────────────────────────────────────

/** Returns a date string 'YYYY-MM-DD' in IST (UTC+5:30). */
export function toISTDateString(d: Date): string {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 10);
}

/** Returns the 19:00 IST deadline for a given ISO date string 'YYYY-MM-DD'. */
export function getDeadlineIST(activityDate: string): Date {
  return new Date(`${activityDate}T19:00:00+05:30`);
}

// ── Core classification (mirrors DB classify_attendance_status) ──────────

/**
 * Pure TypeScript version of the Postgres classify_attendance_status function.
 * Determines whether a photo upload qualifies as 'present' or 'late'.
 *
 * @param uploadTimestamp - The UTC timestamp of evidence_files.created_at
 * @param activityDate    - ISO date string 'YYYY-MM-DD' of the activity
 */
export function classifyAttendanceStatus(
  uploadTimestamp: Date | string,
  activityDate: string,
): "present" | "late" {
  const upload = typeof uploadTimestamp === "string" ? new Date(uploadTimestamp) : uploadTimestamp;
  const deadline = getDeadlineIST(activityDate);
  return upload <= deadline ? "present" : "late";
}

/**
 * Client-side helper to derive the display status when reading from DB.
 * Used when a DB row may not exist yet (pending state).
 *
 * - If there's a DB status → return it directly
 * - If no DB row (null) and today before 19:00 IST → 'pending'
 * - If no DB row (null) and past 19:00 IST or past date → 'absent'
 */
export function deriveAttendanceStatus(
  dbStatus: AttendanceDbStatus | null | undefined,
  activityDate: string,
  currentTime: Date = new Date(),
): AttendanceDbStatus {
  if (dbStatus === "present") return "present";
  if (dbStatus === "late") return "late";
  if (dbStatus === "absent") return "absent";
  if (dbStatus === "on_leave") return "on_leave";
  if (dbStatus === "holiday") return "holiday";

  // No DB row yet (or pending_verification / pending)
  const deadline = getDeadlineIST(activityDate);
  const isToday = activityDate === toISTDateString(currentTime);

  if (isToday && currentTime <= deadline) {
    return "pending";
  }
  return "absent";
}

// ── Attendance Rate ──────────────────────────────────────────────────────

/**
 * Calculates the attendance rate based on the standard formula:
 * ((Present + Late) / Total Users) * 100
 *
 * Both Present and Late count positively toward attendance.
 * Absent, pending, pending_verification, leave, and holiday remain in the
 * denominator, but never in the numerator.
 */
export function calculateAttendanceRate(
  presentCount: number,
  leaveCount: number,
  totalActiveCadres: number,
  lateCount: number = 0,
  holidayCount: number = 0,
): number {
  if (!totalActiveCadres || totalActiveCadres <= 0) return 0;
  const rate = ((presentCount + lateCount) / totalActiveCadres) * 100;
  return Math.min(100, Math.round(rate));
}

/**
 * Builds a de-duplicated attendance summary for one date.
 *
 * The attendance table is intended to have one row per cadre per day, but this
 * guard keeps KPIs correct even if legacy/imported data has duplicate rows.
 */
export function summarizeAttendanceForRate(
  rows: Array<{ cadre_id: string | null; status: AttendanceDbStatus | string | null }>,
  activeCadreIds: readonly string[],
): AttendanceCountSummary {
  const activeSet = new Set(activeCadreIds);
  const statusRank: Record<string, number> = {
    present: 7,
    late: 6,
    on_leave: 5,
    holiday: 4,
    absent: 3,
    pending_verification: 2,
    pending: 1,
  };
  const bestStatusByCadre = new Map<string, string>();
  let duplicateRows = 0;

  rows.forEach((row) => {
    if (!row.cadre_id || !activeSet.has(row.cadre_id)) return;
    const nextStatus = row.status ?? "pending";
    const previousStatus = bestStatusByCadre.get(row.cadre_id);
    if (previousStatus) duplicateRows += 1;
    if (!previousStatus || (statusRank[nextStatus] ?? 0) > (statusRank[previousStatus] ?? 0)) {
      bestStatusByCadre.set(row.cadre_id, nextStatus);
    }
  });

  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let pendingCount = 0;
  let leaveCount = 0;
  let holidayCount = 0;

  bestStatusByCadre.forEach((status) => {
    if (status === "present") presentCount += 1;
    else if (status === "late") lateCount += 1;
    else if (status === "absent") absentCount += 1;
    else if (status === "on_leave") leaveCount += 1;
    else if (status === "holiday") holidayCount += 1;
    else if (status === "pending" || status === "pending_verification") pendingCount += 1;
  });

  const totalUsers = activeCadreIds.length;
  const expectedCount = totalUsers;

  return {
    totalUsers,
    expectedCount,
    presentCount,
    lateCount,
    absentCount,
    pendingCount,
    leaveCount,
    holidayCount,
    duplicateRows,
    finalAttendanceRate: calculateAttendanceRate(
      presentCount,
      leaveCount,
      totalUsers,
      lateCount,
      holidayCount,
    ),
  };
}

export function logAttendanceDebug(label: string, summary: AttendanceCountSummary) {
  console.log(`=== ${label} ATTENDANCE DEBUG ===`);
  console.log(`Total Users: ${summary.totalUsers}`);
  console.log(`Attendance Denominator / Total Users: ${summary.expectedCount}`);
  console.log(`Present Count: ${summary.presentCount}`);
  console.log(`Late Count: ${summary.lateCount}`);
  console.log(`Absent Count: ${summary.absentCount}`);
  console.log(`Pending Count: ${summary.pendingCount}`);
  console.log(`Leave Count: ${summary.leaveCount}`);
  console.log(`Holiday Count: ${summary.holidayCount}`);
  console.log(`Duplicate Attendance Rows Ignored: ${summary.duplicateRows}`);
  console.log(`Final Attendance Rate: ${summary.finalAttendanceRate}%`);
  console.log("====================================");
}

// ── Display helpers ──────────────────────────────────────────────────────

export function getAttendanceStatusLabel(
  status?: string | null,
): AttendanceBusinessStatus | "Not Marked" {
  switch (status) {
    case "present":             return "Present";
    case "late":                return "Late";
    case "absent":              return "Absent";
    case "pending":
    case "pending_verification":return "Pending";
    case "on_leave":            return "On Leave";
    case "holiday":             return "Holiday";
    default:                    return "Not Marked";
  }
}

export function getAttendanceBadgeClasses(status?: string | null): string {
  switch (status) {
    case "present":             return "bg-emerald-100 text-emerald-800";
    case "late":                return "bg-orange-100 text-orange-800";
    case "absent":              return "bg-rose-100 text-rose-800";
    case "pending":
    case "pending_verification":return "bg-yellow-100 text-yellow-800";
    case "on_leave":            return "bg-blue-100 text-blue-800";
    case "holiday":             return "bg-slate-100 text-slate-800";
    default:                    return "bg-slate-50 text-slate-500";
  }
}
