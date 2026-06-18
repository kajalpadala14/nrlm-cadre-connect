import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CADRE_LOCATION_MAX_LENGTH } from "@/lib/validation-limits";
import { z } from "zod";

const userIdSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-zA-Z0-9_.-]+$/, "User ID must be letters, digits, _ . -");
const pinSchema = z.string().regex(/^[0-9]{4}$/, "PIN must be 4 digits");

function emailFor(userId: string) {
  return `${userId.trim().toLowerCase()}@nrlm.local`;
}
function passwordFor(pin: string) {
  return `NRLM-${pin}`;
}

/**
 * Public bootstrap: if no admin exists yet, seed admin/1234.
 * Safe to call repeatedly; becomes a no-op once an admin exists.
 *
 * Returns { seeded: true } on first-time seed, { seeded: false } if an admin
 * already exists, and { seeded: false, reason: "no_service_key" } when the
 * SUPABASE_SERVICE_ROLE_KEY env var is absent (e.g. local dev without the key).
 * It NEVER throws — callers can safely fire-and-forget.
 */
export const ensureAdminSeeded = createServerFn({ method: "POST" }).handler(async () => {
  // Guard: if the service role key is not configured, skip silently.
  // This prevents the startup error when running locally without the key.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { seeded: false, reason: "no_service_key" } as const;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error: cErr } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (cErr) throw new Error(cErr.message);
  if ((count ?? 0) > 0) return { seeded: false } as const;

  const email = emailFor("admin");
  const password = passwordFor("1234");
  // try to find existing auth user
  const { data: existingList } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  let userId = existingList?.users.find((u) => u.email === email)?.id;
  if (!userId) {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { user_id: "admin", full_name: "System Admin" },
    });
    if (error || !created.user) throw new Error(error?.message ?? "create failed");
    userId = created.user.id;
  }
  await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, user_id: "admin", full_name: "System Admin" }, { onConflict: "id" });
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  return { seeded: true } as const;
});

const createUserInput = z.object({
  user_id: userIdSchema,
  pin: pinSchema,
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(20).optional().nullable(),
  role: z.enum(["admin", "block_officer", "cadre"]),
  cadre_type: z
    .enum(["PRP", "FLCRP", "RBK", "IFC_Anchor", "SR_CRP"])
    .nullable()
    .optional(),
  block_id: z.string().uuid().nullable().optional(),
  village: z.string().trim().min(1).max(CADRE_LOCATION_MAX_LENGTH).nullable().optional(),
  panchayat: z.string().trim().max(CADRE_LOCATION_MAX_LENGTH).nullable().optional(),
  gender: z.string().trim().max(20).nullable().optional(),
  join_date: z.string().trim().nullable().optional(),
  status: z.enum(["Active", "Inactive"]).nullable().optional(),
});

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createUserInput.parse(data))
  .handler(async ({ data, context }) => {
    // Only admins
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Forbidden: admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: emailFor(data.user_id),
      password: passwordFor(data.pin),
      email_confirm: true,
      user_metadata: { user_id: data.user_id, full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "create failed");
    const newId = created.user.id;

    const { error: pErr } = await supabaseAdmin.from("profiles").insert({
      id: newId,
      user_id: data.user_id,
      full_name: data.full_name,
      phone: data.phone ?? null,
      cadre_type: data.role === "cadre" ? (data.cadre_type ?? null) : null,
      block_id: data.block_id ?? null,
      village: data.role === "cadre" ? (data.village ?? null) : null,
      panchayat: data.role === "cadre" ? (data.panchayat ?? null) : null,
      gender: data.role === "cadre" ? (data.gender ?? null) : null,
      join_date: data.role === "cadre" ? (data.join_date ?? null) : null,
      status: data.role === "cadre" ? (data.status ?? null) : null,
    });
    if (pErr) {
      await supabaseAdmin.auth.admin.deleteUser(newId);
      throw new Error(pErr.message);
    }
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newId, role: data.role });
    if (rErr) {
      await supabaseAdmin.auth.admin.deleteUser(newId);
      throw new Error(rErr.message);
    }
    return { id: newId };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Forbidden: admin only");
    if (data.id === context.userId) throw new Error("Cannot delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetUserPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), pin: pinSchema }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Forbidden: admin only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      password: passwordFor(data.pin),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
