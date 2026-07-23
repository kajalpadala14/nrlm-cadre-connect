import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type CadreType = Database["public"]["Enums"]["cadre_type"];

export const BLOCK_SCOPED_STAFF_ROLES = ["block_officer"] as const;
export const STAFF_ROLES = ["admin", ...BLOCK_SCOPED_STAFF_ROLES] as const;
// Keep fnhw/si here for legacy rows already stored in user_roles, but new
// FNHW/SI accounts are saved as role=cadre with cadre_type=FNHW/SI.
export const CADRE_ACCOUNT_ROLES = ["cadre", "fnhw", "si"] as const;
export const CADRE_TYPE_OPTIONS: readonly CadreType[] = [
  "PRP",
  "FLCRP",
  "RBK",
  "IFC_Anchor",
  "SR_CRP",
  "FPO_CEO",
  "Gender",
  "FNHW",
  "SI",
] as const;

export const CADRE_TYPE_LABELS: Record<CadreType, string> = {
  PRP: "PRP",
  FLCRP: "FLCRP",
  RBK: "RBK",
  IFC_Anchor: "IFC Anchor",
  SR_CRP: "SR CRP",
  FPO_CEO: "FPO CEO",
  Gender: "Gender",
  FNHW: "FNHW",
  SI: "SI",
};

export type BlockScopedStaffRole = (typeof BLOCK_SCOPED_STAFF_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type CadreAccountRole = (typeof CADRE_ACCOUNT_ROLES)[number];

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

export function isCadreAccountRole(
  role: AppRole | string | null | undefined,
): role is CadreAccountRole {
  return CADRE_ACCOUNT_ROLES.includes(role as CadreAccountRole);
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
