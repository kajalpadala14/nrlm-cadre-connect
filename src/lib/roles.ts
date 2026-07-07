import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

// Block-scoped staff who get the full dashboard/staff view (BPM / Block Officer / AC)
export const BLOCK_SCOPED_STAFF_ROLES = ["block_officer"] as const;
export const STAFF_ROLES = ["admin", ...BLOCK_SCOPED_STAFF_ROLES] as const;

// Field Officers (FNHW, SI) — have a staff-like DB role but use the cadre/field-officer view
export const FIELD_OFFICER_ROLES = ["fnhw", "si"] as const;

export type BlockScopedStaffRole = (typeof BLOCK_SCOPED_STAFF_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type FieldOfficerRole = (typeof FIELD_OFFICER_ROLES)[number];

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

export function isFieldOfficerRole(
  role: AppRole | string | null | undefined,
): role is FieldOfficerRole {
  return FIELD_OFFICER_ROLES.includes(role as FieldOfficerRole);
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

export function hasFieldOfficerRole(roles: readonly (AppRole | string)[]) {
  return roles.some(isFieldOfficerRole);
}
