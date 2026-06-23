/**
 * NRLM Standardized Activity Types — Single Source of Truth
 *
 * These are the canonical Hindi labels stored directly in activities.activity_type
 * after the TEXT migration (20260623100000_activity_type_text.sql).
 *
 * BACKWARD COMPATIBILITY:
 * Legacy records stored old English enum values (SHG_Meeting, Farmer_Visit, etc.).
 * Use getActivityLabel() to render any value — new or legacy — correctly.
 */

export const ACTIVITY_TYPES = [
  "स्व सहायता समूह बैठक",
  "ग्राम संगठन बैठक",
  "संकुल संगठन बैठक",
  "प्रशिक्षण",
  "शिविर",
  "पुस्तक लेखन प्रशिक्षण",
  "बैंक लिंकेज बैठक",
  "बैंक विज़िट",
  "पशु सखी बैठक",
  "IFC सर्वे",
  "क्षेत्र भ्रमण",
  "LSC विज़िट",
  "ज़िला/जनपद पंचायत बैठक/प्रशिक्षण",
  "IFC बैठक",
  "अन्य",
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];

const ACTIVITY_TYPE_DB_MAP: Record<string, string> = {
  [ACTIVITY_TYPES[0]]: "SHG_Meeting",
  [ACTIVITY_TYPES[1]]: "Livelihood_Activity",
  [ACTIVITY_TYPES[2]]: "Livelihood_Activity",
  [ACTIVITY_TYPES[3]]: "Training_Session",
  [ACTIVITY_TYPES[4]]: "Other",
  [ACTIVITY_TYPES[5]]: "Record_Verification",
  [ACTIVITY_TYPES[6]]: "Livelihood_Activity",
  [ACTIVITY_TYPES[7]]: "Livelihood_Activity",
  [ACTIVITY_TYPES[8]]: "Farmer_Visit",
  [ACTIVITY_TYPES[9]]: "Farmer_Visit",
  [ACTIVITY_TYPES[10]]: "Monitoring_Visit",
  [ACTIVITY_TYPES[11]]: "Monitoring_Visit",
  [ACTIVITY_TYPES[12]]: "Training_Session",
  [ACTIVITY_TYPES[13]]: "Livelihood_Activity",
  [ACTIVITY_TYPES[14]]: "Other",
};

/**
 * Maps legacy English enum values → new Hindi display labels.
 * Also covers old UI display strings that may have been stored directly.
 */
export const LEGACY_ACTIVITY_LABEL_MAP: Record<string, string> = {
  // PostgreSQL enum values
  SHG_Meeting:         "स्व सहायता समूह बैठक",
  Farmer_Visit:        "अन्य",
  Training_Session:    "प्रशिक्षण",
  Monitoring_Visit:    "क्षेत्र भ्रमण",
  Record_Verification: "पुस्तक लेखन प्रशिक्षण",
  Livelihood_Activity: "ग्राम संगठन बैठक",
  Other:               "अन्य",
  // Old English UI labels stored as-is
  "SHG Meeting":            "स्व सहायता समूह बैठक",
  "VO Meeting":             "ग्राम संगठन बैठक",
  "Training":               "प्रशिक्षण",
  "Farmer Visit":           "अन्य",
  "Livelihood Demo":        "ग्राम संगठन बैठक",
  "Bank Linkage":           "बैंक लिंकेज बैठक",
  "Monitoring Visit":       "क्षेत्र भ्रमण",
  "Record Verification":    "पुस्तक लेखन प्रशिक्षण",
  "Community Mobilization": "संकुल संगठन बैठक",
  "Enterprise Promotion":   "ग्राम संगठन बैठक",
  "कृषि सखी बैठक":          "अन्य",
};

/**
 * Returns the correct display label for any stored activity_type value.
 * Handles new Hindi labels, old enum values, and old English UI strings.
 *
 * Usage:  getActivityLabel(activity.activity_type)
 */
export function getActivityLabel(raw: string | null | undefined): string {
  if (!raw) return "अन्य";
  // Already a known new label — return as-is
  if ((ACTIVITY_TYPES as readonly string[]).includes(raw)) return raw;
  // Map legacy value
  if (LEGACY_ACTIVITY_LABEL_MAP[raw]) return LEGACY_ACTIVITY_LABEL_MAP[raw];
  // Unknown — clean up underscores and return raw
  return raw.replace(/_/g, " ");
}

/**
 * Normalise a stored value for filter comparison.
 * Converts legacy values to their canonical Hindi label so that
 * filter logic works uniformly regardless of which era the record is from.
 */
export function normalizeActivityType(raw: string | null | undefined): string {
  return getActivityLabel(raw);
}

/**
 * Converts the UI label to the DB-safe value.
 * The live database may still be on the legacy activity_type enum, so writes
 * must use enum values even while the UI displays standardized Hindi labels.
 */
export function activityTypeForDB(raw: string | null | undefined): string {
  if (!raw) return "Other";
  return ACTIVITY_TYPE_DB_MAP[raw] ?? raw;
}
