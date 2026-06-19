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

// Copied from data-scope.ts
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(v) {
  return !!v && UUID_RE.test(v);
}

async function getCadreIdsInBlock(blockId) {
  if (!isValidUUID(blockId)) return [];

  const { data: userRoles, error: urError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "cadre");
  if (urError || !userRoles || userRoles.length === 0) return [];

  const allCadreIds = userRoles.map((r) => r.user_id);

  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("id")
    .eq("block_id", blockId)
    .in("id", allCadreIds);
  if (pError || !profiles) return [];
  return profiles.map((p) => p.id);
}

function applyScopeToQuery(query, _tableHasBlockId, blockId, cadreIds) {
  if (!blockId || !isValidUUID(blockId)) return query;

  if (cadreIds.length > 0) {
    return query.in("cadre_id", cadreIds);
  }
  return query.eq("cadre_id", "00000000-0000-0000-0000-000000000000");
}

async function runAudit() {
  console.log("=== SCOPE HELPER AUDIT ===");
  // Dantewada Block ID
  const blockId = "1a61a61a-38bd-4178-9ca0-5dd236dabda1";
  console.log("Block ID:", blockId);

  const cadreIds = await getCadreIdsInBlock(blockId);
  console.log("Cadre IDs Count:", cadreIds.length);
  // console.log("Cadre IDs:", cadreIds);

  if (cadreIds.length > 0) {
    // Test query using applyScopeToQuery for attendance
    let query = supabase.from("attendance").select("*");
    query = applyScopeToQuery(query, true, blockId, cadreIds);
    
    // Let's get the URL to see what the generated query looks like
    // (Supabase JS doesn't expose the URL easily before execution, but we can see the result)
    
    const { data, error } = await query;
    if (error) {
      console.error("Attendance Query Error:", error);
    } else {
      console.log("Attendance Returned Rows:", data.length);
    }

    // Test for activities
    let actQuery = supabase.from("activities").select("*");
    actQuery = applyScopeToQuery(actQuery, true, blockId, cadreIds);
    const { data: actData, error: actError } = await actQuery;
    if (actError) {
      console.error("Activities Query Error:", actError);
    } else {
      console.log("Activities Returned Rows:", actData.length);
    }
    
    // Check evidence
    let evQuery = supabase.from("evidence_files").select("*");
    // evidence files don't have cadre_id? Wait!
    // Let's see if evidence_files has cadre_id!
    const { data: cols } = await supabase.from("evidence_files").select("*").limit(1);
    console.log("Evidence files sample:", cols);
  }
}

runAudit();
