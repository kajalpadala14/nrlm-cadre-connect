import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type CadreType = Database["public"]["Enums"]["cadre_type"];

export interface ProfileWithRoles {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  cadre_type: CadreType | null;
  block_id: string | null;
  roles: AppRole[];
  // Extended profile fields (from DB migrations)
  profile_photo_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  training_status: string | null;
  village: string | null;
  gender: string | null;
  panchayat: string | null;
  join_date: string | null;
  status: string | null;
}

function userIdToEmail(userId: string) {
  return `${userId.trim().toLowerCase()}@nrlm.local`;
}
function pinToPassword(pin: string) {
  return `NRLM-${pin}`;
}

export async function signInWithIdPin(userId: string, pin: string) {
  const email = userIdToEmail(userId);
  const password = pinToPassword(pin);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export function useSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.session?.user.id ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { userId, ready };
}

export function useProfile() {
  const { userId, ready } = useSession();
  return useQuery({
    queryKey: ["profile", userId],
    enabled: ready && !!userId,
    queryFn: async (): Promise<ProfileWithRoles | null> => {
      if (!userId) return null;
      const [{ data: profile, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      if (!profile) return null;
      return { ...profile, roles: (roles ?? []).map((r) => r.role) };
    },
  });
}

export function useSignOut() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return useCallback(async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }, [navigate, qc]);
}

export function highestRole(roles: AppRole[]): AppRole | null {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("block_officer")) return "block_officer";
  if (roles.includes("cadre")) return "cadre";
  return null;
}
