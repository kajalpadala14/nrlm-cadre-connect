import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { m as LogIn, A as ArrowRight, d as ChartNoAxesColumn, g as ChevronDown, b as Users, n as UserCheck, c as ClipboardList, M as MapPin, C as CalendarCheck, o as CircleCheck, G as Globe, p as Award, q as Leaf, r as Smartphone, s as Shield } from "../_libs/lucide-react.mjs";
import { R as ResponsiveContainer, B as BarChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, L as Legend, a as Bar, A as AreaChart, b as Area } from "../_libs/recharts.mjs";
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
function last30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}
function last7Labels() {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short"
    }));
  }
  return labels;
}
function Skeleton({
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("animate-pulse rounded-lg bg-slate-100", className) });
}
function StatCard({
  icon: Icon,
  label,
  labelHi,
  value,
  sub,
  color
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", color), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none", children: labelHi }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold text-slate-300 uppercase tracking-wide mt-0.5", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black text-slate-800 mt-2 tabular-nums", children: value }),
      sub && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold mt-1", children: sub })
    ] })
  ] }) });
}
function PublicIndex() {
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ["public-dashboard-stats"],
    queryFn: async () => {
      const {
        count: totalCadres
      } = await supabase.from("user_roles").select("user_id", {
        count: "exact",
        head: true
      }).eq("role", "cadre");
      const since = /* @__PURE__ */ new Date();
      since.setDate(since.getDate() - 30);
      const sinceStr = since.toISOString().slice(0, 10);
      const {
        data: activeRows
      } = await supabase.from("attendance").select("cadre_id").eq("status", "present").gte("date", sinceStr);
      const activeCadres = new Set((activeRows ?? []).map((r) => r.cadre_id)).size;
      const {
        count: totalActivities
      } = await supabase.from("activities").select("id", {
        count: "exact",
        head: true
      });
      const {
        data: villageRows
      } = await supabase.from("activities").select("village_name");
      const villagesCovered = new Set((villageRows ?? []).map((r) => r.village_name)).size;
      const {
        count: approvedActivities
      } = await supabase.from("activities").select("id", {
        count: "exact",
        head: true
      }).eq("status", "Approved");
      const {
        count: totalAttRecords
      } = await supabase.from("attendance").select("id", {
        count: "exact",
        head: true
      });
      const {
        count: presentRecords
      } = await supabase.from("attendance").select("id", {
        count: "exact",
        head: true
      }).eq("status", "present");
      const attendanceRate = totalAttRecords && totalAttRecords > 0 ? Math.round((presentRecords ?? 0) / totalAttRecords * 100) : 0;
      return {
        totalCadres: totalCadres ?? 0,
        activeCadres,
        totalActivities: totalActivities ?? 0,
        villagesCovered,
        approvedActivities: approvedActivities ?? 0,
        attendanceRate
      };
    },
    staleTime: 5 * 60 * 1e3
  });
  const {
    data: blockData,
    isLoading: blockLoading
  } = useQuery({
    queryKey: ["public-block-performance"],
    queryFn: async () => {
      const {
        data: blocks
      } = await supabase.from("blocks").select("id, name").order("name");
      const {
        data: activities
      } = await supabase.from("activities").select("block_id, status");
      const {
        data: cadreRoles
      } = await supabase.from("user_roles").select("user_id").eq("role", "cadre");
      const cadreIds = (cadreRoles ?? []).map((r) => r.user_id);
      let profiles = [];
      if (cadreIds.length > 0) {
        const {
          data
        } = await supabase.from("profiles").select("id, block_id").in("id", cadreIds);
        profiles = data ?? [];
      }
      return (blocks ?? []).map((b) => {
        const acts = (activities ?? []).filter((a) => a.block_id === b.id);
        const cadresInBlock = profiles.filter((p) => p.block_id === b.id).length;
        const approved = acts.filter((a) => a.status === "Approved").length;
        const pending = acts.filter((a) => a.status === "Pending").length;
        return {
          name: b.name.length > 10 ? b.name.slice(0, 10) + "…" : b.name,
          fullName: b.name,
          cadres: cadresInBlock,
          activities: acts.length,
          approved,
          pending
        };
      });
    },
    staleTime: 5 * 60 * 1e3
  });
  const {
    data: activityTrendData,
    isLoading: trendLoading
  } = useQuery({
    queryKey: ["public-activity-trend"],
    queryFn: async () => {
      const days = last30Days();
      const {
        data: acts
      } = await supabase.from("activities").select("activity_date, status").gte("activity_date", days[0]).lte("activity_date", days[days.length - 1]);
      const buckets = [];
      for (let i = 0; i < 6; i++) {
        const start = days[i * 5];
        const end = days[Math.min(i * 5 + 4, 29)];
        const label = new Date(start).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short"
        });
        const slice = (acts ?? []).filter((a) => a.activity_date >= start && a.activity_date <= end);
        buckets.push({
          label,
          total: slice.length,
          approved: slice.filter((a) => a.status === "Approved").length
        });
      }
      return buckets;
    },
    staleTime: 5 * 60 * 1e3
  });
  const {
    data: attendanceTrendData,
    isLoading: attTrendLoading
  } = useQuery({
    queryKey: ["public-attendance-trend"],
    queryFn: async () => {
      const days = last30Days().slice(-7);
      const labels = last7Labels();
      const {
        data: attRows
      } = await supabase.from("attendance").select("date, status").gte("date", days[0]);
      return days.map((day, i) => {
        const dayRows = (attRows ?? []).filter((r) => r.date === day);
        return {
          label: labels[i],
          present: dayRows.filter((r) => r.status === "present").length,
          absent: dayRows.filter((r) => r.status === "absent").length
        };
      });
    },
    staleTime: 5 * 60 * 1e3
  });
  const heroStats = [{
    value: statsLoading ? "—" : stats?.totalActivities ?? 0,
    label: "Activities Tracked"
  }, {
    value: statsLoading ? "—" : stats?.totalCadres ?? 0,
    label: "Cadres Deployed"
  }, {
    value: statsLoading ? "—" : stats?.villagesCovered ?? 0,
    label: "Villages Reached"
  }, {
    value: statsLoading ? "—" : `${stats?.attendanceRate ?? 0}%`,
    label: "Attendance Rate"
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-[#0055A4] text-white font-black text-sm shadow", children: "N" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black text-slate-800 tracking-tight", children: "NRLM Cadre Connect" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5", children: "Dantewada · Chhattisgarh" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" }),
          "Live"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/auth", className: "inline-flex items-center gap-2 rounded-xl bg-[#0055A4] px-4 py-2 text-xs font-black text-white shadow hover:bg-[#004494] transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "h-3.5 w-3.5" }),
          "Login to Dashboard"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,85,164,0.08),transparent)]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 pt-14 pb-12 sm:px-6 flex flex-col items-center text-center gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" }),
          "District Monitoring & Reporting Portal"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight max-w-3xl leading-tight", children: [
          "NRLM Cadre",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[#0055A4]", children: "Monitoring System" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm sm:text-base text-slate-500 font-semibold max-w-2xl leading-relaxed", children: "Real-time field activity tracking and attendance monitoring for PRP, FLCRP, RBK, IFC Anchor, and SR·CRP cadres across 4 blocks of Dantewada district — Dantewada, Geedam, Kuakonda, Katekalyan." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold -mt-1", children: "जिला दंतेवाड़ा — राष्ट्रीय ग्रामीण आजीविका मिशन · Chhattisgarh" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-3 mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/auth", className: "inline-flex items-center gap-2 rounded-xl bg-[#0055A4] px-6 py-3 text-sm font-black text-white shadow-md hover:bg-[#004494] transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "h-4 w-4" }),
            "Login to Dashboard",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#public-statistics", className: "inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChartNoAxesColumn, { className: "h-4 w-4 text-slate-500" }),
            "View Public Statistics",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 text-slate-400" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { id: "public-statistics", className: "mt-6 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3", children: heroStats.map(({
          value,
          label
        }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm p-4 shadow-sm text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-[#0055A4] tabular-nums", children: statsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-7 w-14 mx-auto" }) : value }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1", children: label })
        ] }, label)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-7xl px-4 pb-6 sm:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center sm:text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black text-slate-800", children: "NRLM Staff?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 font-semibold mt-0.5", children: "Block officers and cadres must log in to submit reports, approve activities, and track attendance." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/auth", className: "shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#0055A4] px-5 py-2.5 text-sm font-black text-white shadow hover:bg-[#004494] transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "h-4 w-4" }),
        "Login to Dashboard"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-7xl px-4 pb-10 sm:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-black text-slate-800 uppercase tracking-wide", children: "Live Statistics" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold text-slate-400", children: "— all-time programme data" })
      ] }),
      statsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6", children: Array.from({
        length: 6
      }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-32 rounded-2xl" }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Users, label: "Total Cadres", labelHi: "कुल कैडर", value: stats?.totalCadres ?? 0, sub: "Registered across all blocks", color: "bg-blue-50 text-blue-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: UserCheck, label: "Active Cadres", labelHi: "सक्रिय कैडर", value: stats?.activeCadres ?? 0, sub: "Present in last 30 days", color: "bg-emerald-50 text-emerald-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ClipboardList, label: "Total Activities", labelHi: "कुल गतिविधियाँ", value: stats?.totalActivities ?? 0, sub: "All time submissions", color: "bg-violet-50 text-violet-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: MapPin, label: "Villages Covered", labelHi: "गाँव कवरेज", value: stats?.villagesCovered ?? 0, sub: "Unique villages reached", color: "bg-orange-50 text-orange-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: CalendarCheck, label: "Attendance Rate", labelHi: "उपस्थिति दर", value: `${stats?.attendanceRate ?? 0}%`, sub: "Overall present rate", color: "bg-teal-50 text-teal-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: CircleCheck, label: "Approved Activities", labelHi: "स्वीकृत गतिविधियाँ", value: stats?.approvedActivities ?? 0, sub: "Verified by block officers", color: "bg-rose-50 text-rose-600" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-7xl px-4 pb-10 sm:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-black text-slate-800 uppercase tracking-wide", children: "Charts & Trends" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold text-slate-400", children: "— last 30 days" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black text-slate-800", children: "Block Performance" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5 mb-4", children: "ब्लॉक-वार गतिविधि / Activities per block" }),
          blockLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-52 w-full" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: 220, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: blockData ?? [], margin: {
            top: 4,
            right: 4,
            left: -20,
            bottom: 4
          }, barSize: 16, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", tick: {
              fontSize: 9,
              fontWeight: 700,
              fill: "#94a3b8"
            }, axisLine: false, tickLine: false }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tick: {
              fontSize: 9,
              fontWeight: 700,
              fill: "#94a3b8"
            }, axisLine: false, tickLine: false }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 8,
              border: "1px solid #e2e8f0"
            }, formatter: (value, name) => [value, name === "activities" ? "Total" : name === "approved" ? "Approved" : String(name)], labelFormatter: (label) => label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, { wrapperStyle: {
              fontSize: 9,
              fontWeight: 700
            }, formatter: (value) => value === "activities" ? "Total" : value === "approved" ? "Approved" : value }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "activities", fill: "#0055A4", radius: [4, 4, 0, 0] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "approved", fill: "#10b981", radius: [4, 4, 0, 0] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black text-slate-800", children: "Activity Trend" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5 mb-4", children: "गतिविधि ट्रेंड / Last 30 days" }),
          trendLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-52 w-full" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: 220, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: activityTrendData ?? [], margin: {
            top: 4,
            right: 4,
            left: -20,
            bottom: 4
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "pub-totalGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: "#0055A4", stopOpacity: 0.15 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: "#0055A4", stopOpacity: 0 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "pub-approvedGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: "#10b981", stopOpacity: 0.15 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: "#10b981", stopOpacity: 0 })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", tick: {
              fontSize: 9,
              fontWeight: 700,
              fill: "#94a3b8"
            }, axisLine: false, tickLine: false }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tick: {
              fontSize: 9,
              fontWeight: 700,
              fill: "#94a3b8"
            }, axisLine: false, tickLine: false }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 8,
              border: "1px solid #e2e8f0"
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, { wrapperStyle: {
              fontSize: 9,
              fontWeight: 700
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Area, { type: "monotone", dataKey: "total", stroke: "#0055A4", strokeWidth: 2, fill: "url(#pub-totalGrad)", name: "Total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Area, { type: "monotone", dataKey: "approved", stroke: "#10b981", strokeWidth: 2, fill: "url(#pub-approvedGrad)", name: "Approved" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black text-slate-800", children: "Attendance Trend" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5 mb-4", children: "उपस्थिति ट्रेंड / Last 7 days" }),
          attTrendLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-52 w-full" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: 220, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: attendanceTrendData ?? [], margin: {
            top: 4,
            right: 4,
            left: -20,
            bottom: 4
          }, barSize: 14, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", tick: {
              fontSize: 9,
              fontWeight: 700,
              fill: "#94a3b8"
            }, axisLine: false, tickLine: false }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tick: {
              fontSize: 9,
              fontWeight: 700,
              fill: "#94a3b8"
            }, axisLine: false, tickLine: false }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 8,
              border: "1px solid #e2e8f0"
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, { wrapperStyle: {
              fontSize: 9,
              fontWeight: 700
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "present", fill: "#10b981", radius: [4, 4, 0, 0], name: "Present" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "absent", fill: "#f43f5e", radius: [4, 4, 0, 0], name: "Absent" })
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-7xl px-4 pb-10 sm:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 mb-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-black text-slate-800 uppercase tracking-wide", children: "District Overview" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-4 w-4 text-[#0055A4]" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black text-slate-800 uppercase tracking-wide", children: "Programme Details" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 text-xs font-semibold", children: [{
            label: "State / राज्य",
            value: "Chhattisgarh"
          }, {
            label: "District / जिला",
            value: "Dantewada"
          }, {
            label: "Mission / मिशन",
            value: "NRLM — Deen Dayal Upadhyaya"
          }, {
            label: "Programme Focus",
            value: "Rural Livelihood & Women Empowerment"
          }, {
            label: "Blocks Covered / ब्लॉक",
            value: "4 Blocks (Dantewada, Geedam, Kuakonda, Katekalyan)"
          }, {
            label: "Cadre Types",
            value: "PRP · FLCRP · RBK · IFC Anchor · SR·CRP"
          }, {
            label: "Field Activities Tracked",
            value: "SHG Meeting · Farmer Visit · Training · Monitoring · Livelihood"
          }].map(({
            label,
            value
          }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 shrink-0", children: label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-800 font-bold text-right", children: value })
          ] }, label)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChartNoAxesColumn, { className: "h-4 w-4 text-[#0055A4]" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black text-slate-800 uppercase tracking-wide", children: "Block-wise Summary" })
          ] }),
          blockLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: Array.from({
            length: 5
          }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-full rounded-lg" }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 text-left", children: "Block" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 text-center", children: "Cadres" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 text-center", children: "Activities" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 text-center", children: "Approved" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
              (blockData ?? []).map((b, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2.5 font-bold text-slate-700", children: b.fullName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2.5 text-center text-slate-600", children: b.cadres }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2.5 text-center text-slate-600", children: b.activities }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2.5 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700", children: b.approved }) })
              ] }, i)),
              (blockData ?? []).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 4, className: "py-6 text-center text-slate-400 italic", children: "No block data available" }) })
            ] })
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-7xl px-4 pb-10 sm:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "h-4 w-4 text-[#0055A4]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-black text-slate-800 uppercase tracking-wide", children: "About NRLM" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-4", children: [{
        icon: Leaf,
        title: "Mission / मिशन",
        desc: "The National Rural Livelihoods Mission (NRLM) aims to reduce rural poverty by enabling poor households to access gainful self-employment and skilled wage employment.",
        color: "bg-emerald-50 text-emerald-600"
      }, {
        icon: Users,
        title: "SHG Network / SHG नेटवर्क",
        desc: "NRLM builds strong networks of Self Help Groups (SHGs), Village Organisations (VOs), and Cluster Level Federations (CLFs) to empower rural women.",
        color: "bg-blue-50 text-blue-600"
      }, {
        icon: Smartphone,
        title: "Digital Tracking / डिजिटल ट्रैकिंग",
        desc: "This system enables real-time GPS-verified activity reporting by field cadres, ensuring transparency and accountability at the grassroots level.",
        color: "bg-violet-50 text-violet-600"
      }, {
        icon: Shield,
        title: "Accountability / जवाबदेही",
        desc: "Every activity is photo-geotagged, timestamped, and goes through a two-level verification workflow before being marked as approved.",
        color: "bg-orange-50 text-orange-600"
      }].map(({
        icon: Icon,
        title,
        desc,
        color
      }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex h-10 w-10 items-center justify-center rounded-xl", color), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black text-slate-800 mb-1", children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-500 font-semibold leading-relaxed", children: desc })
        ] })
      ] }, title)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-7xl px-4 pb-16 sm:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-gradient-to-r from-[#0055A4] to-blue-600 p-8 md:p-10 text-white text-center shadow-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-black text-blue-200 uppercase tracking-widest mb-2", children: "Ready to access the system?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl sm:text-2xl font-black mb-3", children: "NRLM Cadre Monitoring System" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-100 font-semibold mb-7 max-w-md mx-auto", children: "Login is required to submit activity reports, view approvals, and track attendance. Public statistics above are available without login." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/auth", className: "inline-flex items-center gap-2 rounded-xl bg-white text-[#0055A4] px-7 py-3 text-sm font-black shadow hover:bg-blue-50 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "h-4 w-4" }),
        "Login to Dashboard",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t border-slate-100 bg-white py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-400 font-semibold", children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " NRLM Cadre Connect — Dantewada, Chhattisgarh"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400 font-semibold text-center sm:text-right", children: "राष्ट्रीय ग्रामीण आजीविका मिशन · Ministry of Rural Development, Government of India" })
    ] }) })
  ] });
}
export {
  PublicIndex as component
};
