import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useProfile, highestRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomeDispatcher,
});

function HomeDispatcher() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();

  useEffect(() => {
    if (isLoading || !profile) return;
    const role = highestRole(profile.roles);
    if (role === "cadre") navigate({ to: "/cadre", replace: true });
    else navigate({ to: "/dashboard", replace: true });
  }, [isLoading, profile, navigate]);

  return <div className="py-12 text-center text-muted-foreground text-sm">Loading…</div>;
}
