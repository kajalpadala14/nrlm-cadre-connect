import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { a as useProfile, h as highestRole } from "./use-auth-DM5yQtMG.mjs";
import { u as useT } from "./router-yzFmt3hU.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { u as utils, w as writeFileSync } from "../_libs/xlsx.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import "../_libs/sonner.mjs";
import { _ as Calendar, $ as Search, a0 as FileText, a1 as Download } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tailwind-merge.mjs";
function exportToExcel(rows, filename, sheetName = "Sheet1") {
  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, sheetName);
  writeFileSync(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
function todayStr() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function applyPreset(preset) {
  const now = /* @__PURE__ */ new Date();
  const today = isoDate(now);
  if (preset === "today") return {
    from: today,
    to: today
  };
  if (preset === "this_week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const mon = new Date(now);
    mon.setDate(now.getDate() - diff);
    return {
      from: isoDate(mon),
      to: today
    };
  }
  if (preset === "this_month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: isoDate(first),
      to: today
    };
  }
  if (preset === "last_month") {
    const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastLast = new Date(firstThisMonth.getTime() - 1);
    const firstLast = new Date(lastLast.getFullYear(), lastLast.getMonth(), 1);
    return {
      from: isoDate(firstLast),
      to: isoDate(lastLast)
    };
  }
  return {
    from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: today
  };
}
function fmt(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}
function exportCSV(rows, filename) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function ReportTable({
  headers,
  rows,
  footer
}) {
  if (rows.length === 0) return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-10 text-center text-sm text-slate-400 font-semibold", children: "No data found for selected filters." });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "block md:hidden space-y-3", children: rows.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-2.5 text-xs font-semibold", children: headers.map((h, j) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center gap-4 border-b border-slate-50 last:border-0 pb-1.5 last:pb-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-bold", children: h }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-700 font-extrabold text-right", children: r[j] })
    ] }, j)) }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider", children: headers.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3 whitespace-nowrap", children: h }, h)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: rows.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "hover:bg-slate-50/50 transition-colors", children: r.map((c, j) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2.5 pr-3 text-slate-700 whitespace-nowrap", children: c }, j)) }, i)) })
    ] }) }),
    footer && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-amber-600 font-semibold border border-amber-100 bg-amber-50 rounded-lg px-3 py-2", children: [
      "⚠️ ",
      footer
    ] })
  ] });
}
function ReportsPage() {
  const {
    t
  } = useT();
  const {
    data: profile
  } = useProfile();
  const role = highestRole(profile?.roles ?? []);
  const officerBlock = role === "block_officer" ? profile?.block_id ?? null : null;
  const [activeTab, setActiveTab] = reactExports.useState("attendance");
  const initial = applyPreset("this_month");
  const [from, setFrom] = reactExports.useState(initial.from);
  const [to, setTo] = reactExports.useState(initial.to);
  const [preset, setPreset] = reactExports.useState("this_month");
  const [blockFilter, setBlockFilter] = reactExports.useState("all");
  const {
    data: blocks = []
  } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => (await supabase.from("blocks").select("id,name").order("name")).data ?? []
  });
  function handlePreset(p) {
    setPreset(p);
    if (p !== "custom") {
      const r = applyPreset(p);
      setFrom(r.from);
      setTo(r.to);
    }
  }
  const effectiveBlock = officerBlock ?? (blockFilter === "all" ? null : blockFilter);
  const tabs = [{
    id: "attendance",
    label: t("tab_attendance_label")
  }, {
    id: "activity",
    label: t("tab_activity_label")
  }, {
    id: "cadre_performance",
    label: t("tab_cadre_perf_label")
  }, {
    id: "block_performance",
    label: t("tab_block_perf_label")
  }];
  const PRESETS = [{
    id: "today",
    label: t("preset_today_label")
  }, {
    id: "this_week",
    label: t("preset_week_label")
  }, {
    id: "this_month",
    label: t("preset_month_label")
  }, {
    id: "last_month",
    label: t("preset_last_month_label")
  }, {
    id: "custom",
    label: t("preset_custom_label")
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black text-slate-800 tracking-tight", children: t("reports_module_title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: "Generate, filter and export government MIS reports" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: PRESETS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => handlePreset(p.id), className: cn("rounded-full border px-3 py-1.5 text-xs font-bold transition-colors", preset === p.id ? "border-[#0055A4] bg-[#0055A4] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"), children: p.label }, p.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("from_date_label2") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: from, max: to, onChange: (e) => {
            setFrom(e.target.value);
            setPreset("custom");
          }, className: "h-10 rounded-xl border-slate-200 text-xs font-bold" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("to_date_label2") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: to, min: from, max: todayStr(), onChange: (e) => {
            setTo(e.target.value);
            setPreset("custom");
          }, className: "h-10 rounded-xl border-slate-200 text-xs font-bold" })
        ] }),
        !officerBlock && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("block_label3") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: blockFilter, onValueChange: setBlockFilter, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-xl border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: t("all_blocks_opt") }),
              blocks.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: b.id, children: b.name }, b.id))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("report_period_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3.5 w-3.5 text-slate-400 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
              fmt(from),
              " — ",
              fmt(to)
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setActiveTab(tab.id), className: cn("rounded-lg px-4 py-2 text-xs font-bold transition-all", activeTab === tab.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-200/60"), children: tab.label }, tab.id)) }),
    activeTab === "attendance" && /* @__PURE__ */ jsxRuntimeExports.jsx(AttendanceReport, { from, to, blockId: effectiveBlock }),
    activeTab === "activity" && /* @__PURE__ */ jsxRuntimeExports.jsx(ActivityReport, { from, to, blockId: effectiveBlock }),
    activeTab === "cadre_performance" && /* @__PURE__ */ jsxRuntimeExports.jsx(CadrePerformanceReport, { from, to, blockId: effectiveBlock }),
    activeTab === "block_performance" && /* @__PURE__ */ jsxRuntimeExports.jsx(BlockPerformanceReport, { from, to })
  ] });
}
const ROLE_LABEL_MAP = {
  PRP: "PRP",
  FLCRP: "FLCRP",
  RBK: "RBK",
  IFC_Anchor: "IFC Anchor",
  SR_CRP: "SR CRP",
  Block_Coordinator: "Block Coordinator",
  BPM: "BPM (Block Project Manager)",
  BPO: "BPO (Block Programme Officer)",
  DPM: "DPM (District Project Manager)",
  CEO: "CEO",
  FPO_CEO: "FPO CEO"
};
function useDistinctCadreTypes(blockId) {
  return useQuery({
    queryKey: ["distinct-cadre-types", blockId],
    staleTime: 6e4,
    queryFn: async () => {
      let q = supabase.from("profiles").select("cadre_type");
      if (blockId) q = q.eq("block_id", blockId);
      const {
        data
      } = await q;
      const types = Array.from(new Set((data ?? []).map((r) => r.cadre_type).filter(Boolean)));
      return types.sort();
    }
  });
}
function AttendanceReport({
  from,
  to,
  blockId
}) {
  const {
    t
  } = useT();
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [roleFilter, setRoleFilter] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const {
    data: availableRoles = []
  } = useDistinctCadreTypes(blockId);
  const {
    data: raw = [],
    isLoading
  } = useQuery({
    queryKey: ["rpt-attendance", from, to, blockId],
    queryFn: async () => {
      let q = supabase.from("attendance").select(`
          date, status, check_in_at, check_out_at, remarks,
          profiles!attendance_cadre_id_fkey(full_name, user_id, cadre_type, village,
            blocks!profiles_block_id_fkey(name))
        `).gte("date", from).lte("date", to).order("date", {
        ascending: false
      }).limit(5e3);
      if (blockId) q = q.eq("block_id", blockId);
      const {
        data,
        error
      } = await q;
      if (error) throw error;
      return data ?? [];
    }
  });
  const STATUS_MAP = {
    present: "Present",
    absent: "Absent",
    on_leave: "On Leave",
    holiday: "Holiday",
    pending_verification: "Pending Verification"
  };
  const rows = reactExports.useMemo(() => {
    return raw.filter((r) => {
      const name = r.profiles?.full_name ?? "";
      const cadreType = r.profiles?.cadre_type ?? "";
      const s = r.status ?? "";
      if (statusFilter !== "all" && s !== statusFilter) return false;
      if (roleFilter !== "all" && cadreType !== roleFilter) return false;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [raw, statusFilter, roleFilter, search]);
  const tableHeaders = ["Date", "Cadre Name", "User ID", "Role / Cadre Type", "Block", "Village", "Status", "Check-In", "Check-Out", "Remarks"];
  const tableRows = rows.slice(0, 200).map((r) => {
    const p = r.profiles ?? {};
    const checkIn = r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    }) : "—";
    const checkOut = r.check_out_at ? new Date(r.check_out_at).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    }) : "—";
    return [r.date, p.full_name ?? "—", p.user_id ?? "—", ROLE_LABEL_MAP[p.cadre_type] ?? p.cadre_type ?? "—", p.blocks?.name ?? "—", p.village ?? "—", STATUS_MAP[r.status] ?? r.status, checkIn, checkOut, r.remarks ?? "—"];
  });
  function buildExportRows() {
    return rows.map((r) => {
      const p = r.profiles ?? {};
      return {
        Date: r.date,
        "Cadre Name": p.full_name ?? "",
        "User ID": p.user_id ?? "",
        "Role / Cadre Type": ROLE_LABEL_MAP[p.cadre_type] ?? p.cadre_type ?? "",
        Block: p.blocks?.name ?? "",
        Village: p.village ?? "",
        Status: STATUS_MAP[r.status] ?? r.status,
        "Check-In": r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit"
        }) : "",
        "Check-Out": r.check_out_at ? new Date(r.check_out_at).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit"
        }) : "",
        Remarks: r.remarks ?? ""
      };
    });
  }
  const slug = `attendance-report-${fmt(from)}-to-${fmt(to)}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ReportPanel, { title: "Attendance Report", from, to, isLoading, totalRows: rows.length, onExcelExport: () => exportToExcel(buildExportRows(), `${slug}.xlsx`, "Attendance"), onCsvExport: () => exportCSV(buildExportRows(), `${slug}.csv`), extraFilters: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: "Status" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-40 rounded-lg border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Statuses" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "present", children: "Present" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "absent", children: "Absent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "on_leave", children: "On Leave" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "holiday", children: "Holiday" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("role_label2") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: roleFilter, onValueChange: setRoleFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-52 rounded-lg border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: t("all_roles_label") }),
          availableRoles.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: r, children: ROLE_LABEL_MAP[r] ?? r }, r))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: "Search Cadre" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Name...", className: "h-9 w-44 rounded-lg border-slate-200 text-xs pl-8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" })
      ] })
    ] })
  ] }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReportTable, { headers: tableHeaders, rows: tableRows, footer: rows.length > 200 ? `Showing 200 of ${rows.length}. Use Export for full data.` : void 0 }) });
}
function ActivityReport({
  from,
  to,
  blockId
}) {
  const [actTypeFilter, setActTypeFilter] = reactExports.useState("all");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const ACTIVITY_TYPES = ["SHG_Meeting", "Farmer_Visit", "Training_Session", "Monitoring_Visit", "Record_Verification", "Livelihood_Activity", "Other"];
  const ACT_LABEL = {
    SHG_Meeting: "SHG Meeting",
    Farmer_Visit: "Farmer Visit",
    Training_Session: "Training Session",
    Monitoring_Visit: "Monitoring Visit",
    Record_Verification: "Record Verification",
    Livelihood_Activity: "Livelihood Activity",
    Other: "Other"
  };
  const {
    data: raw = [],
    isLoading
  } = useQuery({
    queryKey: ["rpt-activity", from, to, blockId],
    queryFn: async () => {
      let q = supabase.from("activities").select(`
          activity_date, activity_type, village_name, panchayat,
          beneficiaries, status, photo_url, submitted_at, description,
          profiles!activities_cadre_id_fkey_profiles(full_name, user_id, cadre_type),
          blocks!activities_block_id_fkey(name)
        `).gte("activity_date", from).lte("activity_date", to).order("activity_date", {
        ascending: false
      }).limit(5e3);
      if (blockId) q = q.eq("block_id", blockId);
      const {
        data,
        error
      } = await q;
      if (error) throw error;
      return data ?? [];
    }
  });
  const rows = reactExports.useMemo(() => {
    return raw.filter((r) => {
      const name = r.profiles?.full_name ?? "";
      if (actTypeFilter !== "all" && r.activity_type !== actTypeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search && !name.toLowerCase().includes(search.toLowerCase()) && !r.village_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [raw, actTypeFilter, statusFilter, search]);
  function buildExportRows() {
    return rows.map((r) => {
      const p = r.profiles ?? {};
      return {
        Date: r.activity_date,
        "Cadre Name": p.full_name ?? "",
        "User ID": p.user_id ?? "",
        "Cadre Type": p.cadre_type ?? "",
        Block: r.blocks?.name ?? "",
        Panchayat: r.panchayat ?? "",
        Village: r.village_name,
        "Activity Type": ACT_LABEL[r.activity_type] ?? r.activity_type,
        Beneficiaries: r.beneficiaries ?? 0,
        Status: r.status ?? "",
        "Photo Evidence": r.photo_url ? "Yes" : "No",
        "Photo URL": r.photo_url ?? "",
        "Submitted At": new Date(r.submitted_at).toLocaleString("en-IN")
      };
    });
  }
  const tableHeaders = ["Date", "Cadre Name", "Block", "Village", "Activity Type", "Beneficiaries", "Status", "Photo"];
  const tableRows = rows.slice(0, 200).map((r) => [r.activity_date, r.profiles?.full_name ?? "—", r.blocks?.name ?? "—", r.village_name, ACT_LABEL[r.activity_type] ?? r.activity_type, r.beneficiaries ?? 0, r.status ?? "—", r.photo_url ? "✓" : "—"]);
  const slug = `activity-report-${fmt(from)}-to-${fmt(to)}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ReportPanel, { title: "Activity Report", from, to, isLoading, totalRows: rows.length, onExcelExport: () => exportToExcel(buildExportRows(), `${slug}.xlsx`, "Activities"), onCsvExport: () => exportCSV(buildExportRows(), `${slug}.csv`), extraFilters: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: "Activity Type" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: actTypeFilter, onValueChange: setActTypeFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-44 rounded-lg border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Types" }),
          ACTIVITY_TYPES.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t, children: ACT_LABEL[t] }, t))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: "Status" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-36 rounded-lg border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Pending", children: "Pending" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Approved", children: "Approved" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Rejected", children: "Rejected" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: "Search" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Name / Village...", className: "h-9 w-44 rounded-lg border-slate-200 text-xs pl-8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" })
      ] })
    ] })
  ] }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReportTable, { headers: tableHeaders, rows: tableRows, footer: rows.length > 200 ? `Showing 200 of ${rows.length}. Use Export for full data.` : void 0 }) });
}
function CadrePerformanceReport({
  from,
  to,
  blockId
}) {
  const {
    t
  } = useT();
  const [roleFilter, setRoleFilter] = reactExports.useState("all");
  const {
    data: availableRoles = []
  } = useDistinctCadreTypes(blockId);
  const {
    data: profiles = [],
    isLoading: loadingProfiles
  } = useQuery({
    queryKey: ["rpt-cp-profiles", blockId],
    queryFn: async () => {
      const {
        data: urData
      } = await supabase.from("user_roles").select("user_id").eq("role", "cadre");
      const ids = (urData ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      let q = supabase.from("profiles").select("id, full_name, user_id, cadre_type, village, blocks!profiles_block_id_fkey(name)").in("id", ids);
      if (blockId) q = q.eq("block_id", blockId);
      const {
        data
      } = await q;
      return data ?? [];
    }
  });
  const {
    data: attData = [],
    isLoading: loadingAtt
  } = useQuery({
    queryKey: ["rpt-cp-att", from, to, blockId],
    queryFn: async () => {
      let q = supabase.from("attendance").select("cadre_id, status").gte("date", from).lte("date", to);
      if (blockId) q = q.eq("block_id", blockId);
      const {
        data
      } = await q;
      return data ?? [];
    }
  });
  const {
    data: actData = [],
    isLoading: loadingAct
  } = useQuery({
    queryKey: ["rpt-cp-act", from, to, blockId],
    queryFn: async () => {
      let q = supabase.from("activities").select("cadre_id, status, village_name, beneficiaries").gte("activity_date", from).lte("activity_date", to);
      if (blockId) q = q.eq("block_id", blockId);
      const {
        data
      } = await q;
      return data ?? [];
    }
  });
  const isLoading = loadingProfiles || loadingAtt || loadingAct;
  const rows = reactExports.useMemo(() => {
    return profiles.filter((p) => roleFilter === "all" || p.cadre_type === roleFilter).map((p) => {
      const att = attData.filter((a) => a.cadre_id === p.id);
      const acts = actData.filter((a) => a.cadre_id === p.id);
      const present = att.filter((a) => a.status === "present").length;
      const absent = att.filter((a) => a.status === "absent").length;
      const leave = att.filter((a) => a.status === "on_leave").length;
      const total = present + absent + leave;
      const attPct = total > 0 ? (present / total * 100).toFixed(1) + "%" : "—";
      const totalActs = acts.length;
      const approved = acts.filter((a) => a.status === "Approved").length;
      const pending = acts.filter((a) => a.status === "Pending").length;
      const rejected = acts.filter((a) => a.status === "Rejected").length;
      const approvalRate = totalActs > 0 ? (approved / totalActs * 100).toFixed(1) + "%" : "—";
      const villages = new Set(acts.map((a) => a.village_name)).size;
      const beneficiaries = acts.reduce((s, a) => s + (a.beneficiaries ?? 0), 0);
      return {
        profile: p,
        present,
        absent,
        leave,
        attPct,
        totalActs,
        approved,
        pending,
        rejected,
        approvalRate,
        villages,
        beneficiaries
      };
    });
  }, [profiles, attData, actData, roleFilter]);
  const tableHeaders = ["User ID", "Cadre Name", "Role / Type", "Block", "Present", "Absent", "Leave", "Att%", "Activities", "Approved", "Pending", "Rejected", "Appr%", "Villages", "Beneficiaries"];
  const tableRows = rows.slice(0, 200).map((r) => [r.profile.user_id, r.profile.full_name, ROLE_LABEL_MAP[r.profile.cadre_type] ?? r.profile.cadre_type ?? "—", r.profile.blocks?.name ?? "—", r.present, r.absent, r.leave, r.attPct, r.totalActs, r.approved, r.pending, r.rejected, r.approvalRate, r.villages, r.beneficiaries]);
  function buildExportRows() {
    return rows.map((r) => ({
      "User ID": r.profile.user_id,
      "Cadre Name": r.profile.full_name,
      "Role / Cadre Type": ROLE_LABEL_MAP[r.profile.cadre_type] ?? r.profile.cadre_type ?? "",
      Block: r.profile.blocks?.name ?? "",
      Village: r.profile.village ?? "",
      "Present Days": r.present,
      "Absent Days": r.absent,
      "Leave Days": r.leave,
      "Attendance %": r.attPct,
      "Total Activities": r.totalActs,
      "Approved": r.approved,
      "Pending": r.pending,
      "Rejected": r.rejected,
      "Approval Rate %": r.approvalRate,
      "Villages Covered": r.villages,
      "Total Beneficiaries": r.beneficiaries
    }));
  }
  const slug = `cadre-performance-${fmt(from)}-to-${fmt(to)}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ReportPanel, { title: "Cadre Performance Report", from, to, isLoading, totalRows: rows.length, onExcelExport: () => exportToExcel(buildExportRows(), `${slug}.xlsx`, "Cadre Performance"), onCsvExport: () => exportCSV(buildExportRows(), `${slug}.csv`), extraFilters: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("role_label2") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: roleFilter, onValueChange: setRoleFilter, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-52 rounded-lg border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: t("all_roles_label") }),
        availableRoles.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: r, children: ROLE_LABEL_MAP[r] ?? r }, r))
      ] })
    ] })
  ] }) }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReportTable, { headers: tableHeaders, rows: tableRows, footer: rows.length > 200 ? `Showing 200 of ${rows.length}. Use Export for full data.` : void 0 }) });
}
function BlockPerformanceReport({
  from,
  to
}) {
  const {
    data: blocks = [],
    isLoading: loadingBlocks
  } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => (await supabase.from("blocks").select("id,name").order("name")).data ?? []
  });
  const {
    data: attData = [],
    isLoading: loadingAtt
  } = useQuery({
    queryKey: ["rpt-bp-att", from, to],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("attendance").select("block_id, cadre_id, status, date").gte("date", from).lte("date", to);
      return data ?? [];
    }
  });
  const {
    data: actData = [],
    isLoading: loadingAct
  } = useQuery({
    queryKey: ["rpt-bp-act", from, to],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("activities").select("block_id, cadre_id, status, village_name, beneficiaries").gte("activity_date", from).lte("activity_date", to);
      return data ?? [];
    }
  });
  const {
    data: profilesData = [],
    isLoading: loadingProfiles
  } = useQuery({
    queryKey: ["rpt-bp-profiles"],
    queryFn: async () => {
      const {
        data: urData
      } = await supabase.from("user_roles").select("user_id").eq("role", "cadre");
      const ids = (urData ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const {
        data
      } = await supabase.from("profiles").select("id, block_id").in("id", ids);
      return data ?? [];
    }
  });
  const isLoading = loadingBlocks || loadingAtt || loadingAct || loadingProfiles;
  const rows = reactExports.useMemo(() => {
    return blocks.map((b) => {
      const totalCadres = profilesData.filter((p) => p.block_id === b.id).length;
      const bAtt = attData.filter((a) => a.block_id === b.id);
      const bAct = actData.filter((a) => a.block_id === b.id);
      const present = bAtt.filter((a) => a.status === "present").length;
      const absent = bAtt.filter((a) => a.status === "absent").length;
      const total = present + absent;
      const avgAttPct = total > 0 ? (present / total * 100).toFixed(1) + "%" : "—";
      const totalActs = bAct.length;
      const approved = bAct.filter((a) => a.status === "Approved").length;
      const pending = bAct.filter((a) => a.status === "Pending").length;
      const rejected = bAct.filter((a) => a.status === "Rejected").length;
      const approvalRate = totalActs > 0 ? (approved / totalActs * 100).toFixed(1) + "%" : "—";
      const villages = new Set(bAct.map((a) => a.village_name)).size;
      const beneficiaries = bAct.reduce((s, a) => s + (a.beneficiaries ?? 0), 0);
      return {
        name: b.name,
        totalCadres,
        present,
        absent,
        avgAttPct,
        totalActs,
        approved,
        pending,
        rejected,
        approvalRate,
        villages,
        beneficiaries
      };
    });
  }, [blocks, attData, actData, profilesData]);
  const tableHeaders = ["Block", "Total Cadres", "Present Days", "Absent Days", "Avg Att%", "Activities", "Approved", "Pending", "Rejected", "Appr%", "Villages", "Beneficiaries"];
  const tableRows = rows.map((r) => [r.name, r.totalCadres, r.present, r.absent, r.avgAttPct, r.totalActs, r.approved, r.pending, r.rejected, r.approvalRate, r.villages, r.beneficiaries]);
  function buildExportRows() {
    return rows.map((r) => ({
      "Block": r.name,
      "Total Cadres": r.totalCadres,
      "Total Present Days": r.present,
      "Total Absent Days": r.absent,
      "Avg Attendance %": r.avgAttPct,
      "Total Activities": r.totalActs,
      "Approved Activities": r.approved,
      "Pending Activities": r.pending,
      "Rejected Activities": r.rejected,
      "Approval Rate %": r.approvalRate,
      "Villages Covered": r.villages,
      "Total Beneficiaries": r.beneficiaries
    }));
  }
  const slug = `block-performance-${fmt(from)}-to-${fmt(to)}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ReportPanel, { title: "Block Performance Report", from, to, isLoading, totalRows: rows.length, onExcelExport: () => exportToExcel(buildExportRows(), `${slug}.xlsx`, "Block Performance"), onCsvExport: () => exportCSV(buildExportRows(), `${slug}.csv`), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReportTable, { headers: tableHeaders, rows: tableRows }) });
}
function ReportPanel({
  title,
  from,
  to,
  isLoading,
  totalRows,
  onExcelExport,
  onCsvExport,
  extraFilters,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black text-slate-800", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-400 font-semibold mt-0.5", children: [
          "रिपोर्ट अवधि / Report Period: ",
          fmt(from),
          " — ",
          fmt(to),
          totalRows > 0 && !isLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 font-bold", children: [
            totalRows,
            " rows"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: onCsvExport, disabled: isLoading || totalRows === 0, className: "h-9 rounded-lg text-xs font-bold border-slate-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "mr-1.5 h-3.5 w-3.5" }),
          "CSV"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: onExcelExport, disabled: isLoading || totalRows === 0, className: "h-9 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "mr-1.5 h-3.5 w-3.5" }),
          "Excel (.xlsx)"
        ] })
      ] })
    ] }),
    extraFilters && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-50 bg-slate-50/50 px-5 py-3", children: extraFilters }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-16 text-slate-400 text-sm font-semibold animate-pulse", children: "लोड हो रहा है... / Loading report data..." }) : children })
  ] });
}
export {
  ReportsPage as component
};
