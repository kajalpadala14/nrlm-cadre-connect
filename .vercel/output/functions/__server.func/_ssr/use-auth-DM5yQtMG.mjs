import { u as useQuery, a as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { r as reactExports } from "../_libs/react.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
function userIdToEmail(userId) {
  return `${userId.trim().toLowerCase()}@nrlm.local`;
}
function pinToPassword(pin) {
  return `NRLM-${pin}`;
}
async function signInWithIdPin(userId, pin) {
  const email = userIdToEmail(userId);
  const password = pinToPassword(pin);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
let _sessionCache = { userId: null, ready: false };
let _sessionListeners = [];
function notifySessionListeners(s) {
  _sessionCache = s;
  _sessionListeners.forEach((fn) => fn(s));
}
if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    notifySessionListeners({ userId: data.session?.user.id ?? null, ready: true });
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    notifySessionListeners({ userId: session?.user.id ?? null, ready: true });
  });
}
function useSession() {
  const [state, setState] = reactExports.useState(_sessionCache);
  reactExports.useEffect(() => {
    _sessionListeners.push(setState);
    if (_sessionCache.ready !== state.ready || _sessionCache.userId !== state.userId) {
      setState(_sessionCache);
    }
    return () => {
      _sessionListeners = _sessionListeners.filter((fn) => fn !== setState);
    };
  }, []);
  return { userId: state.userId, ready: state.ready };
}
function useProfile() {
  const { userId, ready } = useSession();
  return useQuery({
    queryKey: ["profile", userId],
    enabled: ready && !!userId,
    staleTime: 6e4,
    queryFn: async () => {
      if (!userId) return null;
      const [{ data: profile, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId)
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      if (!profile) return null;
      return { ...profile, roles: (roles ?? []).map((r) => r.role) };
    }
  });
}
function useSignOut() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return reactExports.useCallback(async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }, [navigate, qc]);
}
function highestRole(roles) {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("block_officer")) return "block_officer";
  if (roles.includes("cadre")) return "cadre";
  return null;
}
export {
  useProfile as a,
  useSignOut as b,
  highestRole as h,
  signInWithIdPin as s,
  useSession as u
};
