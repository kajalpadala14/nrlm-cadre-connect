/**
 * NRLM Standardized Activity Types
 * Single source of truth used by forms, filters, reports, and API layer.
 *
 * BACKWARD COMPATIBILITY:
 * Legacy records stored with old enum values (SHG_Meeting, Farmer_Visit, etc.)
 * are mapped to their display labels via LEGACY_ACTIVITY_LABEL_MAP below.
 * New submissions store the Hindi label directly as text.
 */

// ── New standardized activity types (shown in dropdowns) ─────────────────
export const NRLM_ACTIVITY_TYPES = [
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

export type NRLMActivityType = typeof NRLM_ACTIVITY_TYPES[number];

// ── Legacy DB enum values → display labels ────────────────────────────────
// Old records stored values like "SHG_Meeting". These must still render
// correctly even though new submissions use the Hindi text labels directly.
export const LEGACY_ACTIVITY_LABEL_MAP: Record<string, string> = {
  SHG_Meeting:         "स्व सहायता समूह बैठक",
  Farmer_Visit:        "अन्य",
  Training_Session:    "प्रशिक्षण",
  Monitoring_Visit:    "क्षेत्र भ्रमण",
  Record_Verification: "पुस्तक लेखन प्रशिक्षण",
  Livelihood_Activity: "ग्राम संगठन बैठक",
  Other:               "अन्य",
  // Old UI labels that may have been stored as-is
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
 * Returns the display label for any stored activity_type value.
 * Handles both new Hindi labels and legacy enum values.
 */
export function getActivityLabel(raw: string | null | undefined): string {
  if (!raw) return "अन्य";
  // If it's already a new Hindi label, return as-is
  if ((NRLM_ACTIVITY_TYPES as readonly string[]).includes(raw)) return raw;
  // Map legacy value to Hindi label
  return LEGACY_ACTIVITY_LABEL_MAP[raw] ?? raw.replace(/_/g, " ");
}

/**
 * For DB writes: new activity type values are stored as-is (text).
 * The DB column must be TEXT (not enum) — see migration below.
 */
export function activityTypeForDB(label: string): string {
  return label; // Store the Hindi label directly
}
