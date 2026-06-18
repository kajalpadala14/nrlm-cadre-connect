import { supabase } from "@/integrations/supabase/client";
import type { QueryClient } from "@tanstack/react-query";
import { invalidateConsistencyQueries } from "@/hooks/use-activity-cache-sync";

export type EvidenceDeleteTarget = {
  id: string;
  storage_path: string | null;
};

export async function deleteEvidenceWithConsistency(
  target: EvidenceDeleteTarget,
  queryClient?: QueryClient,
) {
  if (target.storage_path) {
    const { error: storageError } = await supabase.storage
      .from("activity-photos")
      .remove([target.storage_path]);
    if (storageError) throw storageError;
  }

  const { error } = await (supabase.rpc as any)("delete_evidence_with_consistency", {
    p_evidence_id: target.id,
  });
  if (error) throw error;

  if (queryClient) invalidateConsistencyQueries(queryClient);
}
