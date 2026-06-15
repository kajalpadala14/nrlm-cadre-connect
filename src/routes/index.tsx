import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Users,
  UserCheck,
  ClipboardList,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  LogIn,
  Globe,
  Shield,
  Smartphone,
  BarChart2,
  ArrowRight,
  Award,
  Leaf,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NRLM Cadre Monitoring System — Dantewada" },
      {
        name: "description",
        content:
          "District Monitoring & Reporting Portal — Real-time public statistics for NRLM Dantewada cadre activities, attendance, and village coverage.",
      },
    ],
  }),
  component: PublicIndex,
});

// ── helpers ────────────────────────────────────────────────────────────────
function last30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function last7Labels(): string[] {
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }));
  }
  return labels;
}

// ── sub-components ─────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function StatCard({
  icon: Icon,
  label,
  labelHi,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  labelHi: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">{labelHi}</p>
          <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide mt-0.5">{label}</p>
          <h3 className="text-2xl font-black text-slate-800 mt-2 tabular-nums">{value}</h3>
          {sub && <p className="text-[10px] text-slate-400 font-semibold mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────
function PublicIndex() {
  // No session check needed — public page is always shown as-is.
  // The Login to Dashboard button always goes to /auth.
  // After login, /auth redirects to /home automatically.

  // ── public stats ──────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["public-dashboard-stats"],
    queryFn: async () => {
      const { count: totalCadres } = await supabase
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "cadre");

      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceStr = since.toISOString().slice(0, 10);
      const { data: activeRows } = await supabase
        .from("attendance")
        .select("cadre_id")
        .eq("status", "present")
        .gte("date", sinceStr);
      const activeCadres = new Set((activeRows ?? []).map((r) => r.cadre_id)).size;

      const { count: totalActivities } = await supabase
        .from("activities")
        .select("id", { count: "exact", head: true });

      const { data: villageRows } = await supabase.from("activities").select("village_name");
      const villagesCovered = new Set((villageRows ?? []).map((r) => r.village_name)).size;

      const { count: approvedActivities } = await supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .eq("status", "Approved");

      const { count: totalAttRecords } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true });
      const { count: presentRecords } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("status", "present");
      const attendanceRate =
        totalAttRecords && totalAttRecords > 0
          ? Math.round(((presentRecords ?? 0) / totalAttRecords) * 100)
          : 0;

      return {
        totalCadres: totalCadres ?? 0,
        activeCadres,
        totalActivities: totalActivities ?? 0,
        villagesCovered,
        approvedActivities: approvedActivities ?? 0,
        attendanceRate,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── block performance ─────────────────────────────────────────────────
  const { data: blockData, isLoading: blockLoading } = useQuery({
    queryKey: ["public-block-performance"],
    queryFn: async () => {
      const { data: blocks } = await supabase.from("blocks").select("id, name").order("name");
      const { data: activities } = await supabase.from("activities").select("block_id, status");
      const { data: cadreRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "cadre");
      const cadreIds = (cadreRoles ?? []).map((r) => r.user_id);

      let profiles: { id: string; block_id: string | null }[] = [];
      if (cadreIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, block_id")
          .in("id", cadreIds);
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
          pending,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── activity trend ─────────────────────────────────────────────────────
  const { data: activityTrendData, isLoading: trendLoading } = useQuery({
    queryKey: ["public-activity-trend"],
    queryFn: async () => {
      const days = last30Days();
      const { data: acts } = await supabase
        .from("activities")
        .select("activity_date, status")
        .gte("activity_date", days[0])
        .lte("activity_date", days[days.length - 1]);

      const buckets: { label: string; total: number; approved: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const start = days[i * 5];
        const end = days[Math.min(i * 5 + 4, 29)];
        const label = new Date(start).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        const slice = (acts ?? []).filter(
          (a) => a.activity_date >= start && a.activity_date <= end,
        );
        buckets.push({
          label,
          total: slice.length,
          approved: slice.filter((a) => a.status === "Approved").length,
        });
      }
      return buckets;
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── attendance trend ───────────────────────────────────────────────────
  const { data: attendanceTrendData, isLoading: attTrendLoading } = useQuery({
    queryKey: ["public-attendance-trend"],
    queryFn: async () => {
      const days = last30Days().slice(-7);
      const labels = last7Labels();
      const { data: attRows } = await supabase
        .from("attendance")
        .select("date, status")
        .gte("date", days[0]);

      return days.map((day, i) => {
        const dayRows = (attRows ?? []).filter((r) => r.date === day);
        return {
          label: labels[i],
          present: dayRows.filter((r) => r.status === "present").length,
          absent: dayRows.filter((r) => r.status === "absent").length,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── inline hero stats for the summary strip ───────────────────────────
  const heroStats = [
    { value: statsLoading ? "—" : (stats?.totalActivities ?? 0), label: "Activities Tracked" },
    { value: statsLoading ? "—" : (stats?.totalCadres ?? 0), label: "Cadres Deployed" },
    { value: statsLoading ? "—" : (stats?.villagesCovered ?? 0), label: "Villages Reached" },
    { value: statsLoading ? "—" : `${stats?.attendanceRate ?? 0}%`, label: "Attendance Rate" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">

      {/* ════════════════════════════════════════════════════════════════
          STICKY HEADER
      ════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0055A4] text-white font-black text-sm shadow">
              N
            </div>
            <div className="leading-none">
              <p className="text-sm font-black text-slate-800 tracking-tight">NRLM Cadre Connect</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Dantewada · Chhattisgarh
              </p>
            </div>
          </div>

          {/* Right side — login button, always goes to /auth */}
          <div className="flex items-center gap-2">
            {/* "Live" pill */}
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>

            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0055A4] px-4 py-2 text-xs font-black text-white shadow hover:bg-[#004494] transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
          HERO — title + description + dual CTAs + live stats strip
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,85,164,0.08),transparent)]"
        />

        <div className="mx-auto max-w-7xl px-4 pt-14 pb-12 sm:px-6 flex flex-col items-center text-center gap-5">

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            District Monitoring &amp; Reporting Portal
          </span>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight max-w-3xl leading-tight">
            NRLM Cadre
            <br />
            <span className="text-[#0055A4]">Monitoring System</span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-500 font-semibold max-w-2xl leading-relaxed">
            Real-time field activity tracking and attendance monitoring for PRP, FLCRP, RBK, IFC
            Anchor, and SR·CRP cadres across 4 blocks of Dantewada district — Dantewada, Geedam, Kuakonda, Katekalyan.
          </p>
          <p className="text-xs text-slate-400 font-semibold -mt-1">
            जिला दंतेवाड़ा — राष्ट्रीय ग्रामीण आजीविका मिशन · Chhattisgarh
          </p>

          {/* ── CTA BUTTONS ── */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0055A4] px-6 py-3 text-sm font-black text-white shadow-md hover:bg-[#004494] transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Login to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Scroll-to-stats anchor */}
            <a
              href="#public-statistics"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <BarChart2 className="h-4 w-4 text-slate-500" />
              View Public Statistics
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </a>
          </div>

          {/* ── LIVE SUMMARY STRIP ── */}
          <div
            id="public-statistics"
            className="mt-6 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {heroStats.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm p-4 shadow-sm text-center"
              >
                <p className="text-2xl font-black text-[#0055A4] tabular-nums">
                  {statsLoading ? <Skeleton className="h-7 w-14 mx-auto" /> : value}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TOP LOGIN CTA STRIP
      ════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-6 py-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-black text-slate-800">NRLM Staff?</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Block officers and cadres must log in to submit reports, approve activities, and track attendance.
            </p>
          </div>
          <Link
            to="/auth"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#0055A4] px-5 py-2.5 text-sm font-black text-white shadow hover:bg-[#004494] transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Login to Dashboard
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          KPI STATS GRID
      ════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
            Live Statistics
          </h2>
          <span className="text-[10px] font-semibold text-slate-400">— all-time programme data</span>
        </div>
        {statsLoading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={Users} label="Total Cadres" labelHi="कुल कैडर" value={stats?.totalCadres ?? 0} sub="Registered across all blocks" color="bg-blue-50 text-blue-600" />
            <StatCard icon={UserCheck} label="Active Cadres" labelHi="सक्रिय कैडर" value={stats?.activeCadres ?? 0} sub="Present in last 30 days" color="bg-emerald-50 text-emerald-600" />
            <StatCard icon={ClipboardList} label="Total Activities" labelHi="कुल गतिविधियाँ" value={stats?.totalActivities ?? 0} sub="All time submissions" color="bg-violet-50 text-violet-600" />
            <StatCard icon={MapPin} label="Villages Covered" labelHi="गाँव कवरेज" value={stats?.villagesCovered ?? 0} sub="Unique villages reached" color="bg-orange-50 text-orange-600" />
            <StatCard icon={CalendarCheck} label="Attendance Rate" labelHi="उपस्थिति दर" value={`${stats?.attendanceRate ?? 0}%`} sub="Overall present rate" color="bg-teal-50 text-teal-600" />
            <StatCard icon={CheckCircle2} label="Approved Activities" labelHi="स्वीकृत गतिविधियाँ" value={stats?.approvedActivities ?? 0} sub="Verified by block officers" color="bg-rose-50 text-rose-600" />
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CHARTS
      ════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Charts & Trends</h2>
          <span className="text-[10px] font-semibold text-slate-400">— last 30 days</span>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Block Performance */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-800">Block Performance</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5 mb-4">
              ब्लॉक-वार गतिविधि / Activities per block
            </p>
            {blockLoading ? <Skeleton className="h-52 w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={blockData ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 4 }} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    formatter={(value, name) => [value, name === "activities" ? "Total" : name === "approved" ? "Approved" : String(name)]}
                    labelFormatter={(label: string) => label}
                  />
                  <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} formatter={(value) => value === "activities" ? "Total" : value === "approved" ? "Approved" : value} />
                  <Bar dataKey="activities" fill="#0055A4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Activity Trend */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-800">Activity Trend</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5 mb-4">
              गतिविधि ट्रेंड / Last 30 days
            </p>
            {trendLoading ? <Skeleton className="h-52 w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={activityTrendData ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                  <defs>
                    <linearGradient id="pub-totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0055A4" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0055A4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pub-approvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                  <Area type="monotone" dataKey="total" stroke="#0055A4" strokeWidth={2} fill="url(#pub-totalGrad)" name="Total" />
                  <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} fill="url(#pub-approvedGrad)" name="Approved" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Attendance Trend */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-800">Attendance Trend</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5 mb-4">
              उपस्थिति ट्रेंड / Last 7 days
            </p>
            {attTrendLoading ? <Skeleton className="h-52 w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={attendanceTrendData ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 4 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                  <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present" />
                  <Bar dataKey="absent" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          DISTRICT OVERVIEW
      ════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">District Overview</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Info table */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Globe className="h-4 w-4 text-[#0055A4]" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                Programme Details
              </h3>
            </div>
            <div className="space-y-3 text-xs font-semibold">
              {[
                { label: "State / राज्य", value: "Chhattisgarh" },
                { label: "District / जिला", value: "Dantewada" },
                { label: "Mission / मिशन", value: "NRLM — Deen Dayal Upadhyaya" },
                { label: "Programme Focus", value: "Rural Livelihood & Women Empowerment" },
                { label: "Blocks Covered / ब्लॉक", value: "4 Blocks (Dantewada, Geedam, Kuakonda, Katekalyan)" },
                { label: "Cadre Types", value: "PRP · FLCRP · RBK · IFC Anchor · SR·CRP" },
                { label: "Field Activities Tracked", value: "SHG Meeting · Farmer Visit · Training · Monitoring · Livelihood" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-slate-400 shrink-0">{label}</span>
                  <span className="text-slate-800 font-bold text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Block table */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 className="h-4 w-4 text-[#0055A4]" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                Block-wise Summary
              </h3>
            </div>
            {blockLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-semibold">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-2 text-left">Block</th>
                      <th className="pb-2 text-center">Cadres</th>
                      <th className="pb-2 text-center">Activities</th>
                      <th className="pb-2 text-center">Approved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(blockData ?? []).map((b, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 font-bold text-slate-700">{b.fullName}</td>
                        <td className="py-2.5 text-center text-slate-600">{b.cadres}</td>
                        <td className="py-2.5 text-center text-slate-600">{b.activities}</td>
                        <td className="py-2.5 text-center">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            {b.approved}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(blockData ?? []).length === 0 && (
                      <tr><td colSpan={4} className="py-6 text-center text-slate-400 italic">No block data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          ABOUT NRLM
      ════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Award className="h-4 w-4 text-[#0055A4]" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">About NRLM</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Leaf, title: "Mission / मिशन", desc: "The National Rural Livelihoods Mission (NRLM) aims to reduce rural poverty by enabling poor households to access gainful self-employment and skilled wage employment.", color: "bg-emerald-50 text-emerald-600" },
              { icon: Users, title: "SHG Network / SHG नेटवर्क", desc: "NRLM builds strong networks of Self Help Groups (SHGs), Village Organisations (VOs), and Cluster Level Federations (CLFs) to empower rural women.", color: "bg-blue-50 text-blue-600" },
              { icon: Smartphone, title: "Digital Tracking / डिजिटल ट्रैकिंग", desc: "This system enables real-time GPS-verified activity reporting by field cadres, ensuring transparency and accountability at the grassroots level.", color: "bg-violet-50 text-violet-600" },
              { icon: Shield, title: "Accountability / जवाबदेही", desc: "Every activity is photo-geotagged, timestamped, and goes through a two-level verification workflow before being marked as approved.", color: "bg-orange-50 text-orange-600" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 mb-1">{title}</h3>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          BOTTOM LOGIN CTA BANNER
      ════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#0055A4] to-blue-600 p-8 md:p-10 text-white text-center shadow-lg">
          <p className="text-[11px] font-black text-blue-200 uppercase tracking-widest mb-2">
            Ready to access the system?
          </p>
          <h2 className="text-xl sm:text-2xl font-black mb-3">
            NRLM Cadre Monitoring System
          </h2>
          <p className="text-sm text-blue-100 font-semibold mb-7 max-w-md mx-auto">
            Login is required to submit activity reports, view approvals, and track attendance.
            Public statistics above are available without login.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#0055A4] px-7 py-3 text-sm font-black shadow hover:bg-blue-50 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Login to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-100 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 font-semibold">
            © {new Date().getFullYear()} NRLM Cadre Connect — Dantewada, Chhattisgarh
          </p>
          <p className="text-[11px] text-slate-400 font-semibold text-center sm:text-right">
            राष्ट्रीय ग्रामीण आजीविका मिशन · Ministry of Rural Development, Government of India
          </p>
        </div>
      </footer>
    </div>
  );
}
