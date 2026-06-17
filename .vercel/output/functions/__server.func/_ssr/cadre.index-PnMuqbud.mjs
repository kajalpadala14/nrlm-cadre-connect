import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useT } from "./router-yzFmt3hU.mjs";
import { a as useProfile } from "./use-auth-DM5yQtMG.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import "../_libs/sonner.mjs";
import { o as CircleCheck, u as CircleX, w as Clock, v as CalendarDays, T as TriangleAlert, c as ClipboardList, F as History, U as User, e as CircleQuestionMark, J as Activity, M as MapPin, b as Users, K as Camera, N as TrendingUp, O as ImageOff, A as ArrowRight, d as ChartNoAxesColumn, Q as BadgeCheck, H as Hourglass, R as ThumbsDown, V as FileExclamationPoint, W as RotateCcw, B as Bell } from "../_libs/lucide-react.mjs";
import { R as ResponsiveContainer, B as BarChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, a as Bar } from "../_libs/recharts.mjs";
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
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/lodash.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/react-is.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/react-smooth.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/recharts-scale.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
function getDateStrings() {
  const d = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const todayStr = `${year}-${pad(month)}-${pad(day)}`;
  const firstDayStr = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const lastDayStr = `${year}-${pad(month)}-${pad(lastDay)}`;
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(d);
    dt.setDate(d.getDate() - i);
    last7.push(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`);
  }
  const elapsedDays = day;
  return {
    todayStr,
    firstDayStr,
    lastDayStr,
    last7,
    elapsedDays
  };
}
function StatTile({
  label,
  value,
  color,
  icon,
  sub
}) {
  const styles = {
    blue: "bg-blue-50   text-blue-700   border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50  text-amber-700  border-amber-100",
    rose: "bg-rose-50   text-rose-700   border-rose-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    teal: "bg-teal-50   text-teal-700   border-teal-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("rounded-2xl border p-4 flex flex-col gap-2 shadow-sm", styles[color]), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black uppercase tracking-wider opacity-70 leading-tight", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "opacity-50 shrink-0", children: icon })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-slate-800 leading-none", children: value }),
    sub && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-slate-400 font-semibold uppercase", children: sub })
  ] });
}
function SectionHeading({
  title,
  icon
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border-b border-slate-100 pb-2", children: [
    icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[11px] font-black text-slate-500 uppercase tracking-widest", children: title })
  ] });
}
function SkeletonTile() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-100 bg-slate-50 h-24 animate-pulse" });
}
function CadreDashboard() {
  const {
    t,
    lang
  } = useT();
  const {
    data: profile
  } = useProfile();
  const {
    todayStr,
    firstDayStr,
    lastDayStr,
    last7,
    elapsedDays
  } = getDateStrings();
  const {
    data: todayAttendance,
    isLoading: loadingTodayAtt
  } = useQuery({
    queryKey: ["cadre-today-attendance", profile?.id, todayStr],
    enabled: !!profile,
    staleTime: 3e4,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("attendance").select("id, status, remarks").eq("cadre_id", profile.id).eq("date", todayStr).maybeSingle();
      if (error) throw error;
      return data;
    }
  });
  const {
    data: todayActivities = [],
    isLoading: loadingToday
  } = useQuery({
    queryKey: ["cadre-today-activities", profile?.id, todayStr],
    enabled: !!profile,
    staleTime: 3e4,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("activities").select("id, village_name, beneficiaries, status, photo_url, activity_type, activity_date, submitted_at").eq("cadre_id", profile.id).eq("activity_date", todayStr).order("submitted_at", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  const {
    data: monthActivities = [],
    isLoading: loadingMonth
  } = useQuery({
    queryKey: ["cadre-month-activities", profile?.id, firstDayStr, lastDayStr],
    enabled: !!profile,
    staleTime: 3e4,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("activities").select("id, village_name, beneficiaries, status, photo_url, activity_type, activity_date, submitted_at").eq("cadre_id", profile.id).gte("activity_date", firstDayStr).lte("activity_date", lastDayStr).order("submitted_at", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  const {
    data: monthAttendance = [],
    isLoading: loadingMonthAtt
  } = useQuery({
    queryKey: ["cadre-month-attendance", profile?.id, firstDayStr, lastDayStr],
    enabled: !!profile,
    staleTime: 3e4,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("attendance").select("status, date").eq("cadre_id", profile.id).gte("date", firstDayStr).lte("date", lastDayStr).order("date", {
        ascending: true
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  const {
    data: recentActivities = [],
    isLoading: loadingRecent
  } = useQuery({
    queryKey: ["cadre-recent-5", profile?.id],
    enabled: !!profile,
    staleTime: 3e4,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("activities").select("id, village_name, beneficiaries, status, photo_url, activity_type, activity_date, submitted_at").eq("cadre_id", profile.id).order("submitted_at", {
        ascending: false
      }).limit(5);
      if (error) throw error;
      return data ?? [];
    }
  });
  const {
    data: last7Activities = [],
    isLoading: loadingTrend
  } = useQuery({
    queryKey: ["cadre-last7-trend", profile?.id, last7[0], last7[6]],
    enabled: !!profile,
    staleTime: 6e4,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("activities").select("activity_date").eq("cadre_id", profile.id).gte("activity_date", last7[0]).lte("activity_date", last7[6]);
      if (error) throw error;
      return data ?? [];
    }
  });
  const {
    data: notifications = [],
    refetch: refetchNotifications
  } = useQuery({
    queryKey: ["cadre-notifications", profile?.id],
    enabled: !!profile,
    staleTime: 3e4,
    queryFn: async () => {
      try {
        const {
          data,
          error
        } = await supabase.from("notifications").select("id, title, message, type, created_at, read").eq("user_id", profile.id).order("created_at", {
          ascending: false
        }).limit(10);
        if (error) return [];
        return (data ?? []).filter((n) => !n.read);
      } catch {
        return [];
      }
    }
  });
  const absentDaysThisMonth = reactExports.useMemo(() => monthAttendance.filter((a) => a.status === "absent").length, [monthAttendance]);
  const todaySummary = reactExports.useMemo(() => ({
    activities: todayActivities.length,
    villages: new Set(todayActivities.map((a) => a.village_name)).size,
    beneficiaries: todayActivities.reduce((s, a) => s + (a.beneficiaries ?? 0), 0),
    withPhoto: todayActivities.filter((a) => !!a.photo_url).length
  }), [todayActivities]);
  const monthlySummary = reactExports.useMemo(() => {
    const totalActs = monthActivities.length;
    const villages = new Set(monthActivities.map((a) => a.village_name)).size;
    const beneficiaries = monthActivities.reduce((s, a) => s + (a.beneficiaries ?? 0), 0);
    const approved = monthActivities.filter((a) => a.status === "Approved").length;
    const pending = monthActivities.filter((a) => a.status === "Pending").length;
    const rejected = monthActivities.filter((a) => a.status === "Rejected").length;
    const presentDays = monthAttendance.filter((a) => a.status === "present").length;
    const attendancePct = elapsedDays > 0 ? (presentDays / elapsedDays * 100).toFixed(1) : "0.0";
    const approvedPct = totalActs > 0 ? (approved / totalActs * 100).toFixed(0) : "0";
    const pendingPct = totalActs > 0 ? (pending / totalActs * 100).toFixed(0) : "0";
    const rejectedPct = totalActs > 0 ? (rejected / totalActs * 100).toFixed(0) : "0";
    return {
      totalActs,
      villages,
      beneficiaries,
      approved,
      pending,
      rejected,
      attendancePct,
      approvedPct,
      pendingPct,
      rejectedPct,
      presentDays
    };
  }, [monthActivities, monthAttendance, elapsedDays]);
  const pendingActions = reactExports.useMemo(() => ({
    missingPhoto: monthActivities.filter((a) => !a.photo_url).length,
    absentDays: absentDaysThisMonth,
    rejectedActs: monthActivities.filter((a) => a.status === "Rejected").length
  }), [monthActivities, absentDaysThisMonth]);
  const hasPendingActions = pendingActions.missingPhoto > 0 || pendingActions.absentDays > 0 || pendingActions.rejectedActs > 0;
  const trendData = reactExports.useMemo(() => {
    const countMap = {};
    last7.forEach((d) => countMap[d] = 0);
    last7Activities.forEach((a) => {
      if (countMap[a.activity_date] !== void 0) countMap[a.activity_date]++;
    });
    return last7.map((d) => ({
      date: d.slice(5),
      count: countMap[d]
    }));
  }, [last7Activities, last7]);
  const markAsRead = async (id) => {
    try {
      await supabase.from("notifications").update({
        read: true
      }).eq("id", id);
      refetchNotifications();
    } catch {
    }
  };
  const typeLabel = (type) => t(`act.${type}`) !== `act.${type}` ? t(`act.${type}`) : type.replace(/_/g, " ");
  const notifIcon = (type) => {
    if (type?.includes("approved") || type?.includes("Approved")) return "✅";
    if (type?.includes("rejected") || type?.includes("Rejected")) return "❌";
    if (type?.includes("attendance")) return "📋";
    return "🔔";
  };
  const isLoading = loadingToday || loadingMonth || loadingTodayAtt;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-7 max-w-5xl mx-auto pb-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xl shadow-md overflow-hidden", children: profile?.profile_photo_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: profile.profile_photo_url, alt: "avatar", className: "h-full w-full object-cover" }) : profile?.full_name?.[0]?.toUpperCase() ?? "C" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider", children: t("welcome") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-black text-slate-800 tracking-tight mt-0.5 truncate", children: profile?.full_name }),
        profile?.cadre_type && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wide", children: [
          t(`ct.${profile.cadre_type}`),
          " · ",
          profile?.user_id
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto shrink-0", children: loadingTodayAtt ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-7 w-24 rounded-full bg-slate-100 animate-pulse" }) : todayAttendance?.status === "present" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-wide", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
        " Present"
      ] }) : todayAttendance?.status === "absent" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1.5 text-[10px] font-black text-rose-700 uppercase tracking-wide", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5" }),
        " Absent"
      ] }) : todayAttendance?.status === "on_leave" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-[10px] font-black text-blue-700 uppercase tracking-wide", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5" }),
        " On Leave"
      ] }) : todayAttendance?.status === "holiday" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1.5 text-[10px] font-black text-purple-700 uppercase tracking-wide", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-3.5 w-3.5" }),
        " Holiday"
      ] }) : todayAttendance?.status === "pending_verification" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-[10px] font-black text-amber-700 uppercase tracking-wide", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5" }),
        " Pending"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wide", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5" }),
        " Not Marked"
      ] }) })
    ] }),
    todayAttendance?.status === "absent" && todayAttendance.remarks && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-bold text-slate-700 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-5 w-5 text-rose-600 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-rose-900 font-extrabold", children: t("marked_absent") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600 mt-1", children: todayAttendance.remarks })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 grid-cols-2 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BigButton, { to: "/cadre/submit", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "h-6 w-6 text-white" }), label: t("submit_work"), subLabel: t("submit_work"), tone: "primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BigButton, { to: "/cadre/history", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-6 w-6 text-white" }), label: t("work_history"), subLabel: t("work_history"), tone: "secondary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BigButton, { to: "/cadre/profile", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-6 w-6 text-white" }), label: t("profile_settings"), subLabel: t("profile_settings"), tone: "accent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BigButton, { to: "/cadre/help?raise=true", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleQuestionMark, { className: "h-6 w-6 text-white" }), label: t("raise_support"), subLabel: t("raise_support"), tone: "help" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeading, { title: `${t("today_summary")} — ${todayStr}`, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-4 w-4" }) }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [...Array(4)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonTile, {}, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatTile, { label: t("today_activities"), value: todaySummary.activities, color: "blue", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-4 w-4" }), sub: "गतिविधियाँ" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatTile, { label: t("today_villages"), value: todaySummary.villages, color: "teal", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }), sub: "गाँव कवर" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatTile, { label: t("today_beneficiaries"), value: todaySummary.beneficiaries, color: "purple", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }), sub: "लाभार्थी" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatTile, { label: t("today_photos"), value: todaySummary.withPhoto, color: "orange", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-4 w-4" }), sub: "फ़ोटो साक्ष्य" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeading, { title: t("monthly_summary"), icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-4 w-4" }) }),
      loadingMonth || loadingMonthAtt ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [...Array(4)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonTile, {}, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatTile, { label: t("monthly_total"), value: monthlySummary.totalActs, color: "blue", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "h-4 w-4" }), sub: "कुल गतिविधियाँ" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatTile, { label: t("monthly_villages"), value: monthlySummary.villages, color: "teal", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }), sub: "अनोखे गाँव" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatTile, { label: t("monthly_beneficiaries"), value: monthlySummary.beneficiaries, color: "purple", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }), sub: "कुल लाभार्थी" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatTile, { label: t("attendance_pct"), value: `${monthlySummary.attendancePct}%`, color: "emerald", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }), sub: `${monthlySummary.presentDays} / ${elapsedDays} days` })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeading, { title: t("recent_activities_heading"), icon: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden", children: [
          loadingRecent ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 space-y-3", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 rounded-xl bg-slate-50 animate-pulse" }, i)) }) : recentActivities.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-10 text-center text-slate-400 text-xs font-semibold", children: t("no_activities_found") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-slate-50", children: recentActivities.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3.5 hover:bg-slate-50/50 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-14 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100", children: a.photo_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: a.photo_url, alt: "evidence", className: "h-full w-full object-cover", onError: (e) => {
              e.target.style.display = "none";
            } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ImageOff, { className: "h-4 w-4 text-slate-300" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black text-slate-800 truncate", children: typeLabel(a.activity_type) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3 shrink-0" }),
                a.village_name,
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mx-1", children: "·" }),
                a.activity_date
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-slate-400 font-semibold mt-0.5", children: [
                "👥 ",
                a.beneficiaries ?? 0,
                " beneficiaries"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide shrink-0", a.status === "Pending" && "bg-amber-50 text-amber-700", a.status === "Approved" && "bg-emerald-50 text-emerald-700", a.status === "Rejected" && "bg-rose-50 text-rose-700", !a.status && "bg-slate-50 text-slate-400"), children: a.status ?? "—" })
          ] }, a.id)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-slate-50 px-4 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cadre/history", className: "inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider", children: [
            t("view_full_history"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeading, { title: t("quick_stats"), icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartNoAxesColumn, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [{
          label: "Approved",
          value: monthlySummary.approved,
          pct: monthlySummary.approvedPct,
          color: "emerald",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BadgeCheck, { className: "h-6 w-6 text-emerald-600" }),
          sub: "स्वीकृत",
          barColor: "bg-emerald-400",
          border: "border-emerald-100"
        }, {
          label: "Pending",
          value: monthlySummary.pending,
          pct: monthlySummary.pendingPct,
          color: "amber",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Hourglass, { className: "h-6 w-6 text-amber-600" }),
          sub: "लंबित",
          barColor: "bg-amber-400",
          border: "border-amber-100"
        }, {
          label: "Rejected",
          value: monthlySummary.rejected,
          pct: monthlySummary.rejectedPct,
          color: "rose",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbsDown, { className: "h-6 w-6 text-rose-600" }),
          sub: "अस्वीकृत",
          barColor: "bg-rose-400",
          border: "border-rose-100"
        }].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("bg-white border rounded-2xl p-4 shadow-sm", s.border), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cn("text-[10px] font-black uppercase tracking-wide", `text-${s.color}-600`), children: s.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-slate-800 mt-0.5", children: s.value }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] text-slate-400 font-semibold mt-1", children: [
                s.sub,
                " · ",
                s.pct,
                "% of total"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("h-11 w-11 flex items-center justify-center rounded-xl", `bg-${s.color}-50`), children: s.icon })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-3 h-1.5 rounded-full overflow-hidden", `bg-${s.color}-50`), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("h-full rounded-full transition-all", s.barColor), style: {
            width: `${s.pct}%`
          } }) })
        ] }, s.label)) })
      ] })
    ] }),
    hasPendingActions && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeading, { title: t("pending_actions"), icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [
        pendingActions.missingPhoto > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cadre/history", className: "bg-white border border-orange-100 hover:border-orange-300 rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-all hover:shadow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-orange-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-5 w-5 text-orange-500" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black text-slate-800", children: t("missing_photo") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold mt-0.5", children: t("missing_photo") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-block mt-2 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5", children: [
              pendingActions.missingPhoto,
              " activities"
            ] })
          ] })
        ] }),
        pendingActions.absentDays > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cadre/history", className: "bg-white border border-rose-100 hover:border-rose-300 rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-all hover:shadow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-rose-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileExclamationPoint, { className: "h-5 w-5 text-rose-500" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black text-slate-800", children: t("absent_days") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold mt-0.5", children: t("absent_days") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-block mt-2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5", children: [
              pendingActions.absentDays,
              " days"
            ] })
          ] })
        ] }),
        pendingActions.rejectedActs > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cadre/history", className: "bg-white border border-amber-100 hover:border-amber-300 rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-all hover:shadow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-amber-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-5 w-5 text-amber-500" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black text-slate-800", children: t("rejected_acts") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold mt-0.5", children: "अस्वीकृत गतिविधियाँ देखें" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-block mt-2 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5", children: [
              pendingActions.rejectedActs,
              " activities"
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeading, { title: t("activity_trend"), icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-100 rounded-2xl p-5 shadow-sm", children: [
        loadingTrend ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-44", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 w-full rounded-xl bg-slate-50 animate-pulse" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: 160, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: trendData, margin: {
          top: 4,
          right: 4,
          left: -20,
          bottom: 0
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9", vertical: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "date", tick: {
            fontSize: 10,
            fontWeight: 700,
            fill: "#94a3b8"
          }, axisLine: false, tickLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tick: {
            fontSize: 10,
            fontWeight: 700,
            fill: "#94a3b8"
          }, axisLine: false, tickLine: false, allowDecimals: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 10,
            border: "1px solid #e2e8f0"
          }, formatter: (val) => [val, "Activities"], labelFormatter: (l) => `Date: ${l}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "count", fill: "#0055A4", radius: [6, 6, 0, 0], maxBarSize: 40 })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-slate-400 font-semibold uppercase mt-2 text-right", children: [
          "Real data · ",
          last7[0],
          " to ",
          last7[6]
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-50 pb-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4 text-slate-400" }),
          t("notifications_panel"),
          notifications.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5", children: notifications.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/cadre/notifications", className: "text-[10px] text-blue-600 hover:underline font-bold", children: t("notifications_view_all") })
      ] }),
      notifications.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2.5 max-h-64 overflow-y-auto pr-1", children: notifications.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => markAsRead(n.id), className: "flex items-start justify-between gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 rounded-xl cursor-pointer transition-colors text-xs font-bold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: notifIcon(n.type ?? "") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-black text-slate-800 truncate", children: n.title })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-medium leading-relaxed pl-6", children: n.message }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-slate-400 uppercase mt-1 pl-6", children: new Date(n.created_at).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "text-[10px] font-black text-blue-600 uppercase hover:text-blue-700 shrink-0 mt-0.5", children: t("mark_as_read") })
      ] }, n.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-6 text-slate-400 text-xs font-semibold", children: t("no_notifications") })
    ] })
  ] });
}
function BigButton({
  to,
  icon,
  label,
  subLabel,
  tone
}) {
  const map = {
    primary: "from-[#0055A4] to-[#003B72] hover:shadow-blue-200/50",
    secondary: "from-[#FF9800] to-[#E65100] hover:shadow-orange-200/50",
    accent: "from-[#4CAF50] to-[#2E7D32] hover:shadow-emerald-200/50",
    help: "from-slate-700 to-slate-900 hover:shadow-slate-200/50"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to, className: cn("flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center", "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]", "bg-gradient-to-br text-white border border-white/5", map[tone]), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-white/10 rounded-xl shadow-inner border border-white/10", children: icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black tracking-wide leading-none", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-white/70 font-semibold uppercase mt-1 tracking-wider", children: subLabel })
    ] })
  ] });
}
export {
  CadreDashboard as component
};
