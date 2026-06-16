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

// ─── Module-level session cache ────────────────────────────────────────────
// Stores the resolved session userId so every useSession() caller shares
// the same value without each needing its own async getSession() round-trip.
// This eliminates the race where profile is null at submit time because
// getSession() hasn't resolved yet in the component's local state.

type SessionState = { userId: string | null; ready: boolean };
let _sessionCache: SessionState = { userId: null, ready: false };
let _sessionListeners: Array<(s: SessionState) => void> = [];

function notifySessionListeners(s: SessionState) {
  _sessionCache = s;
  _sessionListeners.forEach((fn) => fn(s));
}

// Bootstrap: resolve session once at module load time
supabase.auth.getSession().then(({ data }) => {
  notifySessionListeners({ userId: data.session?.user.id ?? null, ready: true });
});

// Keep cache in sync with auth state changes (login / logout)
supabase.auth.onAuthStateChange((_event, session) => {
  notifySessionListeners({ userId: session?.user.id ?? null, ready: true });
});

// ─────────────────────────────────────────────────────────────────────────

export function useSession() {
  const [state, setState] = useState<SessionState>(_sessionCache);

  useEffect(() => {
    // If already ready (cached), nothing extra needed — state was set from cache above.
    // Register for future changes (logout, token refresh, etc.)
    _sessionListeners.push(setState);
    // Sync in case state changed between render and effect
    if (_sessionCache.ready !== state.ready || _sessionCache.userId !== state.userId) {
      setState(_sessionCache);
    }
    return () => {
      _sessionListeners = _sessionListeners.filter((fn) => fn !== setState);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { userId: state.userId, ready: state.ready };
}

export function useProfile() {
  const { userId, ready } = useSession();
  return useQuery({
    queryKey: ["profile", userId],
    enabled: ready && !!userId,
    staleTime: 60_000,
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
