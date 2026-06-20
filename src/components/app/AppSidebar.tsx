import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardList,
  Image as ImageIcon,
  CheckSquare,
  ChevronDown,
  LogOut,
  Languages,
  Plus,
  ClipboardCheck,
  History,
  User as UserIcon,
  HelpCircle,
  Bell,
  BarChart2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useProfile, highestRole, useSignOut } from "@/hooks/use-auth";

function NrlmLogo() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm border border-emerald-100">
      <svg
        className="h-full w-full"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer green circle */}
        <circle cx="50" cy="50" r="46" stroke="#10b981" strokeWidth="5" />
        {/* Inner orange/yellow concentric circle */}
        <circle cx="50" cy="50" r="38" stroke="#f59e0b" strokeWidth="4" fill="#ffffff" />
        {/* Abstract tricolor leaf/people pattern */}
        <path
          d="M50 22C42 22 36 29 36 37C36 43 41 47 46 49C43 52 41 56 41 61C41 70 47 77 50 77C53 77 59 70 59 61C59 56 57 52 54 49C59 47 64 43 64 37C64 29 58 22 50 22Z"
          fill="#3b82f6"
          fillOpacity="0.1"
        />
        {/* Top/Center leaf (Orange) */}
        <path
          d="M50 32C46 32 43 35 43 39C43 43 46 45 50 50C54 45 57 43 57 39C57 35 54 32 50 32Z"
          fill="#f59e0b"
        />
        {/* Left leaf (Green) */}
        <path
          d="M43 44C38 46 35 50 35 55C35 61 40 66 45 67C44 63 44 59 45 55C46 50 48 47 43 44Z"
          fill="#10b981"
        />
        {/* Right leaf (Blue) */}
        <path
          d="M57 44C62 46 65 50 65 55C65 61 60 66 55 67C56 63 56 59 55 55C54 50 52 47 57 44Z"
          fill="#3b82f6"
        />
        {/* Inner center dot */}
        <circle cx="50" cy="39" r="3.5" fill="#ffffff" />
      </svg>
    </div>
  );
}

export function AppSidebar() {
  const { t, lang, toggleLang } = useT();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const role = highestRole(profile?.roles ?? []);
  const signOut = useSignOut();

  const isStaff = role === "admin" || role === "block_officer";

  // Direct home route for the logo link — avoids the /home dispatcher round-trip
  const homeRoute = isStaff ? "/dashboard" : "/cadre";

  const staffItems = [
    { to: "/dashboard", label: t("dashboard"), icon: LayoutDashboard, exact: true },
    { to: "/dashboard/users", label: t("cadre_management"), icon: Users },
    { to: "/dashboard/attendance", label: t("attendance"), icon: CalendarCheck },
    { to: "/dashboard/leave", label: t("leave_management"), icon: ClipboardCheck },
    { to: "/dashboard/activities", label: t("activity_tracking"), icon: ClipboardList },
    { to: "/dashboard/evidence", label: t("evidence_gallery"), icon: ImageIcon },
    { to: "/dashboard/approvals", label: t("approvals"), icon: CheckSquare },
    { to: "/dashboard/reports", label: t("reports"), icon: BarChart2 },
    { to: "/dashboard/help", label: t("help_support"), icon: HelpCircle },
  ];

  const cadreItems = [
    { to: "/cadre", label: t("home"), icon: LayoutDashboard, exact: true },
    { to: "/cadre/submit", label: t("submit_today"), icon: ClipboardList },
    { to: "/cadre/history", label: t("my_history"), icon: ClipboardCheck },
    { to: "/cadre/leave", label: t("leave_requests"), icon: CalendarCheck },
    { to: "/cadre/profile", label: t("profile"), icon: UserIcon },
    { to: "/cadre/notifications", label: t("notifications_sidebar"), icon: Bell },
    { to: "/cadre/help", label: t("help_support"), icon: HelpCircle },
  ];

  const items = isStaff ? staffItems : cadreItems;

  const isActive = (to: string, exact?: boolean) =>
    exact ? currentPath === to : currentPath === to || currentPath.startsWith(to + "/");

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 [&_[data-sidebar=sidebar]]:bg-sidebar [&_[data-sidebar=sidebar]]:text-sidebar-foreground"
    >
      <SidebarHeader className="border-b border-sidebar-border/20 p-3">
        <Link to={homeRoute} className="flex items-center gap-3">
          <NrlmLogo />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-lg font-bold text-white tracking-wide">NRLM</div>
              <div className="truncate text-[10px] text-white/75 font-medium">National Rural</div>
              <div className="truncate text-[10px] text-white/75 font-medium">
                Livelihoods Mission
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {!isStaff && (
          <SidebarGroup className="mb-4">
            {!collapsed && (
              <SidebarGroupLabel className="text-white/50 text-[11px] font-semibold tracking-wider uppercase mb-1">
                {t("quick_actions")}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={t("submit_today")}
                    className={cn(
                      "h-11 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-colors",
                      "data-[active=true]:ring-1 data-[active=true]:ring-emerald-400",
                    )}
                  >
                    <Link to="/cadre/submit" className="flex items-center gap-3">
                      <Plus className="h-[18px] w-[18px] shrink-0" />
                      <span className="font-medium">{t("submit_today")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          {!collapsed && isStaff && (
            <SidebarGroupLabel className="text-white/40 text-[11px] font-semibold tracking-wider uppercase mb-2 px-2">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const active = isActive(item.to, item.exact);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        "h-11 rounded-lg transition-all duration-200",
                        "text-white/70 hover:bg-sidebar-accent hover:text-white",
                        "data-[active=true]:bg-sidebar-primary data-[active=true]:text-white data-[active=true]:font-semibold data-[active=true]:shadow-md data-[active=true]:translate-x-0.5",
                      )}
                    >
                      <Link to={item.to} className="flex items-center gap-3.5 px-3">
                        <item.icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-colors",
                            active ? "text-white" : "text-white/70 group-hover:text-white",
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/20 p-3 space-y-2">
        {/* ── Language Toggle Button ────────────────────────────── */}
        <button
          type="button"
          onClick={toggleLang}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
            "bg-sidebar-accent/20 hover:bg-sidebar-accent/40 transition-colors",
            "text-white/80 hover:text-white focus:outline-none",
          )}
          title={lang === "en" ? "हिंदी में बदलें" : "Switch to English"}
        >
          <Languages className="h-5 w-5 shrink-0 text-white/70" />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-wide">
              {lang === "en" ? "हिंदी" : "English"}
            </span>
          )}
        </button>

        {/* ── User / Logout Dropdown ────────────────────────────── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-sidebar-accent/50 focus:outline-none",
                !collapsed && "bg-sidebar-accent/30",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold border-2 border-white/20">
                {(profile?.full_name?.[0] ?? "A").toUpperCase()}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1 leading-normal">
                  <div className="truncate text-sm font-semibold text-white">
                    {profile?.full_name ?? "Admin User"}
                  </div>
                  <div className="truncate text-xs text-white/60 font-medium">
                    {role ? t(`role.${role}`) : "District Admin"}
                  </div>
                </div>
              )}
              {!collapsed && <ChevronDown className="h-4 w-4 shrink-0 text-white/50" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl bg-card border-border shadow-lg p-1.5"
          >
            <div className="px-2.5 py-2">
              <p className="text-xs text-muted-foreground font-medium">Signed in as</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {profile?.full_name ?? "Admin User"}
              </p>
            </div>
            <div className="h-px bg-muted my-1" />
            <DropdownMenuItem
              onClick={() => void signOut()}
              className="flex items-center gap-2 px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
