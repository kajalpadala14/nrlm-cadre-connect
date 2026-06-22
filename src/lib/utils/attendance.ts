/**
 * Utility functions for calculating and classifying attendance metrics.
 *
 * Attendance Rules (photo-based, IST deadline):
 *   - Photo uploaded on activity_date at or before 18:00 IST → present
 *   - Photo uploaded on activity_date after  18:00 IST       → late
 *   - No photo by end of day                                  → absent
 *   - No photo yet, current time before 18:00 IST (today)    → pending (UI-derived)
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

// ── IST helpers ──────────────────────────────────────────────────────────

/** Returns a date string 'YYYY-MM-DD' in IST (UTC+5:30). */
export function toISTDateString(d: Date): string {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 10);
}

/** Returns the 18:00 IST deadline for a given ISO date string 'YYYY-MM-DD'. */
export function getDeadlineIST(activityDate: string): Date {
  return new Date(`${activityDate}T18:00:00+05:30`);
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
 * - If no DB row (null) and today before 18:00 IST → 'pending'
 * - If no DB row (null) and past 18:00 IST or past date → 'absent'
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
 * ((Present + Late + Approved Leave) / Total Active Cadres) * 100
 *
 * Both Present and Late count positively toward attendance.
 * Approved leave is counted so cadres are not penalised for official leaves.
 */
export function calculateAttendanceRate(
  presentCount: number,
  leaveCount: number,
  totalActiveCadres: number,
  lateCount: number = 0,
): number {
  if (!totalActiveCadres || totalActiveCadres <= 0) return 0;
  const rate = ((presentCount + lateCount + leaveCount) / totalActiveCadres) * 100;
  return Math.min(100, Math.round(rate));
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
