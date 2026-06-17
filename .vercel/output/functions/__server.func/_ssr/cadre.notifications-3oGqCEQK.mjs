import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { a as useProfile } from "./use-auth-DM5yQtMG.mjs";
import { u as useT } from "./router-yzFmt3hU.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { ag as ArrowLeft, k as Check, B as Bell, aj as BellOff, Z as Trash2, w as Clock, u as CircleX, o as CircleCheck } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
function NotificationsPage() {
  const {
    data: profile
  } = useProfile();
  const {
    t
  } = useT();
  const qc = useQueryClient();
  const [filter, setFilter] = reactExports.useState("all");
  const [busy, setBusy] = reactExports.useState(false);
  const {
    data: notifications = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["my-notifications-all", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });
  const markAsRead = async (id) => {
    try {
      const {
        error
      } = await supabase.from("notifications").update({
        read: true
      }).eq("id", id);
      if (error) throw error;
      qc.invalidateQueries({
        queryKey: ["my-notifications-all"]
      });
      qc.invalidateQueries({
        queryKey: ["my-notifications-raw"]
      });
      toast.success(t("notif_marked_read"));
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };
  const markAllAsRead = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      const {
        error
      } = await supabase.from("notifications").update({
        read: true
      }).eq("user_id", profile.id).eq("read", false);
      if (error) throw error;
      qc.invalidateQueries({
        queryKey: ["my-notifications-all"]
      });
      qc.invalidateQueries({
        queryKey: ["my-notifications-raw"]
      });
      toast.success(t("notif_all_marked_read"));
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };
  const deleteNotification = async (id) => {
    try {
      const {
        error
      } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
      qc.invalidateQueries({
        queryKey: ["my-notifications-all"]
      });
      qc.invalidateQueries({
        queryKey: ["my-notifications-raw"]
      });
      toast.success(t("notif_deleted"));
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };
  const getNotifStyles = (type) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-50/70 border-emerald-100",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5 text-emerald-600 shrink-0" })
        };
      case "error":
        return {
          bg: "bg-rose-50/70 border-rose-100",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-5 w-5 text-rose-600 shrink-0" })
        };
      case "warning":
        return {
          bg: "bg-amber-50/70 border-amber-100",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-amber-600 shrink-0" })
        };
      default:
        return {
          bg: "bg-blue-50/70 border-blue-100",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-5 w-5 text-blue-600 shrink-0" })
        };
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 max-w-4xl mx-auto pb-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cadre", className: "inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
        t("back_to_home")
      ] }),
      notifications.some((n) => !n.read) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: markAllAsRead, disabled: busy, variant: "outline", size: "sm", className: "h-8 rounded-lg text-xs font-bold border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100/50 flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5" }),
        t("mark_all_read")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl font-black text-slate-800 tracking-tight flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-6 w-6 text-[#0055A4]" }),
        t("notifications_hub")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: "View attendance updates, activity approvals, and system announcements" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm gap-1 text-xs w-max", children: ["all", "unread", "read"].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setFilter(tab), className: cn("rounded-lg px-4 py-2 font-bold transition-all capitalize", filter === tab ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50/50"), children: [
      tab === "all" && `${t("all_tab")} (${notifications.length})`,
      tab === "unread" && `${t("unread")} (${notifications.filter((n) => !n.read).length})`,
      tab === "read" && `${t("read_tab")} (${notifications.filter((n) => n.read).length})`
    ] }, tab)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-12 text-slate-400 font-bold animate-pulse", children: t("loading") }),
      !isLoading && filteredNotifications.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-400 font-semibold shadow-sm flex flex-col items-center justify-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BellOff, { className: "h-8 w-8 text-slate-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("no_notifications") })
      ] }),
      !isLoading && filteredNotifications.map((n) => {
        const styles = getNotifStyles(n.type);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("flex items-start justify-between gap-4 p-4 border rounded-2xl shadow-sm transition-all text-xs font-bold leading-normal", styles.bg, n.read ? "opacity-75" : "border-l-4 border-l-blue-500"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            styles.icon,
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: cn("font-black text-slate-800", !n.read && "text-blue-950"), children: n.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-medium leading-relaxed", children: n.message }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-1", children: new Date(n.created_at).toLocaleString() })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
            !n.read && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => markAsRead(n.id), className: "text-[10px] font-black text-blue-600 hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm", children: "Mark as Read" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => deleteNotification(n.id), className: "p-1.5 text-slate-400 hover:text-rose-600 bg-white rounded-lg border border-slate-100 shadow-sm transition-colors", title: "Delete", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] })
        ] }, n.id);
      })
    ] })
  ] });
}
export {
  NotificationsPage as component
};
