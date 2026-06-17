import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, u as useRouter } from "../_libs/tanstack__react-router.mjs";
import { m as isRedirect } from "../_libs/tanstack__router-core.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as useT } from "./router-yzFmt3hU.mjs";
import { u as useSession, s as signInWithIdPin } from "./use-auth-DM5yQtMG.mjs";
import { e as ensureAdminSeeded } from "./admin.functions-C2VKdbp7.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import "../_libs/seroval.mjs";
import { L as Languages } from "../_libs/lucide-react.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./server-CDQQ5dZa.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-CffMsDA6.mjs";
import "../_libs/zod.mjs";
function useServerFn(serverFn) {
  const router = useRouter();
  return reactExports.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router.stores.location.get();
        return router.navigate(router.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router, serverFn]);
}
function AuthPage() {
  const {
    t,
    lang,
    setLang
  } = useT();
  const navigate = useNavigate();
  const {
    userId: sessionUid,
    ready
  } = useSession();
  const seed = useServerFn(ensureAdminSeeded);
  const seedAttempted = reactExports.useRef(false);
  const [userId, setUserId] = reactExports.useState("");
  const [pin, setPin] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (ready && sessionUid) navigate({
      to: "/home",
      replace: true
    });
  }, [ready, sessionUid, navigate]);
  async function onSubmit(e) {
    e.preventDefault();
    if (!userId.trim() || !/^[0-9]{4}$/.test(pin)) {
      toast.error(t("invalid_credentials"));
      return;
    }
    setBusy(true);
    try {
      if (!seedAttempted.current) {
        seedAttempted.current = true;
        const result = await seed();
        if (result?.seeded) {
          toast.info("Default admin account initialised. Login with user 'admin', PIN 1234.");
        }
      }
      await signInWithIdPin(userId, pin);
      let destination = "/home";
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) {
          const {
            data: roleRows
          } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
          const roles = (roleRows ?? []).map((r) => r.role);
          if (roles.includes("admin") || roles.includes("block_officer")) {
            destination = "/dashboard";
          } else if (roles.includes("cadre")) {
            destination = "/cadre";
          }
        }
      } catch {
      }
      navigate({
        to: destination,
        replace: true
      });
    } catch {
      toast.error(t("invalid_credentials"));
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center px-4 py-8", style: {
    background: "var(--gradient-header)"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setLang(lang === "en" ? "hi" : "en"), className: "absolute right-4 top-4 inline-flex items-center gap-1 rounded-md bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Languages, { className: "h-4 w-4" }),
      t("switch_lang")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 text-center text-primary-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white text-primary text-2xl font-bold shadow-lg", children: "N" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold sm:text-2xl", children: t("app_title") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit, className: "w-full max-w-sm rounded-2xl bg-card p-6 text-card-foreground", style: {
      boxShadow: "var(--shadow-elevated)"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-4 text-lg font-semibold", children: t("login") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "uid", children: t("user_id") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "uid", autoComplete: "username", value: userId, onChange: (e) => setUserId(e.target.value), className: "h-12 text-base", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pin", children: t("pin") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pin", type: "password", inputMode: "numeric", pattern: "[0-9]*", maxLength: 4, autoComplete: "current-password", value: pin, onChange: (e) => setPin(e.target.value.replace(/\D/g, "")), className: "h-12 text-base tracking-[0.5em] text-center", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "h-12 w-full text-base", children: busy ? t("signing_in") : t("sign_in") })
      ] })
    ] })
  ] });
}
export {
  AuthPage as component
};
