import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Languages, LogOut } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useSignOut, useProfile, highestRole } from "@/hooks/use-auth";

export function AppHeader() {
  const { t, lang, setLang } = useT();
  const signOut = useSignOut();
  const { data: profile } = useProfile();
  const role = highestRole(profile?.roles ?? []);

  return (
    <header
      className="sticky top-0 z-30 border-b border-sidebar-border text-sidebar-foreground"
      style={{ background: "var(--gradient-header)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-6">
        <Link to="/home" className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            N
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold sm:text-base">{t("app_title")}</h1>
            {profile && (
              <p className="truncate text-xs text-sidebar-foreground/75">
                {profile.full_name}
                {role ? ` · ${t(`role.${role}`)}` : ""}
              </p>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Languages className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">{t("switch_lang")}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void signOut()}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">{t("logout")}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
