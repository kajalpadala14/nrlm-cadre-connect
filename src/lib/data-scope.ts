import { highestRole } from "@/hooks/use-auth";
import type { ProfileWithRoles } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { isBlockScopedStaffRole } from "@/lib/roles";

export interface UserScope {
  /** true once the profile has finished loading */
  ready: boolean;
  /** true if this user is scoped to a specific block */
  isScoped: boolean;
  /** the block UUID if scoped, null otherwise */
  blockId: string | null;
}

/** UUID v4 regex — rejects "none", "", or any non-UUID string */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_BLOCK_SCOPE_ID = "00000000-0000-0000-0000-000000000000";

function isValidUUID(v: string | null | undefined): v is string {
  return !!v && UUID_RE.test(v);
}

interface ScopedQuery<TSelf> {
  in(column: string, values: string[]): TSelf;
  eq(column: string, value: string): TSelf;
}

export function getUserDataScope(user: ProfileWithRoles | null | undefined): UserScope {
  // Profile not yet loaded — do NOT run scoped queries yet
  if (user === undefined || user === null) {
    return { ready: false, isScoped: false, blockId: null };
  }

  const role = highestRole(user.roles);
  // Block-scoped staff roles share BPM/Block Officer data visibility.
  const isScoped = isBlockScopedStaffRole(role);

  if (isScoped && isValidUUID(user.block_id)) {
    return { ready: true, isScoped: true, blockId: user.block_id };
  }

  if (isScoped) {
    return { ready: true, isScoped: true, blockId: EMPTY_BLOCK_SCOPE_ID };
  }

  // Admin
  return { ready: true, isScoped: false, blockId: null };
}

/**
 * Get all cadre user IDs that belong to a specific block.
 *
 * IMPORTANT: attendance and activities tables often have block_id = NULL.
 * We resolve cadre IDs from the profiles table (block_id is reliable there)
 * and then use cadre_id for filtering those tables.
 */
export async function getCadreIdsInBlock(blockId: string): Promise<string[]> {
  if (!isValidUUID(blockId)) return [];

  // Get all users with cadre role
  const { data: userRoles, error: urError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "cadre");
  if (urError || !userRoles || userRoles.length === 0) return [];

  const allCadreIds = userRoles.map((r) => r.user_id);

  // Filter those cadres by block_id from their profiles (block_id is a real UUID here)
  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("id")
    .eq("block_id", blockId)
    .in("id", allCadreIds);
  if (pError || !profiles) return [];
  return profiles.map((p) => p.id);
}

/**
 * Apply block scope to a Supabase query using cadre_id filtering.
 *
 * We ALWAYS filter by cadre_id (never block_id on the target table) because:
 * - attendance.block_id is often NULL (not filled at check-in time)
 * - activities.block_id is often NULL (not filled at submit time)
 * - profiles.block_id IS reliably set (we use this to resolve cadreIds)
 */
export function applyScopeToQuery<TQuery extends ScopedQuery<TQuery>>(
  query: TQuery,
  _tableHasBlockId: boolean, // kept for API compatibility, ignored
  blockId: string | null,
  cadreIds: string[],
): TQuery {
  if (!blockId || !isValidUUID(blockId)) return query;

  if (cadreIds.length > 0) {
    return query.in("cadre_id", cadreIds);
  }
  // Block has no cadres — force empty result (valid UUID, no match)
  return query.eq("cadre_id", EMPTY_BLOCK_SCOPE_ID);
}

/**
 * Apply block scope to a query that uses block_id column directly.
 * Safe to use on the profiles table where block_id is reliably set.
 */
export function applyScopeByBlockId<TQuery extends ScopedQuery<TQuery>>(
  query: TQuery,
  blockId: string | null,
): TQuery {
  if (!blockId || !isValidUUID(blockId)) return query;
  return query.eq("block_id", blockId);
}
