import { T as TSS_SERVER_FUNCTION, a as createServerFn } from "./server-CDQQ5dZa.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-CffMsDA6.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { s as stringType, o as objectType, e as enumType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const userIdSchema = stringType().trim().min(2).max(40).regex(/^[a-zA-Z0-9_.-]+$/, "User ID must be letters, digits, _ . -");
const pinSchema = stringType().regex(/^[0-9]{4}$/, "PIN must be 4 digits");
function emailFor(userId) {
  return `${userId.trim().toLowerCase()}@nrlm.local`;
}
function passwordFor(pin) {
  return `NRLM-${pin}`;
}
const ensureAdminSeeded_createServerFn_handler = createServerRpc({
  id: "089a630ec02fc66e53ceabc14910eccb3c610550b8fa42bc9e99345b98106346",
  name: "ensureAdminSeeded",
  filename: "src/lib/admin.functions.ts"
}, (opts) => ensureAdminSeeded.__executeServer(opts));
const ensureAdminSeeded = createServerFn({
  method: "POST"
}).handler(ensureAdminSeeded_createServerFn_handler, async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      seeded: false,
      reason: "no_service_key"
    };
  }
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const {
    count,
    error: cErr
  } = await supabaseAdmin.from("user_roles").select("id", {
    count: "exact",
    head: true
  }).eq("role", "admin");
  if (cErr) throw new Error(cErr.message);
  if ((count ?? 0) > 0) return {
    seeded: false
  };
  const email = emailFor("admin");
  const password = passwordFor("1234");
  const {
    data: existingList
  } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200
  });
  let userId = existingList?.users.find((u) => u.email === email)?.id;
  if (!userId) {
    const {
      data: created,
      error
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        user_id: "admin",
        full_name: "System Admin"
      }
    });
    if (error || !created.user) throw new Error(error?.message ?? "create failed");
    userId = created.user.id;
  }
  await supabaseAdmin.from("profiles").upsert({
    id: userId,
    user_id: "admin",
    full_name: "System Admin"
  }, {
    onConflict: "id"
  });
  await supabaseAdmin.from("user_roles").upsert({
    user_id: userId,
    role: "admin"
  }, {
    onConflict: "user_id,role"
  });
  return {
    seeded: true
  };
});
const createUserInput = objectType({
  user_id: userIdSchema,
  pin: pinSchema,
  full_name: stringType().trim().min(1).max(120),
  phone: stringType().trim().max(20).optional().nullable(),
  role: enumType(["admin", "block_officer", "cadre"]),
  cadre_type: enumType(["PRP", "FLCRP", "RBK", "IFC_Anchor", "SR_CRP"]).nullable().optional(),
  block_id: stringType().uuid().nullable().optional(),
  village: stringType().trim().min(1).max(120).nullable().optional(),
  panchayat: stringType().trim().max(120).nullable().optional(),
  gender: stringType().trim().max(20).nullable().optional(),
  join_date: stringType().trim().nullable().optional(),
  status: enumType(["Active", "Inactive"]).nullable().optional()
});
const createUser_createServerFn_handler = createServerRpc({
  id: "8a5ab6eb44ff34933514cd80eaebb5275eb142a889e28cbb625bede6478204b6",
  name: "createUser",
  filename: "src/lib/admin.functions.ts"
}, (opts) => createUser.__executeServer(opts));
const createUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => createUserInput.parse(data)).handler(createUser_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    data: roles
  } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden: admin only");
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const {
    data: created,
    error
  } = await supabaseAdmin.auth.admin.createUser({
    email: emailFor(data.user_id),
    password: passwordFor(data.pin),
    email_confirm: true,
    user_metadata: {
      user_id: data.user_id,
      full_name: data.full_name
    }
  });
  if (error || !created.user) throw new Error(error?.message ?? "create failed");
  const newId = created.user.id;
  const {
    error: pErr
  } = await supabaseAdmin.from("profiles").insert({
    id: newId,
    user_id: data.user_id,
    full_name: data.full_name,
    phone: data.phone ?? null,
    cadre_type: data.role === "cadre" ? data.cadre_type ?? null : null,
    block_id: data.block_id ?? null,
    village: data.role === "cadre" ? data.village ?? null : null,
    panchayat: data.role === "cadre" ? data.panchayat ?? null : null,
    gender: data.role === "cadre" ? data.gender ?? null : null,
    join_date: data.role === "cadre" ? data.join_date ?? null : null,
    status: data.role === "cadre" ? data.status ?? null : null
  });
  if (pErr) {
    await supabaseAdmin.auth.admin.deleteUser(newId);
    throw new Error(pErr.message);
  }
  const {
    error: rErr
  } = await supabaseAdmin.from("user_roles").insert({
    user_id: newId,
    role: data.role
  });
  if (rErr) {
    await supabaseAdmin.auth.admin.deleteUser(newId);
    throw new Error(rErr.message);
  }
  return {
    id: newId
  };
});
const deleteUser_createServerFn_handler = createServerRpc({
  id: "5f15d9c6194c3264109b1c81741c60a8654b66a5caffc1ee319315a3a983394e",
  name: "deleteUser",
  filename: "src/lib/admin.functions.ts"
}, (opts) => deleteUser.__executeServer(opts));
const deleteUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => objectType({
  id: stringType().uuid()
}).parse(data)).handler(deleteUser_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    data: roles
  } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden: admin only");
  if (data.id === context.userId) throw new Error("Cannot delete yourself");
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const {
    error
  } = await supabaseAdmin.auth.admin.deleteUser(data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const resetUserPin_createServerFn_handler = createServerRpc({
  id: "80e0e022f8c7a4ba7e1543f04829927225ac27fbb1fdd1e972900498e87163bf",
  name: "resetUserPin",
  filename: "src/lib/admin.functions.ts"
}, (opts) => resetUserPin.__executeServer(opts));
const resetUserPin = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => objectType({
  id: stringType().uuid(),
  pin: pinSchema
}).parse(data)).handler(resetUserPin_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    data: roles
  } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden: admin only");
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const {
    error
  } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
    password: passwordFor(data.pin)
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  createUser_createServerFn_handler,
  deleteUser_createServerFn_handler,
  ensureAdminSeeded_createServerFn_handler,
  resetUserPin_createServerFn_handler
};
