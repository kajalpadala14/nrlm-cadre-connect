/**
 * Utility functions for calculating attendance metrics.
 * Using a Single Source of Truth ensures all dashboards and reports
 * calculate attendance rates consistently.
 */

/**
 * Calculates the attendance rate based on the standard formula:
 * ((Present + Approved Leave) / Total Active Cadres) * 100
 * 
 * Approved leave is counted towards attendance so that cadres are not penalized
 * for taking official/approved leaves.
 * 
 * @param presentCount Total number of cadres marked as 'present'
 * @param leaveCount Total number of cadres marked as 'on_leave'
 * @param totalActiveCadres Total number of cadres who are currently active
 * @returns The rounded attendance percentage (0-100)
 */
export function calculateAttendanceRate(
  presentCount: number,
  leaveCount: number,
  totalActiveCadres: number
): number {
  if (!totalActiveCadres || totalActiveCadres <= 0) {
    return 0;
  }
  
  const rate = ((presentCount + leaveCount) / totalActiveCadres) * 100;
  
  // Return rounded to nearest whole number, capped at 100% just in case
  return Math.min(100, Math.round(rate));
}
