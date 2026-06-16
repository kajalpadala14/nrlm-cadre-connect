import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useProfile, highestRole, useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomeDispatcher,
});

function HomeDispatcher() {
  const navigate = useNavigate();
  const { data: profile, isLoading, isError } = useProfile();
  const { ready } = useSession();
  const fallbackFired = useRef(false);

  useEffect(() => {
    // Happy path: profile loaded — redirect immediately
    if (!isLoading && profile) {
      const role = highestRole(profile.roles);
      if (role === "cadre") {
        navigate({ to: "/cadre", replace: true });
      } else {
        navigate({ to: "/dashboard", replace: true });
      }
      return;
    }

    // Error path: profile fetch failed — fall back based on session only
    if (isError && !fallbackFired.current) {
      fallbackFired.current = true;
      navigate({ to: "/auth", replace: true });
      return;
    }

    // Safety net: if session is ready but profile is still null after loading,
    // redirect to /auth to avoid an infinite spinner
    if (ready && !isLoading && !profile && !isError && !fallbackFired.current) {
      fallbackFired.current = true;
      navigate({ to: "/auth", replace: true });
    }
  }, [isLoading, profile, isError, ready, navigate]);

  // Timeout fallback: if nothing resolves in 8 seconds, bail to /auth
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fallbackFired.current) {
        fallbackFired.current = true;
        navigate({ to: "/auth", replace: true });
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
    </div>
  );
}
