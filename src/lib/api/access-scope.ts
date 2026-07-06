import { supabase as browserClient } from "@/integrations/supabase/client";
import { hasAdminRole, hasBlockScopedStaffRole } from "@/lib/roles";

type SupabaseClient = typeof browserClient;

export interface StaffScope {
  isAdmin: boolean;
  isBlockOfficer: boolean;
  blockId: string | null;
}

export async function requireStaffScope(
  supabase: SupabaseClient,
  userId: string,
): Promise<StaffScope> {
  const [{ data: roles, error: rolesError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("block_id").eq("id", userId).maybeSingle(),
    ]);

  if (rolesError) throw rolesError;
  if (profileError) throw profileError;

  const roleList = (roles ?? []).map((r) => r.role);
  const isAdmin = hasAdminRole(roleList);
  const isBlockOfficer = hasBlockScopedStaffRole(roleList);

  if (!isAdmin && !isBlockOfficer) throw new Error("Forbidden: staff only");

  return {
    isAdmin,
    isBlockOfficer,
    blockId: profile?.block_id ?? null,
  };
}

export function resolveScopedBlockId(scope: StaffScope, requestedBlockId?: string | null) {
  if (scope.isAdmin) return requestedBlockId ?? null;
  if (!scope.blockId) throw new Error("Forbidden: block officer has no assigned block");
  if (requestedBlockId && requestedBlockId !== scope.blockId) {
    throw new Error("Forbidden: cannot access another block");
  }
  return scope.blockId;
}
