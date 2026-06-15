import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { useT } from "@/lib/i18n";
import { User, Languages } from "lucide-react";
import { useProfile, highestRole } from "@/hooks/use-auth";

// Routes under /dashboard/* require admin or block_officer.
// Routes under /cadre/* require cadre role.
// Any authenticated user reaching a mismatched section is redirected.
// Users with no recognized role are redirected to /auth.
const STAFF_PATHS = "/dashboard";
const CADRE_PATHS = "/cadre";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/" });

    // Fetch the user's roles from user_roles table
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const roles = (roleRows ?? []).map((r) => r.role as string);
    const isStaff = roles.includes("admin") || roles.includes("block_officer");
    const isCadre = roles.includes("cadre");

    // A user with no recognized role has no valid section — send to auth.
    if (!isStaff && !isCadre) {
      await supabase.auth.signOut();
      throw redirect({ to: "/" });
    }

    const goingToDashboard = location.pathname.startsWith(STAFF_PATHS);
    const goingToCadre = location.pathname.startsWith(CADRE_PATHS);

    // A cadre trying to access /dashboard/* → redirect to their home
    if (goingToDashboard && !isStaff) {
      throw redirect({ to: "/cadre" });
    }

    // A staff user trying to access /cadre/* → redirect to dashboard
    if (goingToCadre && isStaff && !isCadre) {
      throw redirect({ to: "/dashboard" });
    }

    return { user: data.user, roles, isStaff, isCadre };
  },
  component: AuthedLayoutWrapper,
});

function AuthedLayoutWrapper() {
  return <AuthedLayout />;
}

function AuthedLayout() {
  const { t, lang, toggleLang } = useT();
  const { data: profile } = useProfile();
  const role = highestRole(profile?.roles ?? []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between gap-4 border-b border-border bg-white px-4 py-2 shadow-sm sm:px-6">
            {/* Left: sidebar trigger + title */}
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="text-foreground h-10 w-10 hover:bg-slate-100 rounded-lg shrink-0" />
              <h1 className="text-base font-bold text-slate-800 tracking-tight sm:text-xl md:text-2xl truncate">
                NRLM Cadre Monitoring System
              </h1>
            </div>

            {/* Right: language toggle + profile */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Language Toggle */}
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-1.5 h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors focus:outline-none"
                title={lang === "en" ? "हिंदी में बदलें" : "Switch to English"}
              >
                <Languages className="h-4 w-4 text-slate-400" />
                <span className="hidden sm:inline">{lang === "en" ? "हिंदी" : "English"}</span>
                <span className="sm:hidden">{lang === "en" ? "हि" : "En"}</span>
              </button>

              {/* Profile badge */}
              <div className="hidden items-center gap-2 border-l border-slate-100 pl-3 md:flex">
                <div className="text-right leading-none">
                  <div className="text-sm font-bold text-slate-800">
                    {profile?.full_name ?? "Admin User"}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    {role ? t(`role.${role}`) : "District Admin"}
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold border-2 border-slate-200 overflow-hidden shrink-0">
                  {profile?.full_name ? (
                    profile.full_name[0].toUpperCase()
                  ) : (
                    <User className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Mobile profile avatar only */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200 overflow-hidden shrink-0 md:hidden">
                {profile?.full_name ? (
                  profile.full_name[0].toUpperCase()
                ) : (
                  <User className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>
          </header>

          {/* Main Content Viewport */}
          <main className="w-full flex-1 px-4 py-5 sm:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
