import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { a as useProfile, u as useSession, h as highestRole } from "./use-auth-DM5yQtMG.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./client-UF72EdR8.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function HomeDispatcher() {
  const navigate = useNavigate();
  const {
    data: profile,
    isLoading,
    isError
  } = useProfile();
  const {
    ready
  } = useSession();
  const fallbackFired = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (!isLoading && profile) {
      const role = highestRole(profile.roles);
      if (role === "cadre") {
        navigate({
          to: "/cadre",
          replace: true
        });
      } else {
        navigate({
          to: "/dashboard",
          replace: true
        });
      }
      return;
    }
    if (isError && !fallbackFired.current) {
      fallbackFired.current = true;
      navigate({
        to: "/auth",
        replace: true
      });
      return;
    }
    if (ready && !isLoading && !profile && !isError && !fallbackFired.current) {
      fallbackFired.current = true;
      navigate({
        to: "/auth",
        replace: true
      });
    }
  }, [isLoading, profile, isError, ready, navigate]);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      if (!fallbackFired.current) {
        fallbackFired.current = true;
        navigate({
          to: "/auth",
          replace: true
        });
      }
    }, 8e3);
    return () => clearTimeout(timer);
  }, [navigate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-[50vh] flex-col items-center justify-center gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading your dashboard…" })
  ] });
}
export {
  HomeDispatcher as component
};
