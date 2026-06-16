import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { signInWithIdPin, useSession } from "@/hooks/use-auth";
import { ensureAdminSeeded } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Languages } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login · NRLM Cadre Tracker" },
      { name: "description", content: "Sign in with your User ID and 4-digit PIN." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang, setLang } = useT();
  const navigate = useNavigate();
  const { userId: sessionUid, ready } = useSession();
  const seed = useServerFn(ensureAdminSeeded);

  // Track whether seeding has been attempted this session so we don't
  // fire it on every render. We do NOT call it on mount — only on the
  // first login attempt, and only once.
  const seedAttempted = useRef(false);

  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && sessionUid) navigate({ to: "/home", replace: true });
  }, [ready, sessionUid, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim() || !/^[0-9]{4}$/.test(pin)) {
      toast.error(t("invalid_credentials"));
      return;
    }
    setBusy(true);
    try {
      // Attempt seeding once before the first login. If the service role key
      // is absent, ensureAdminSeeded returns { seeded: false, reason: "no_service_key" }
      // without throwing, so this is safe even without the key configured.
      if (!seedAttempted.current) {
        seedAttempted.current = true;
        const result = await seed();
        if (result?.seeded) {
          toast.info("Default admin account initialised. Login with user 'admin', PIN 1234.");
        }
      }

      await signInWithIdPin(userId, pin);

      // Resolve the user's role immediately after sign-in so we can navigate
      // directly to the correct section — no intermediate /home dispatcher hop.
      let destination = "/home"; // fallback
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roleRows } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);
          const roles = (roleRows ?? []).map((r) => r.role as string);
          if (roles.includes("admin") || roles.includes("block_officer")) {
            destination = "/dashboard";
          } else if (roles.includes("cadre")) {
            destination = "/cadre";
          }
        }
      } catch {
        // Role lookup failed — fall through to /home dispatcher as backup
      }

      navigate({ to: destination, replace: true });
    } catch {
      toast.error(t("invalid_credentials"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "var(--gradient-header)" }}
    >
      <button
        type="button"
        onClick={() => setLang(lang === "en" ? "hi" : "en")}
        className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-md bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25"
      >
        <Languages className="h-4 w-4" />
        {t("switch_lang")}
      </button>

      <div className="mb-6 text-center text-primary-foreground">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white text-primary text-2xl font-bold shadow-lg">
          N
        </div>
        <h1 className="text-xl font-bold sm:text-2xl">{t("app_title")}</h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-card p-6 text-card-foreground"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <h2 className="mb-4 text-lg font-semibold">{t("login")}</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="uid">{t("user_id")}</Label>
            <Input
              id="uid"
              autoComplete="username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>
          <div>
            <Label htmlFor="pin">{t("pin")}</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="h-12 text-base tracking-[0.5em] text-center"
              required
            />
          </div>
          <Button type="submit" disabled={busy} className="h-12 w-full text-base">
            {busy ? t("signing_in") : t("sign_in")}
          </Button>
        </div>
      </form>
    </div>
  );
}
