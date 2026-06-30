import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const loadEnv = (filePath) => {
  if (fs.existsSync(filePath)) {
    const envConfig = fs.readFileSync(filePath, "utf-8");
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
  }
};
loadEnv(path.resolve(process.cwd(), ".env"));
loadEnv(path.resolve(process.cwd(), ".env.local"));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Same as client-side ACTIVITY_TYPES from activityTypes.ts
const ACTIVITY_TYPES = [
  "स्व सहायता समूह बैठक",    // [0] SHG Meeting
  "ग्राम संगठन बैठक",         // [1] VO Meeting (maps to Livelihood_Activity)
  "संकुल संगठन बैठक",         // [2] Cluster meeting
  "प्रशिक्षण",                // [3] Training
  "शिविर",                    // [4] Camp
  "पुस्तक लेखन प्रशिक्षण",   // [5] Record_Verification
  "बैंक लिंकेज बैठक",         // [6] 
  "बैंक विज़िट",              // [7]
  "पशु सखी बैठक",             // [8]
  "IFC सर्वे",                // [9]
  "क्षेत्र भ्रमण",            // [10] Monitoring_Visit
  "LSC विज़िट",               // [11]
  "ज़िला/जनपद पंचायत बैठक/प्रशिक्षण", // [12]
  "IFC बैठक",                 // [13]
  "अन्य",                     // [14] Other
];

const LEGACY_MAP = {
  SHG_Meeting:         "स्व सहायता समूह बैठक",
  Farmer_Visit:        "अन्य",
  Training_Session:    "प्रशिक्षण",
  Monitoring_Visit:    "क्षेत्र भ्रमण",
  Record_Verification: "पुस्तक लेखन प्रशिक्षण",
  Livelihood_Activity: "ग्राम संगठन बैठक",
  Other:               "अन्य",
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
};

function getActivityLabel(raw) {
  if (!raw) return "अन्य";
  if (ACTIVITY_TYPES.includes(raw)) return raw;
  if (LEGACY_MAP[raw]) return LEGACY_MAP[raw];
  return raw.replace(/_/g, " ");
}

function normalizeActivityType(raw) {
  return getActivityLabel(raw);
}

async function run() {
  console.log("=== ACTIVITY TYPE AUDIT ===");

  const { data: activities, error } = await supabase
    .from("activities")
    .select("id, activity_type, activity_date, cadre_id");
  if (error) throw error;

  const typeCounts = {};
  const normalizedCounts = {
    trainings: 0,
    monitorings: 0,
    verifications: 0,
    livelihoods: 0,
    other: 0,
    otherItems: [],
  };

  activities.forEach(a => {
    const raw = a.activity_type;
    typeCounts[raw] = (typeCounts[raw] || 0) + 1;
    
    const normalized = normalizeActivityType(raw);
    if (normalized === ACTIVITY_TYPES[3]) normalizedCounts.trainings++;
    else if (normalized === ACTIVITY_TYPES[10]) normalizedCounts.monitorings++;
    else if (normalized === ACTIVITY_TYPES[5]) normalizedCounts.verifications++;
    else if (normalized === ACTIVITY_TYPES[1]) normalizedCounts.livelihoods++;
    else if (normalized === ACTIVITY_TYPES[14]) {
      normalizedCounts.other++;
      normalizedCounts.otherItems.push({ raw, normalized, date: a.activity_date });
    }
  });

  console.log("\n== RAW activity_type distribution ==");
  Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    const normalized = normalizeActivityType(type);
    console.log(`  "${type}" → normalized="${normalized}" | count=${count}`);
  });

  console.log("\n== Dashboard Activity Summary values ==");
  console.log(`  Trainings (ACTIVITY_TYPES[3]="${ACTIVITY_TYPES[3]}"): ${normalizedCounts.trainings}`);
  console.log(`  Field Visits (ACTIVITY_TYPES[10]="${ACTIVITY_TYPES[10]}"): ${normalizedCounts.monitorings}`);
  console.log(`  Verifications (ACTIVITY_TYPES[5]="${ACTIVITY_TYPES[5]}"): ${normalizedCounts.verifications}`);
  console.log(`  VO Meetings (ACTIVITY_TYPES[1]="${ACTIVITY_TYPES[1]}"): ${normalizedCounts.livelihoods}`);
  console.log(`  Other (ACTIVITY_TYPES[14]="${ACTIVITY_TYPES[14]}"): ${normalizedCounts.other}`);
  console.log(`  Total analyzed: ${activities.length}`);
  console.log(`  Accounted for: ${normalizedCounts.trainings + normalizedCounts.monitorings + normalizedCounts.verifications + normalizedCounts.livelihoods + normalizedCounts.other}`);

  console.log("\n== Activities that fall in OTHER ==");
  normalizedCounts.otherItems.forEach(item => {
    console.log(`  Date: ${item.date} | Raw: "${item.raw}" | Normalized: "${item.normalized}"`);
  });
}

run().catch(console.error);
