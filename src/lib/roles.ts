import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const BLOCK_SCOPED_STAFF_ROLES = ["block_officer", "fnhw", "si"] as const;
export const STAFF_ROLES = ["admin", ...BLOCK_SCOPED_STAFF_ROLES] as const;

export type BlockScopedStaffRole = (typeof BLOCK_SCOPED_STAFF_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];

export function isAdminRole(role: AppRole | string | null | undefined): role is "admin" {
  return role === "admin";
}

export function isBlockScopedStaffRole(
  role: AppRole | string | null | undefined,
): role is BlockScopedStaffRole {
  return BLOCK_SCOPED_STAFF_ROLES.includes(role as BlockScopedStaffRole);
}

export function isStaffRole(role: AppRole | string | null | undefined): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export function hasAdminRole(roles: readonly (AppRole | string)[]) {
  return roles.some(isAdminRole);
}

export function hasBlockScopedStaffRole(roles: readonly (AppRole | string)[]) {
  return roles.some(isBlockScopedStaffRole);
}

export function hasStaffRole(roles: readonly (AppRole | string)[]) {
  return roles.some(isStaffRole);
}
