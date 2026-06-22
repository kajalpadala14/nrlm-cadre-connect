import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim().replace(/^"|"$/g, "")];
    })
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tables = ["profiles", "user_roles", "blocks", "attendance", "activities", "evidence_files", "leave_requests", "notifications"];
const out = { tables: {}, users: [] };

for (const table of tables) {
  const { data, error, count } = await supabase.from(table).select("*", { count: "exact" }).limit(1);
  out.tables[table] = {
    count,
    error: error?.message ?? null,
    columns: data?.[0] ? Object.keys(data[0]) : [],
    sample: data?.[0] ?? null,
  };
}

const { data: auth } = await supabase.auth.admin.listUsers({ page: 1, perPage: 500 });
const { data: roles } = await supabase.from("user_roles").select("user_id, role");

out.users = (auth?.users ?? [])
  .map((u) => ({
    email: u.email,
    role: roles?.find((r) => r.user_id === u.id)?.role ?? null,
    metadata: u.user_metadata,
    app_metadata: u.app_metadata,
  }))
  .filter((u) => ["cadre", "block_officer", "admin"].includes(u.role))
  .slice(0, 8);

console.log(JSON.stringify(out, null, 2));
