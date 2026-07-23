import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CADRE_LOCATION_MAX_LENGTH } from "@/lib/validation-limits";
import {
  hasAdminRole,
  hasBlockScopedStaffRole,
  isCadreAccountRole,
  type AppRole,
} from "@/lib/roles";
import { standardizeVillageName } from "@/lib/utils/villages";
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

type CreateUserRole = AppRole | "BPM" | "DPM" | "AC" | "Gender" | "FNHW" | "SI";

function normalizeCreateUserRole(role: CreateUserRole): AppRole {
  if (role === "DPM") return "admin";
  if (role === "BPM" || role === "AC") return "block_officer";
  if (role === "Gender") return "cadre";
  if (role === "FNHW") return "cadre";
  if (role === "SI") return "cadre";
  return role;
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
  role: z.enum([
    "admin",
    "block_officer",
    "fnhw",
    "si",
    "cadre",
    "BPM",
    "DPM",
    "AC",
    "Gender",
    "FNHW",
    "SI",
  ]),
  cadre_type: z
    .enum(["PRP", "FLCRP", "RBK", "IFC_Anchor", "SR_CRP", "FPO_CEO", "Gender", "FNHW", "SI"])
    .nullable()
    .optional(),
  block_id: z.string().uuid().nullable().optional(),
  village: z.string().trim().min(1).max(CADRE_LOCATION_MAX_LENGTH).nullable().optional(),
  panchayat: z.string().trim().max(CADRE_LOCATION_MAX_LENGTH).nullable().optional(),
  gender: z.string().trim().max(20).nullable().optional(),
  join_date: z.string().trim().nullable().optional(),
  status: z.enum(["Active", "Inactive"]).nullable().optional(),
});

const updateUserInput = z.object({
  id: z.string().uuid(),
  user_id: userIdSchema.optional(),
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(20).optional().nullable(),
  role: z.enum(["admin", "block_officer", "fnhw", "si", "cadre"]).optional(),
  cadre_type: z
    .enum(["PRP", "FLCRP", "RBK", "IFC_Anchor", "SR_CRP", "FPO_CEO", "Gender", "FNHW", "SI"])
    .nullable()
    .optional(),
  block_id: z.string().uuid().nullable().optional(),
  village: z.string().trim().max(CADRE_LOCATION_MAX_LENGTH).nullable().optional(),
  panchayat: z.string().trim().max(CADRE_LOCATION_MAX_LENGTH).nullable().optional(),
  gender: z.string().trim().max(20).nullable().optional(),
  join_date: z.string().trim().nullable().optional(),
  status: z.enum(["Active", "Inactive"]).nullable().optional(),
});

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createUserInput.parse(data))
  .handler(async ({ data, context }) => {
    // Admins can create any role.
    // Block-scoped staff can create cadres in their own block only.
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roleList = (roles ?? []).map((r) => r.role);
    const isAdmin = hasAdminRole(roleList);
    const isBlockOfficer = hasBlockScopedStaffRole(roleList);

    if (!isAdmin && !isBlockOfficer) throw new Error("Forbidden: admin or block officer only");

    const systemRole = normalizeCreateUserRole(data.role);
    const isTargetCadreAccount = isCadreAccountRole(systemRole);

    // Block officers may only create cadre accounts, including FNHW/SI cadre roles.
    if (!isAdmin && !isTargetCadreAccount) {
      throw new Error("Forbidden: block officers can only create cadre accounts");
    }

    // Block officers may only create cadres within their own assigned block
    if (!isAdmin && isBlockOfficer) {
      const { data: myProfile } = await context.supabase
        .from("profiles")
        .select("block_id")
        .eq("id", context.userId)
        .single();
      if (!myProfile?.block_id) {
        throw new Error("Forbidden: block-level staff must be assigned to a block");
      }
      if (data.block_id !== myProfile.block_id) {
        throw new Error("Forbidden: you can only add cadres to your own block");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const targetEmail = emailFor(data.user_id);

    // ── Idempotency guard ───────────────────────────────────────────────
    // If an auth user with this email already exists (from a duplicate rapid
    // click or a retry), return its ID immediately without creating anything.
    // This makes createUser safe to call multiple times with the same input.
    const { data: existingList } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const existingAuthUser = existingList?.users.find((u) => u.email === targetEmail);
    if (existingAuthUser) {
      // Already exists — verify profile + role rows are in place then return
      await supabaseAdmin.from("profiles").upsert(
        {
          id: existingAuthUser.id,
          user_id: data.user_id,
          full_name: data.full_name,
          phone: data.phone ?? null,
          cadre_type: isTargetCadreAccount ? (data.cadre_type ?? null) : null,
          block_id: data.block_id ?? null,
          village: isTargetCadreAccount ? standardizeVillageName(data.village, { logUnmatched: true }) || null : null,
          panchayat: isTargetCadreAccount ? (data.panchayat ?? null) : null,
          gender: isTargetCadreAccount ? (data.gender ?? null) : null,
          join_date: isTargetCadreAccount ? (data.join_date ?? null) : null,
          status: isTargetCadreAccount ? (data.status ?? null) : null,
        },
        { onConflict: "id" },
      );
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: existingAuthUser.id, role: systemRole }, { onConflict: "user_id,role" });
      return { id: existingAuthUser.id };
    }
    // ────────────────────────────────────────────────────────────────────

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: targetEmail,
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
      cadre_type: isTargetCadreAccount ? (data.cadre_type ?? null) : null,
      block_id: data.block_id ?? null,
      village: isTargetCadreAccount ? standardizeVillageName(data.village, { logUnmatched: true }) || null : null,
      panchayat: isTargetCadreAccount ? (data.panchayat ?? null) : null,
      gender: isTargetCadreAccount ? (data.gender ?? null) : null,
      join_date: isTargetCadreAccount ? (data.join_date ?? null) : null,
      status: isTargetCadreAccount ? (data.status ?? null) : null,
    });
    if (pErr) {
      await supabaseAdmin.auth.admin.deleteUser(newId);
      throw new Error(pErr.message);
    }
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newId, role: systemRole });
    if (rErr) {
      await supabaseAdmin.auth.admin.deleteUser(newId);
      throw new Error(rErr.message);
    }
    return { id: newId };
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateUserInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roleList = (roles ?? []).map((r) => r.role);
    const isAdmin = hasAdminRole(roleList);
    const isBlockOfficer = hasBlockScopedStaffRole(roleList);

    if (!isAdmin && !isBlockOfficer) throw new Error("Forbidden: admin or block officer only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: targetRoles, error: targetRolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.id);
    if (targetRolesError) throw new Error(targetRolesError.message);
    const targetRoleList = (targetRoles ?? []).map((r) => r.role);
    const targetIsCadre = targetRoleList.includes("cadre") || targetRoleList.includes("fnhw") || targetRoleList.includes("si");

    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
      .from("profiles")
      .select("block_id, user_id")
      .eq("id", data.id)
      .single();
    if (targetProfileError) throw new Error(targetProfileError.message);

    if (!isAdmin && isBlockOfficer) {
      if (!targetIsCadre) throw new Error("Forbidden: block officers can only edit cadre accounts");

      const { data: myProfile, error: myProfileError } = await context.supabase
        .from("profiles")
        .select("block_id")
        .eq("id", context.userId)
        .single();
      if (myProfileError) throw new Error(myProfileError.message);

      if (!myProfile?.block_id || targetProfile?.block_id !== myProfile.block_id) {
        throw new Error("Forbidden: you can only edit cadres in your own block");
      }
      if (data.block_id && data.block_id !== myProfile.block_id) {
        throw new Error("Forbidden: you cannot move cadres outside your block");
      }
    }

    const nextUserId = data.user_id?.trim().toLowerCase();
    if (nextUserId && nextUserId !== targetProfile.user_id.toLowerCase()) {
      const { data: duplicateProfile, error: duplicateError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("user_id", nextUserId)
        .neq("id", data.id)
        .maybeSingle();
      if (duplicateError) throw new Error(duplicateError.message);
      if (duplicateProfile)
        throw new Error("User ID already exists. Please choose another User ID.");

      const targetEmail = emailFor(nextUserId);
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const duplicateAuthUser = existingUsers?.users.find(
        (u) => u.email?.toLowerCase() === targetEmail && u.id !== data.id,
      );
      if (duplicateAuthUser)
        throw new Error("User ID already exists. Please choose another User ID.");

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        email: targetEmail,
        user_metadata: { user_id: nextUserId, full_name: data.full_name },
      });
      if (authError) throw new Error(authError.message);
    } else {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        user_metadata: { user_id: targetProfile.user_id, full_name: data.full_name },
      });
      if (authError) throw new Error(authError.message);
    }

    const updates = {
      user_id: nextUserId ?? targetProfile.user_id,
      full_name: data.full_name,
      phone: data.phone ?? null,
      cadre_type: targetIsCadre ? (data.cadre_type ?? null) : null,
      block_id: data.block_id ?? null,
      village: targetIsCadre ? standardizeVillageName(data.village, { logUnmatched: true }) || null : null,
      panchayat: targetIsCadre ? (data.panchayat ?? null) : null,
      gender: targetIsCadre ? (data.gender ?? null) : null,
      join_date: targetIsCadre ? (data.join_date ?? null) : null,
      status: targetIsCadre ? (data.status ?? null) : null,
    };

    const { data: updated, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", data.id)
      .select("id, user_id")
      .single();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("User record was not found.");

    if (data.role) {
      const nextRole = normalizeCreateUserRole(data.role);
      const { error: deleteRoleErr } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.id);
      if (deleteRoleErr) throw new Error(deleteRoleErr.message);

      const { error: insertRoleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.id, role: nextRole });
      if (insertRoleErr) throw new Error(insertRoleErr.message);
    }

    return { id: updated.id, user_id: updated.user_id };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roleList = (roles ?? []).map((r) => r.role);
    const isAdmin = hasAdminRole(roleList);
    const isBlockOfficer = hasBlockScopedStaffRole(roleList);

    if (!isAdmin && !isBlockOfficer) throw new Error("Forbidden: admin or block officer only");
    if (data.id === context.userId) throw new Error("Cannot delete yourself");

    // Block officers can only delete cadres — not admins or other block officers
    if (!isAdmin && isBlockOfficer) {
      const { data: targetRoles } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.id);
      const targetIsCadre = (targetRoles ?? []).some((r) => ["cadre", "fnhw", "si"].includes(r.role));
      if (!targetIsCadre)
        throw new Error("Forbidden: block officers can only delete cadre accounts");

      const [{ data: myProfile }, { data: targetProfile }] = await Promise.all([
        context.supabase.from("profiles").select("block_id").eq("id", context.userId).single(),
        context.supabase.from("profiles").select("block_id").eq("id", data.id).single(),
      ]);
      if (!myProfile?.block_id || targetProfile?.block_id !== myProfile.block_id) {
        throw new Error("Forbidden: you can only delete cadres in your own block");
      }
    }

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
    const roleList = (roles ?? []).map((r) => r.role);
    const isAdmin = hasAdminRole(roleList);
    const isBlockOfficer = hasBlockScopedStaffRole(roleList);

    if (!isAdmin && !isBlockOfficer) throw new Error("Forbidden: admin or block officer only");

    // Block officers can only reset PINs for cadres
    if (!isAdmin && isBlockOfficer) {
      const { data: targetRoles } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.id);
      const targetIsCadre = (targetRoles ?? []).some((r) => isCadreAccountRole(r.role));
      if (!targetIsCadre) throw new Error("Forbidden: block officers can only reset cadre PINs");

      const [{ data: myProfile }, { data: targetProfile }] = await Promise.all([
        context.supabase.from("profiles").select("block_id").eq("id", context.userId).single(),
        context.supabase.from("profiles").select("block_id").eq("id", data.id).single(),
      ]);
      if (!myProfile?.block_id || targetProfile?.block_id !== myProfile.block_id) {
        throw new Error("Forbidden: you can only reset PINs for cadres in your own block");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      password: passwordFor(data.pin),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
