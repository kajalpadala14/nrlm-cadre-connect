import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Calendar, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile, highestRole } from "@/hooks/use-auth";
import { getUserDataScope, getCadreIdsInBlock, applyScopeToQuery } from "@/lib/data-scope";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { exportToExcel } from "@/lib/excel";
import { cn } from "@/lib/utils";
import { useActivityCacheSync } from "@/hooks/use-activity-cache-sync";

export const Route = createFileRoute("/_authenticated/dashboard/reports")({
  component: ReportsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────
type ReportTab = "attendance" | "activity" | "cadre_performance" | "block_performance" | "leaves";

type Preset = "today" | "this_week" | "this_month" | "last_month" | "custom";

// ─── Date helpers ─────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function applyPreset(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const today = isoDate(now);

  if (preset === "today") return { from: today, to: today };

  if (preset === "this_week") {
    const day = now.getDay(); // 0=Sun
    const diff = day === 0 ? 6 : day - 1; // Mon=0
    const mon = new Date(now);
    mon.setDate(now.getDate() - diff);
    return { from: isoDate(mon), to: today };
  }

  if (preset === "this_month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: isoDate(first), to: today };
  }

  if (preset === "last_month") {
    const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastLast = new Date(firstThisMonth.getTime() - 1);
    const firstLast = new Date(lastLast.getFullYear(), lastLast.getMonth(), 1);
    return { from: isoDate(firstLast), to: isoDate(lastLast) };
  }

  return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
}

// Format date as DD-MM-YYYY for filenames and display
function fmt(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

// ─── Shared CSV export ────────────────────────────────────────────────────
function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Shared ReportTable ───────────────────────────────────────────────────
function ReportTable({
  headers,
  rows,
  footer,
}: {
  headers: string[];
  rows: (string | number)[][];
  footer?: string;
}) {
  if (rows.length === 0)
    return (
      <p className="py-10 text-center text-sm text-slate-400 font-semibold">
        {/* No data message uses the key directly since ReportTable has no access to t() */}
        No data found for selected filters.
      </p>
    );

  return (
    <div className="space-y-4">
      {/* Mobile card view */}
      <div className="block md:hidden space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-2.5 text-xs font-semibold">
            {headers.map((h, j) => (
              <div key={j} className="flex justify-between items-center gap-4 border-b border-slate-50 last:border-0 pb-1.5 last:pb-0">
                <span className="text-slate-400 font-bold">{h}</span>
                <span className="text-slate-700 font-extrabold text-right">{r[j]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider">
              {headers.map((h) => (
                <th key={h} className="py-3 pr-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                {r.map((c, j) => (
                  <td key={j} className="py-2.5 pr-3 text-slate-700 whitespace-nowrap">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {footer && (
        <p className="mt-2 text-xs text-amber-600 font-semibold border border-amber-100 bg-amber-50 rounded-lg px-3 py-2">
          ⚠️ {footer}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
function ReportsPage() {
  const { t, lang } = useT();
  useActivityCacheSync();
  const { data: profile } = useProfile();
  const scope = getUserDataScope(profile);
  const officerBlock = scope.isScoped ? (scope.blockId ?? null) : null;

  // Tab state
  const [activeTab, setActiveTab] = useState<ReportTab>("attendance");

  // Shared date range state
  const initial = applyPreset("this_month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [preset, setPreset] = useState<Preset>("this_month");

  // Shared block filter (admins only)
  const [blockFilter, setBlockFilter] = useState("all");

  useEffect(() => {
    if (scope.isScoped && scope.blockId) {
      setBlockFilter(scope.blockId);
    }
  }, [scope.isScoped, scope.blockId]);

  // Blocks list for dropdown
  const { data: blocks = [] } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => (await supabase.from("blocks").select("id,name").order("name")).data ?? [],
  });

  function handlePreset(p: Preset) {
    setPreset(p);
    if (p !== "custom") {
      const r = applyPreset(p);
      setFrom(r.from);
      setTo(r.to);
    }
  }

  // For cadre-role users: their attendance is RLS-restricted to their own cadre_id.
  // Pass it down so AttendanceReport and ActivityReport can filter correctly.
  const isCadreRole = highestRole(profile?.roles ?? []) === "cadre";
  const selfCadreId = isCadreRole ? (profile?.id ?? null) : null;

  // Wait for profile before computing effective block (prevents wrong data on first render)
  const effectiveBlock = !scope.ready
    ? undefined
    : (officerBlock ?? (blockFilter === "all" ? null : blockFilter));

  const tabs: { id: ReportTab; label: string }[] = [
    { id: "attendance",        label: t("tab_attendance_label") },
    { id: "activity",          label: t("tab_activity_label") },
    { id: "cadre_performance", label: t("tab_cadre_perf_label") },
    { id: "block_performance", label: t("tab_block_perf_label") },
    { id: "leaves",            label: lang === "hi" ? "अवकाश रिपोर्ट" : "Leave Reports" },
  ];

  const PRESETS: { id: Preset; label: string }[] = [
    { id: "today",      label: t("preset_today_label") },
    { id: "this_week",  label: t("preset_week_label") },
    { id: "this_month", label: t("preset_month_label") },
    { id: "last_month", label: t("preset_last_month_label") },
    { id: "custom",     label: t("preset_custom_label") },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {t("reports_module_title")}
        </h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
          Generate, filter and export government MIS reports
        </p>
      </div>

      {/* ── Global Filter Bar ───────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
        {/* Quick presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePreset(p.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                preset === p.id
                  ? "border-[#0055A4] bg-[#0055A4] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date + Block filters */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-500">{t("from_date_label2")}</Label>
            <Input
              type="date"
              value={from}
              max={to}
              onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }}
              className="h-10 rounded-xl border-slate-200 text-xs font-bold"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-500">{t("to_date_label2")}</Label>
            <Input
              type="date"
              value={to}
              min={from}
              max={todayStr()}
              onChange={(e) => { setTo(e.target.value); setPreset("custom"); }}
              className="h-10 rounded-xl border-slate-200 text-xs font-bold"
            />
          </div>
          {/* Block selector — hidden for block_officers (auto-scoped) */}
          {!officerBlock && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-500">{t("block_label3")}</Label>
              <Select value={blockFilter} onValueChange={setBlockFilter}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_blocks_opt")}</SelectItem>
                  {blocks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Period display */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-500">{t("report_period_label")}</Label>
            <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{fmt(from)} — {fmt(to)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Strip ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-bold transition-all",
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-200/60",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Active Report Panel ─────────────────────────────────── */}
      {activeTab === "attendance" && effectiveBlock !== undefined && (
        <AttendanceReport from={from} to={to} blockId={effectiveBlock} selfCadreId={selfCadreId} />
      )}
      {activeTab === "activity" && effectiveBlock !== undefined && (
        <ActivityReport from={from} to={to} blockId={effectiveBlock} selfCadreId={selfCadreId} />
      )}
      {activeTab === "cadre_performance" && effectiveBlock !== undefined && (
        <CadrePerformanceReport from={from} to={to} blockId={effectiveBlock} />
      )}
      {activeTab === "block_performance" && effectiveBlock !== undefined && (
        <BlockPerformanceReport from={from} to={to} blockId={effectiveBlock} />
      )}
      {activeTab === "leaves" && effectiveBlock !== undefined && (
        <LeavesReport from={from} to={to} blockId={effectiveBlock} />
      )}
    </div>
  );
}

// ─── ROLE FILTER HELPERS (shared by Attendance + Cadre Performance) ──────
// Full label map for every possible role value the UI requested.
// Roles not present in the DB will be hidden automatically.
const ROLE_LABEL_MAP: Record<string, string> = {
  PRP:               "PRP",
  FLCRP:             "FLCRP",
  RBK:               "RBK",
  IFC_Anchor:        "IFC Anchor",
  SR_CRP:            "SR CRP",
  Block_Coordinator: "Block Coordinator",
  BPM:               "BPM (Block Project Manager)",
  BPO:               "BPO (Block Programme Officer)",
  DPM:               "DPM (District Project Manager)",
  CEO:               "CEO",
  FPO_CEO:           "FPO CEO",
};

// Fetches distinct cadre_type values that actually exist in profiles.
// Result is used to build the role dropdown — only show roles with data.
function useDistinctCadreTypes(blockId: string | null) {
  return useQuery({
    queryKey: ["distinct-cadre-types", blockId],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("profiles").select("cadre_type");
      if (blockId) q = q.eq("block_id", blockId);
      const { data } = await q;
      const types = Array.from(
        new Set((data ?? []).map((r: any) => r.cadre_type).filter(Boolean))
      ) as string[];
      return types.sort();
    },
  });
}

// ─── ATTENDANCE REPORT ────────────────────────────────────────────────────
function AttendanceReport({ from, to, blockId, selfCadreId }: { from: string; to: string; blockId: string | null; selfCadreId: string | null }) {
  const { t } = useT();
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Live distinct roles for the dropdown — auto-hides absent roles
  const { data: availableRoles = [] } = useDistinctCadreTypes(blockId);

  const { data: raw = [], isLoading, error: queryError } = useQuery({
    queryKey: ["rpt-attendance", from, to, blockId, selfCadreId],
    queryFn: async () => {
      let q = supabase
        .from("attendance")
        .select(`
          date, status, check_in_at, check_out_at, photo_uploaded_at, remarks, block_id, cadre_id,
          profiles!attendance_cadre_id_fkey(full_name, user_id, cadre_type, village,
            blocks!profiles_block_id_fkey(name))
        `)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false })
        .limit(5000);

      if (selfCadreId) {
        q = q.eq("cadre_id", selfCadreId);
      } else if (blockId) {
        const cadreIds = await getCadreIdsInBlock(blockId);
        q = applyScopeToQuery(q, true, blockId, cadreIds);
      }

      const { data, error } = await q;

      // If the query failed because photo_uploaded_at column doesn't exist yet
      // (migration not applied), fall back to a query without that column.
      if (error) {
        if (error.message?.includes("photo_uploaded_at") || error.code === "42703") {
          let q2 = supabase
            .from("attendance")
            .select(`
              date, status, check_in_at, check_out_at, remarks, block_id, cadre_id,
              profiles!attendance_cadre_id_fkey(full_name, user_id, cadre_type, village,
                blocks!profiles_block_id_fkey(name))
            `)
            .gte("date", from)
            .lte("date", to)
            .order("date", { ascending: false })
            .limit(5000);
          if (selfCadreId) {
            q2 = q2.eq("cadre_id", selfCadreId);
          } else if (blockId) {
            const cadreIds2 = await getCadreIdsInBlock(blockId);
            q2 = applyScopeToQuery(q2, true, blockId, cadreIds2);
          }
          const { data: data2, error: error2 } = await q2;
          if (error2) throw error2;
          return data2 ?? [];
        }
        throw error;
      }

      return data ?? [];
    },
    retry: false,
  });

  const STATUS_MAP: Record<string, string> = {
    present:              "Present",
    late:                 "Late",
    absent:               "Absent",
    on_leave:             "On Leave",
    holiday:              "Holiday",
    pending:              "Pending",
    pending_verification: "Pending",
  };

  const rows = useMemo(() => {
    return raw.filter((r: any) => {
      const name: string = r.profiles?.full_name ?? "";
      const cadreType: string = r.profiles?.cadre_type ?? "";
      const s = r.status ?? "";
      // "pending" filter matches both 'pending' and 'pending_verification' (legacy)
      if (statusFilter !== "all") {
        if (statusFilter === "pending") {
          if (s !== "pending" && s !== "pending_verification") return false;
        } else {
          if (s !== statusFilter) return false;
        }
      }
      if (roleFilter !== "all" && cadreType !== roleFilter) return false;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [raw, statusFilter, roleFilter, search]);

  const tableHeaders = ["Date", "Cadre Name", "User ID", "Role / Cadre Type", "Block", "Village", "Status", "Check-In", "Check-Out", "Remarks"];
  const tableRows = rows.slice(0, 200).map((r: any) => {
    const p = r.profiles ?? {};
    const checkIn = r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
    const checkOut = r.check_out_at ? new Date(r.check_out_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
    return [r.date, p.full_name ?? "—", p.user_id ?? "—", ROLE_LABEL_MAP[p.cadre_type] ?? p.cadre_type ?? "—", p.blocks?.name ?? "—", p.village ?? "—", STATUS_MAP[r.status] ?? r.status, checkIn, checkOut, r.remarks ?? "—"];
  });

  // Summary counts — always computed from the full raw dataset (unaffected by
  // the status/role/search filters above) so the footer always shows the complete
  // breakdown for the selected date range, not just the currently visible subset.
  const presentTotal = raw.filter((r: any) => r.status === "present").length;
  const lateTotal    = raw.filter((r: any) => r.status === "late").length;
  const absentTotal  = raw.filter((r: any) => r.status === "absent").length;
  const pendingTotal = raw.filter((r: any) => r.status === "pending" || r.status === "pending_verification").length;
  const leaveTotal   = raw.filter((r: any) => r.status === "on_leave").length;
  const summaryFooter = raw.length > 0
    ? `Total records in range — Present: ${presentTotal} | Late: ${lateTotal} | Absent: ${absentTotal} | Pending: ${pendingTotal} | On Leave: ${leaveTotal}`
    : undefined;

  function buildExportRows() {
    return rows.map((r: any) => {
      const p = r.profiles ?? {};
      return {
        Date: r.date,
        "Cadre Name": p.full_name ?? "",
        "User ID": p.user_id ?? "",
        "Role / Cadre Type": ROLE_LABEL_MAP[p.cadre_type] ?? p.cadre_type ?? "",
        Block: p.blocks?.name ?? "",
        Village: p.village ?? "",
        Status: STATUS_MAP[r.status] ?? r.status,
        "Check-In": r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
        "Check-Out": r.check_out_at ? new Date(r.check_out_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
        Remarks: r.remarks ?? "",
      };
    });
  }

  const slug = `attendance-report-${fmt(from)}-to-${fmt(to)}`;

  // If query errored out, show the error message instead of spinning forever
  if (queryError) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
        ⚠️ Attendance data could not be loaded: {(queryError as Error).message}
        <p className="text-xs font-semibold text-rose-500 mt-1">
          If this says "column photo_uploaded_at does not exist", apply the pending database migration in Supabase.
        </p>
      </div>
    );
  }

  return (
    <ReportPanel
      title="Attendance Report"
      from={from} to={to} isLoading={isLoading}
      totalRows={rows.length}
      onExcelExport={() => exportToExcel(buildExportRows(), `${slug}.xlsx`, "Attendance")}
      onCsvExport={() => exportCSV(buildExportRows(), `${slug}.csv`)}
      extraFilters={
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-slate-500">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-40 rounded-lg border-slate-200 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Role filter — only shows roles that actually exist in the DB */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-slate-500">{t("role_label2")}</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-52 rounded-lg border-slate-200 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_roles_label")}</SelectItem>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL_MAP[r] ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-slate-500">Search Cadre</Label>
            <div className="relative">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name..." className="h-9 w-44 rounded-lg border-slate-200 text-xs pl-8" />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      }
    >
      <ReportTable
        headers={tableHeaders}
        rows={tableRows}
        footer={rows.length > 200 ? `Showing 200 of ${rows.length}. Use Export for full data.` : summaryFooter}
      />
    </ReportPanel>
  );
}

// ─── ACTIVITY REPORT ──────────────────────────────────────────────────────
function ActivityReport({ from, to, blockId, selfCadreId }: { from: string; to: string; blockId: string | null; selfCadreId: string | null }) {
  const [actTypeFilter, setActTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const ACTIVITY_TYPES = ["SHG_Meeting", "Farmer_Visit", "Training_Session", "Monitoring_Visit", "Record_Verification", "Livelihood_Activity", "Other"];
  const ACT_LABEL: Record<string, string> = {
    SHG_Meeting: "SHG Meeting", Farmer_Visit: "Farmer Visit", Training_Session: "Training Session",
    Monitoring_Visit: "Monitoring Visit", Record_Verification: "Record Verification",
    Livelihood_Activity: "Livelihood Activity", Other: "Other",
  };

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ["rpt-activity", from, to, blockId, selfCadreId],
    queryFn: async () => {
      let q = supabase
        .from("activities")
        .select(`
          activity_date, activity_type, village_name, panchayat,
          beneficiaries, status, photo_url, submitted_at, description, block_id, cadre_id,
          profiles!activities_cadre_id_fkey_profiles(full_name, user_id, cadre_type, block_id, blocks!profiles_block_id_fkey(name)),
          blocks!activities_block_id_fkey(name)
        `)
        .gte("activity_date", from)
        .lte("activity_date", to)
        .order("activity_date", { ascending: false })
        .limit(5000);

      if (selfCadreId) {
        // Cadre-role user: scope to their own activities
        q = q.eq("cadre_id", selfCadreId);
      } else if (blockId) {
        const cadreIds = await getCadreIdsInBlock(blockId);
        q = applyScopeToQuery(q, true, blockId, cadreIds);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    return raw.filter((r: any) => {
      const name: string = (r.profiles as any)?.full_name ?? "";
      if (actTypeFilter !== "all" && r.activity_type !== actTypeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search && !name.toLowerCase().includes(search.toLowerCase()) && !r.village_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [raw, actTypeFilter, statusFilter, search]);

  function buildExportRows() {
    return rows.map((r: any) => {
      const p = (r.profiles as any) ?? {};
      return {
        Date: r.activity_date,
        "Cadre Name": p.full_name ?? "",
        "User ID": p.user_id ?? "",
        "Cadre Type": p.cadre_type ?? "",
        Block: (r.blocks as any)?.name || p.blocks?.name || "",
        Panchayat: r.panchayat ?? "",
        Village: r.village_name,
        "Activity Type": ACT_LABEL[r.activity_type] ?? r.activity_type,
        Beneficiaries: r.beneficiaries ?? 0,
        Status: r.status ?? "",
        "Photo Evidence": r.photo_url ? "Yes" : "No",
        "Photo URL": r.photo_url ?? "",
        "Submitted At": new Date(r.submitted_at).toLocaleString("en-IN"),
      };
    });
  }

  const tableHeaders = ["Date", "Cadre Name", "Block", "Village", "Activity Type", "Beneficiaries", "Status", "Photo"];
  const tableRows = rows.slice(0, 200).map((r: any) => [
    r.activity_date,
    (r.profiles as any)?.full_name ?? "—",
    (r.blocks as any)?.name || (r.profiles as any)?.blocks?.name || "—",
    r.village_name,
    ACT_LABEL[r.activity_type] ?? r.activity_type,
    r.beneficiaries ?? 0,
    r.status ?? "—",
    r.photo_url ? "✓" : "—",
  ]);

  const slug = `activity-report-${fmt(from)}-to-${fmt(to)}`;

  return (
    <ReportPanel
      title="Activity Report"
      from={from} to={to} isLoading={isLoading}
      totalRows={rows.length}
      onExcelExport={() => exportToExcel(buildExportRows(), `${slug}.xlsx`, "Activities")}
      onCsvExport={() => exportCSV(buildExportRows(), `${slug}.csv`)}
      extraFilters={
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-slate-500">Activity Type</Label>
            <Select value={actTypeFilter} onValueChange={setActTypeFilter}>
              <SelectTrigger className="h-9 w-44 rounded-lg border-slate-200 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{ACT_LABEL[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-slate-500">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36 rounded-lg border-slate-200 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-slate-500">Search</Label>
            <div className="relative">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name / Village..." className="h-9 w-44 rounded-lg border-slate-200 text-xs pl-8" />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      }
    >
      <ReportTable
        headers={tableHeaders}
        rows={tableRows}
        footer={rows.length > 200 ? `Showing 200 of ${rows.length}. Use Export for full data.` : undefined}
      />
    </ReportPanel>
  );
}

// ─── CADRE PERFORMANCE REPORT ─────────────────────────────────────────────
function CadrePerformanceReport({ from, to, blockId }: { from: string; to: string; blockId: string | null }) {
  const { t } = useT();
  const [roleFilter, setRoleFilter] = useState("all");

  // Live distinct roles for the dropdown — auto-hides absent roles
  const { data: availableRoles = [] } = useDistinctCadreTypes(blockId);

  // 1. All cadre profiles
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ["rpt-cp-profiles", blockId],
    queryFn: async () => {
      const { data: urData } = await supabase.from("user_roles").select("user_id").eq("role", "cadre");
      const ids = (urData ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      let q = supabase.from("profiles").select("id, full_name, user_id, cadre_type, village, blocks!profiles_block_id_fkey(name)").in("id", ids);
      if (blockId) q = q.eq("block_id", blockId);
      const { data } = await q;
      return data ?? [];
    },
  });

  // 2. Attendance in range
  const { data: attData = [], isLoading: loadingAtt } = useQuery({
    queryKey: ["rpt-cp-att", from, to, blockId],
    queryFn: async () => {
      let q = supabase.from("attendance").select("cadre_id, status, block_id").gte("date", from).lte("date", to);
      if (blockId) {
        const cadreIds = await getCadreIdsInBlock(blockId);
        q = applyScopeToQuery(q, true, blockId, cadreIds);
      }
      const { data } = await q;
      return data ?? [];
    },
  });

  // 3. Activities in range
  const { data: actData = [], isLoading: loadingAct } = useQuery({
    queryKey: ["rpt-cp-act", from, to, blockId],
    queryFn: async () => {
      let q = supabase.from("activities").select("cadre_id, status, village_name, beneficiaries, block_id").gte("activity_date", from).lte("activity_date", to);
      if (blockId) {
        const cadreIds = await getCadreIdsInBlock(blockId);
        q = applyScopeToQuery(q, true, blockId, cadreIds);
      }
      const { data } = await q;
      return data ?? [];
    },
  });

  const isLoading = loadingProfiles || loadingAtt || loadingAct;

  const rows = useMemo(() => {
    return profiles
      .filter((p: any) => roleFilter === "all" || p.cadre_type === roleFilter)
      .map((p: any) => {
        const att = attData.filter((a: any) => a.cadre_id === p.id);
        const acts = actData.filter((a: any) => a.cadre_id === p.id);
        const present = att.filter((a: any) => a.status === "present").length;
        const late    = att.filter((a: any) => a.status === "late").length;
        const absent  = att.filter((a: any) => a.status === "absent").length;
        const leave   = att.filter((a: any) => a.status === "on_leave").length;
        const total   = present + late + absent + leave;
        const attPct  = total > 0 ? (((present + late) / total) * 100).toFixed(1) + "%" : "—";
        const totalActs = acts.length;
        const approved = acts.filter((a: any) => a.status === "Approved").length;
        const pending = acts.filter((a: any) => a.status === "Pending").length;
        const rejected = acts.filter((a: any) => a.status === "Rejected").length;
        const approvalRate = totalActs > 0 ? ((approved / totalActs) * 100).toFixed(1) + "%" : "—";
        const villages = new Set(acts.map((a: any) => a.village_name)).size;
        const beneficiaries = acts.reduce((s: number, a: any) => s + (a.beneficiaries ?? 0), 0);
        return {
          profile: p,
          present, absent, leave, attPct,
          totalActs, approved, pending, rejected, approvalRate,
          villages, beneficiaries,
        };
      });
  }, [profiles, attData, actData, roleFilter]);

  const tableHeaders = ["User ID", "Cadre Name", "Role / Type", "Block", "Present", "Late", "Absent", "Leave", "Att%", "Activities", "Approved", "Pending", "Rejected", "Appr%", "Villages", "Beneficiaries"];
  const tableRows = rows.slice(0, 200).map((r) => [
    r.profile.user_id, r.profile.full_name, ROLE_LABEL_MAP[(r.profile as any).cadre_type] ?? (r.profile as any).cadre_type ?? "—",
    (r.profile.blocks as any)?.name ?? "—",
    r.present, (r as any).late ?? 0, r.absent, r.leave, r.attPct,
    r.totalActs, r.approved, r.pending, r.rejected, r.approvalRate,
    r.villages, r.beneficiaries,
  ]);

  function buildExportRows() {
    return rows.map((r) => ({
      "User ID": r.profile.user_id,
      "Cadre Name": r.profile.full_name,
      "Role / Cadre Type": ROLE_LABEL_MAP[(r.profile as any).cadre_type] ?? (r.profile as any).cadre_type ?? "",
      Block: (r.profile.blocks as any)?.name ?? "",
      Village: r.profile.village ?? "",
      "Present Days": r.present,
      "Late Days": (r as any).late ?? 0,
      "Absent Days": r.absent,
      "Leave Days": r.leave,
      "Attendance %": r.attPct,
      "Total Activities": r.totalActs,
      "Approved": r.approved,
      "Pending": r.pending,
      "Rejected": r.rejected,
      "Approval Rate %": r.approvalRate,
      "Villages Covered": r.villages,
      "Total Beneficiaries": r.beneficiaries,
    }));
  }

  const slug = `cadre-performance-${fmt(from)}-to-${fmt(to)}`;

  return (
    <ReportPanel
      title="Cadre Performance Report"
      from={from} to={to} isLoading={isLoading}
      totalRows={rows.length}
      onExcelExport={() => exportToExcel(buildExportRows(), `${slug}.xlsx`, "Cadre Performance")}
      onCsvExport={() => exportCSV(buildExportRows(), `${slug}.csv`)}
      extraFilters={
        <div className="flex flex-wrap gap-3">
          {/* Role filter — only shows roles that actually exist in the DB */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-slate-500">{t("role_label2")}</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-52 rounded-lg border-slate-200 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_roles_label")}</SelectItem>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL_MAP[r] ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      }
    >
      <ReportTable
        headers={tableHeaders}
        rows={tableRows}
        footer={rows.length > 200 ? `Showing 200 of ${rows.length}. Use Export for full data.` : undefined}
      />
    </ReportPanel>
  );
}

// ─── BLOCK PERFORMANCE REPORT ─────────────────────────────────────────────
function BlockPerformanceReport({ from, to, blockId }: { from: string; to: string; blockId: string | null }) {
  const { data: blocks = [], isLoading: loadingBlocks } = useQuery({
    queryKey: ["blocks", blockId],
    queryFn: async () => {
      let q = supabase.from("blocks").select("id,name").order("name");
      if (blockId) q = q.eq("id", blockId);
      return (await q).data ?? [];
    },
  });

  const { data: attData = [], isLoading: loadingAtt } = useQuery({
    queryKey: ["rpt-bp-att", from, to, blockId],
    queryFn: async () => {
      let q = supabase.from("attendance").select("block_id, cadre_id, status, date").gte("date", from).lte("date", to);
      if (blockId) {
        const cadreIds = await getCadreIdsInBlock(blockId);
        q = applyScopeToQuery(q, true, blockId, cadreIds);
      }
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: actData = [], isLoading: loadingAct } = useQuery({
    queryKey: ["rpt-bp-act", from, to, blockId],
    queryFn: async () => {
      let q = supabase.from("activities").select("block_id, cadre_id, status, village_name, beneficiaries").gte("activity_date", from).lte("activity_date", to);
      if (blockId) {
        const cadreIds = await getCadreIdsInBlock(blockId);
        q = applyScopeToQuery(q, true, blockId, cadreIds);
      }
      const { data } = await q;
      return data ?? [];
    },
  });

  // Cadre counts per block
  const { data: profilesData = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ["rpt-bp-profiles", blockId],
    queryFn: async () => {
      const { data: urData } = await supabase.from("user_roles").select("user_id").eq("role", "cadre");
      const ids = (urData ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      let q = supabase.from("profiles").select("id, block_id").in("id", ids);
      if (blockId) q = q.eq("block_id", blockId);
      const { data } = await q;
      return data ?? [];
    },
  });

  const isLoading = loadingBlocks || loadingAtt || loadingAct || loadingProfiles;

  const rows = useMemo(() => {
    const cadreToBlockMap = new Map(profilesData.map((p: any) => [p.id, p.block_id]));

    return blocks.map((b) => {
      const totalCadres = profilesData.filter((p: any) => p.block_id === b.id).length;
      const bAtt = attData.filter((a: any) => a.block_id === b.id || cadreToBlockMap.get(a.cadre_id) === b.id);
      const bAct = actData.filter((a: any) => a.block_id === b.id || cadreToBlockMap.get(a.cadre_id) === b.id);

      const present = bAtt.filter((a: any) => a.status === "present").length;
      const late    = bAtt.filter((a: any) => a.status === "late").length;
      const absent  = bAtt.filter((a: any) => a.status === "absent").length;
      const total   = present + late + absent;
      const avgAttPct = total > 0 ? (((present + late) / total) * 100).toFixed(1) + "%" : "—";

      const totalActs = bAct.length;
      const approved = bAct.filter((a: any) => a.status === "Approved").length;
      const pending = bAct.filter((a: any) => a.status === "Pending").length;
      const rejected = bAct.filter((a: any) => a.status === "Rejected").length;
      const approvalRate = totalActs > 0 ? ((approved / totalActs) * 100).toFixed(1) + "%" : "—";
      const villages = new Set(bAct.map((a: any) => a.village_name)).size;
      const beneficiaries = bAct.reduce((s: number, a: any) => s + (a.beneficiaries ?? 0), 0);

      return { name: b.name, totalCadres, present, late, absent, avgAttPct, totalActs, approved, pending, rejected, approvalRate, villages, beneficiaries };
    });
  }, [blocks, attData, actData, profilesData]);

  const tableHeaders = ["Block", "Total Cadres", "Present Days", "Late Days", "Absent Days", "Avg Att%", "Activities", "Approved", "Pending", "Rejected", "Appr%", "Villages", "Beneficiaries"];
  const tableRows = rows.map((r) => [r.name, r.totalCadres, r.present, (r as any).late ?? 0, r.absent, r.avgAttPct, r.totalActs, r.approved, r.pending, r.rejected, r.approvalRate, r.villages, r.beneficiaries]);

  function buildExportRows() {
    return rows.map((r) => ({
      "Block": r.name,
      "Total Cadres": r.totalCadres,
      "Total Present Days": r.present,
      "Total Late Days": (r as any).late ?? 0,
      "Total Absent Days": r.absent,
      "Avg Attendance %": r.avgAttPct,
      "Total Activities": r.totalActs,
      "Approved Activities": r.approved,
      "Pending Activities": r.pending,
      "Rejected Activities": r.rejected,
      "Approval Rate %": r.approvalRate,
      "Villages Covered": r.villages,
      "Total Beneficiaries": r.beneficiaries,
    }));
  }

  const slug = `block-performance-${fmt(from)}-to-${fmt(to)}`;

  return (
    <ReportPanel
      title="Block Performance Report"
      from={from} to={to} isLoading={isLoading}
      totalRows={rows.length}
      onExcelExport={() => exportToExcel(buildExportRows(), `${slug}.xlsx`, "Block Performance")}
      onCsvExport={() => exportCSV(buildExportRows(), `${slug}.csv`)}
    >
      <ReportTable headers={tableHeaders} rows={tableRows} />
    </ReportPanel>
  );
}

// ─── REPORT PANEL WRAPPER ─────────────────────────────────────────────────
function ReportPanel({
  title,
  from,
  to,
  isLoading,
  totalRows,
  onExcelExport,
  onCsvExport,
  extraFilters,
  children,
}: {
  title: string;
  from: string;
  to: string;
  isLoading: boolean;
  totalRows: number;
  onExcelExport: () => void;
  onCsvExport: () => void;
  extraFilters?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <h3 className="text-sm font-black text-slate-800">{title}</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            रिपोर्ट अवधि / Report Period: {fmt(from)} — {fmt(to)}
            {totalRows > 0 && !isLoading && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 font-bold">{totalRows} rows</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onCsvExport}
            disabled={isLoading || totalRows === 0}
            className="h-9 rounded-lg text-xs font-bold border-slate-200"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            CSV
          </Button>
          <Button
            size="sm"
            onClick={onExcelExport}
            disabled={isLoading || totalRows === 0}
            className="h-9 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Extra filters */}
      {extraFilters && (
        <div className="border-b border-slate-50 bg-slate-50/50 px-5 py-3">
          {extraFilters}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm font-semibold animate-pulse">
            लोड हो रहा है... / Loading report data...
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ─── LEAVES REPORT ────────────────────────────────────────────────────────
const LEAVE_TYPES = [
  { value: "Casual", labelEn: "Casual Leave", labelHi: "आकस्मिक अवकाश" },
  { value: "Sick", labelEn: "Sick Leave", labelHi: "चिकित्सा अवकाश" },
  { value: "Official", labelEn: "Official Duty", labelHi: "आधिकारिक कार्य" },
  { value: "Training", labelEn: "Training", labelHi: "प्रशिक्षण" },
  { value: "Emergency", labelEn: "Emergency Leave", labelHi: "आपातकालीन अवकाश" },
];

function LeavesReport({ from, to, blockId }: { from: string; to: string; blockId: string | null }) {
  const { lang } = useT();
  const [statusFilter, setStatusFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ["rpt-leaves", from, to, blockId],
    queryFn: async () => {
      let q = supabase
        .from("leave_requests")
        .select(`
          id,
          leave_type,
          from_date,
          to_date,
          total_days,
          reason,
          status,
          approved_by,
          approval_remarks,
          profiles:cadre_id(full_name, cadre_type, village, blocks(name)),
          blocks(name)
        `)
        .gte("from_date", from)
        .lte("to_date", to)
        .order("from_date", { ascending: false })
        .limit(5000);

      if (blockId) {
        q = q.eq("block_id", blockId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-profiles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const staffNameMap = useMemo(() => {
    return new Map(staffList.map((s) => [s.id, s.full_name]));
  }, [staffList]);

  const getLeaveTypeLabel = (val: string) => {
    const found = LEAVE_TYPES.find((l) => l.value === val);
    if (!found) return val;
    return lang === "hi" ? found.labelHi : found.labelEn;
  };

  const rows = useMemo(() => {
    return raw.filter((r: any) => {
      const name: string = r.profiles?.full_name ?? "";
      const s = r.status ?? "";
      const leaveType = r.leave_type ?? "";
      if (statusFilter !== "all" && s !== statusFilter) return false;
      if (leaveTypeFilter !== "all" && leaveType !== leaveTypeFilter) return false;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [raw, statusFilter, leaveTypeFilter, search]);

  const tableHeaders = [
    lang === "hi" ? "तारीख" : "Applied Date",
    lang === "hi" ? "कैडर नाम" : "Cadre Name",
    lang === "hi" ? "कैडर प्रकार" : "Cadre Type",
    lang === "hi" ? "ब्लॉक" : "Block",
    lang === "hi" ? "अवकाश प्रकार" : "Leave Type",
    lang === "hi" ? "कब से" : "From Date",
    lang === "hi" ? "कब तक" : "To Date",
    lang === "hi" ? "कुल दिन" : "Total Days",
    lang === "hi" ? "स्थिति" : "Status",
    lang === "hi" ? "कारण" : "Reason",
    lang === "hi" ? "समीक्षक" : "Reviewed By",
    lang === "hi" ? "टिप्पणी" : "Remarks"
  ];

  const tableRows = rows.slice(0, 200).map((r: any) => {
    const p = r.profiles ?? {};
    const reviewerName = r.approved_by ? (staffNameMap.get(r.approved_by) ?? "Staff") : "—";
    const dateStr = new Date(r.from_date).toLocaleDateString();
    return [
      dateStr,
      p.full_name ?? "—",
      p.cadre_type ?? "—",
      r.blocks?.name ?? p.blocks?.name ?? "—",
      getLeaveTypeLabel(r.leave_type),
      r.from_date,
      r.to_date,
      r.total_days,
      r.status,
      r.reason ?? "—",
      reviewerName,
      r.approval_remarks ?? "—"
    ];
  });

  function buildExportRows() {
    return rows.map((r: any) => {
      const p = r.profiles ?? {};
      const reviewerName = r.approved_by ? (staffNameMap.get(r.approved_by) ?? "Staff") : "";
      return {
        "Applied Date": new Date(r.from_date).toLocaleDateString(),
        "Cadre Name": p.full_name ?? "",
        "Cadre Type": p.cadre_type ?? "",
        "Block": r.blocks?.name ?? p.blocks?.name ?? "",
        "Leave Type": getLeaveTypeLabel(r.leave_type),
        "From Date": r.from_date,
        "To Date": r.to_date,
        "Total Days": r.total_days,
        "Status": r.status,
        "Reason": r.reason ?? "",
        "Reviewed By": reviewerName,
        "Remarks": r.approval_remarks ?? "",
      };
    });
  }

  const slug = `leaves-report-${fmt(from)}-to-${fmt(to)}`;

  return (
    <ReportPanel
      title={lang === "hi" ? "अवकाश रिपोर्ट" : "Leave Report"}
      from={from} to={to} isLoading={isLoading}
      totalRows={rows.length}
      onExcelExport={() => exportToExcel(buildExportRows(), `${slug}.xlsx`, "Leaves")}
      onCsvExport={() => exportCSV(buildExportRows(), `${slug}.csv`)}
      extraFilters={
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-slate-500">{lang === "hi" ? "स्थिति" : "Status"}</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-40 rounded-lg border-slate-200 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "hi" ? "सभी स्थितियां" : "All Statuses"}</SelectItem>
                <SelectItem value="pending">{lang === "hi" ? "लंबित" : "Pending"}</SelectItem>
                <SelectItem value="approved">{lang === "hi" ? "स्वीकृत" : "Approved"}</SelectItem>
                <SelectItem value="rejected">{lang === "hi" ? "अस्वीकृत" : "Rejected"}</SelectItem>
                <SelectItem value="cancelled">{lang === "hi" ? "रद्द" : "Cancelled"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-slate-500">{lang === "hi" ? "अवकाश प्रकार" : "Leave Type"}</Label>
            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger className="h-9 w-48 rounded-lg border-slate-200 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "hi" ? "सभी अवकाश प्रकार" : "All Leave Types"}</SelectItem>
                {LEAVE_TYPES.map((lt) => (
                  <SelectItem key={lt.value} value={lt.value}>
                    {lang === "hi" ? lt.labelHi : lt.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-slate-500">{lang === "hi" ? "कैडर खोजें" : "Search Cadre"}</Label>
            <div className="relative">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === "hi" ? "नाम..." : "Name..."} className="h-9 w-44 rounded-lg border-slate-200 text-xs pl-8" />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      }
    >
      <ReportTable
        headers={tableHeaders}
        rows={tableRows}
        footer={rows.length > 200 ? `Showing 200 of ${rows.length}. Use Export for full data.` : undefined}
      />
    </ReportPanel>
  );
}
