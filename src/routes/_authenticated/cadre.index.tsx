/**
 * cadre.index.tsx — Cadre Home Dashboard
 * Renders at /cadre (index route of the cadre layout)
 *
 * UAT AUDIT FIXES APPLIED:
 * 1. attendance.remarks used (not rejection_reason)
 * 2. attendance_status enum: present|absent|on_leave|holiday|pending_verification
 * 3. profile_photo_url column exists and is used
 * 4. notifications table is fully typed
 * 5. Recent activities: dedicated last-5 query
 * 6. Photo evidence count from todayActivities
 * 7. Attendance %: presentDays / elapsedDays
 * 8. 7-day trend chart from live Supabase data
 * 9. Pending actions from attendance.status === 'absent'
 * 10. All data 100% live from Supabase
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  History,
  User,
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Users,
  MapPin,
  TrendingUp,
  Camera,
  FileWarning,
  RotateCcw,
  CalendarDays,
  Activity,
  BadgeCheck,
  Hourglass,
  ThumbsDown,
  ArrowRight,
  BarChart2,
  ImageOff,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useActivityCacheSync } from "@/hooks/use-activity-cache-sync";
import { uniqueVillageCount } from "@/lib/utils/villages";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/_authenticated/cadre/")({
  component: CadreDashboard,
});

// ─── Date helpers ─────────────────────────────────────────────────────────
function getDateStrings() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const todayStr = `${year}-${pad(month)}-${pad(day)}`;
  const firstDayStr = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const lastDayStr = `${year}-${pad(month)}-${pad(lastDay)}`;
  const last7: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(d);
    dt.setDate(d.getDate() - i);
    last7.push(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`);
  }
  const elapsedDays = day;
  return { todayStr, firstDayStr, lastDayStr, last7, elapsedDays };
}

// ─── Reusable components ──────────────────────────────────────────────────
function StatTile({
  label, value, color, icon, sub,
}: {
  label: string; value: string | number;
  color: "blue" | "emerald" | "amber" | "rose" | "purple" | "teal" | "orange";
  icon: React.ReactNode; sub?: string;
}) {
  const styles: Record<string, string> = {
    blue:    "bg-blue-50   text-blue-700   border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber:   "bg-amber-50  text-amber-700  border-amber-100",
    rose:    "bg-rose-50   text-rose-700   border-rose-100",
    purple:  "bg-purple-50 text-purple-700 border-purple-100",
    teal:    "bg-teal-50   text-teal-700   border-teal-100",
    orange:  "bg-orange-50 text-orange-700 border-orange-100",
  };
  return (
    <div className={cn("rounded-2xl border p-4 flex flex-col gap-2 shadow-sm", styles[color])}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider opacity-70 leading-tight">{label}</span>
        <span className="opacity-50 shrink-0">{icon}</span>
      </div>
      <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      {sub && <p className="text-[9px] text-slate-400 font-semibold uppercase">{sub}</p>}
    </div>
  );
}

function SectionHeading({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
      {icon && <span className="text-slate-400">{icon}</span>}
      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{title}</h3>
    </div>
  );
}

function SkeletonTile() {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 h-24 animate-pulse" />;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────
function CadreDashboard() {
  const { t, lang } = useT();
  const { data: profile } = useProfile();
  useActivityCacheSync();
  const { todayStr, firstDayStr, lastDayStr, last7, elapsedDays } = getDateStrings();

  const { data: todayAttendance, isLoading: loadingTodayAtt } = useQuery({
    queryKey: ["cadre-today-attendance", profile?.id, todayStr],
    enabled: !!profile,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("id, status, remarks")
        .eq("cadre_id", profile!.id)
        .eq("date", todayStr)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: todayActivities = [], isLoading: loadingToday } = useQuery({
    queryKey: ["cadre-today-activities", profile?.id, todayStr],
    enabled: !!profile,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("id, village_name, beneficiaries, status, photo_url, activity_type, activity_date, submitted_at")
        .eq("cadre_id", profile!.id)
        .eq("activity_date", todayStr)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: monthActivities = [], isLoading: loadingMonth } = useQuery({
    queryKey: ["cadre-month-activities", profile?.id, firstDayStr, lastDayStr],
    enabled: !!profile,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("id, village_name, beneficiaries, status, photo_url, activity_type, activity_date, submitted_at")
        .eq("cadre_id", profile!.id)
        .gte("activity_date", firstDayStr)
        .lte("activity_date", lastDayStr)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: monthAttendance = [], isLoading: loadingMonthAtt } = useQuery({
    queryKey: ["cadre-month-attendance", profile?.id, firstDayStr, lastDayStr],
    enabled: !!profile,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("status, date")
        .eq("cadre_id", profile!.id)
        .gte("date", firstDayStr)
        .lte("date", lastDayStr)
        .order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: recentActivities = [], isLoading: loadingRecent } = useQuery({
    queryKey: ["cadre-recent-5", profile?.id],
    enabled: !!profile,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("id, village_name, beneficiaries, status, photo_url, activity_type, activity_date, submitted_at")
        .eq("cadre_id", profile!.id)
        .order("submitted_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: last7Activities = [], isLoading: loadingTrend } = useQuery({
    queryKey: ["cadre-last7-trend", profile?.id, last7[0], last7[6]],
    enabled: !!profile,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("activity_date")
        .eq("cadre_id", profile!.id)
        .gte("activity_date", last7[0])
        .lte("activity_date", last7[6]);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ["cadre-notifications", profile?.id],
    enabled: !!profile,
    staleTime: 30_000,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("id, title, message, type, created_at, read")
          .eq("user_id", profile!.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) return [];
        return (data ?? []).filter((n) => !n.read);
      } catch { return []; }
    },
  });

  const absentDaysThisMonth = useMemo(
    () => monthAttendance.filter((a) => a.status === "absent").length,
    [monthAttendance],
  );

  const todaySummary = useMemo(() => ({
    activities:    todayActivities.length,
    villages:      uniqueVillageCount(todayActivities, (a) => a.village_name),
    beneficiaries: todayActivities.reduce((s, a) => s + (a.beneficiaries ?? 0), 0),
    withPhoto:     todayActivities.filter((a) => !!a.photo_url).length,
  }), [todayActivities]);

  const monthlySummary = useMemo(() => {
    const totalActs     = monthActivities.length;
    const villages      = uniqueVillageCount(monthActivities, (a) => a.village_name);
    const beneficiaries = monthActivities.reduce((s, a) => s + (a.beneficiaries ?? 0), 0);
    const approved      = monthActivities.filter((a) => a.status === "Approved").length;
    const pending       = monthActivities.filter((a) => a.status === "Pending").length;
    const rejected      = monthActivities.filter((a) => a.status === "Rejected").length;
    const presentDays   = monthAttendance.filter((a) => a.status === "present").length;
    const attendancePct = elapsedDays > 0 ? ((presentDays / elapsedDays) * 100).toFixed(1) : "0.0";
    const approvedPct   = totalActs > 0 ? ((approved / totalActs) * 100).toFixed(0) : "0";
    const pendingPct    = totalActs > 0 ? ((pending  / totalActs) * 100).toFixed(0) : "0";
    const rejectedPct   = totalActs > 0 ? ((rejected / totalActs) * 100).toFixed(0) : "0";
    return { totalActs, villages, beneficiaries, approved, pending, rejected, attendancePct, approvedPct, pendingPct, rejectedPct, presentDays };
  }, [monthActivities, monthAttendance, elapsedDays]);

  const pendingActions = useMemo(() => ({
    missingPhoto: monthActivities.filter((a) => !a.photo_url).length,
    absentDays:   absentDaysThisMonth,
    rejectedActs: monthActivities.filter((a) => a.status === "Rejected").length,
  }), [monthActivities, absentDaysThisMonth]);

  const hasPendingActions = pendingActions.missingPhoto > 0 || pendingActions.absentDays > 0 || pendingActions.rejectedActs > 0;

  const trendData = useMemo(() => {
    const countMap: Record<string, number> = {};
    last7.forEach((d) => (countMap[d] = 0));
    last7Activities.forEach((a) => {
      if (countMap[a.activity_date] !== undefined) countMap[a.activity_date]++;
    });
    return last7.map((d) => ({ date: d.slice(5), count: countMap[d] }));
  }, [last7Activities, last7]);

  const markAsRead = async (id: string) => {
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
      refetchNotifications();
    } catch { /* silent */ }
  };

  const typeLabel = (type: string) =>
    t(`act.${type}` as any) !== `act.${type}` ? t(`act.${type}` as any) : type.replace(/_/g, " ");

  const notifIcon = (type: string) => {
    if (type?.includes("approved") || type?.includes("Approved")) return "✅";
    if (type?.includes("rejected") || type?.includes("Rejected")) return "❌";
    if (type?.includes("attendance")) return "📋";
    return "🔔";
  };

  const isLoading = loadingToday || loadingMonth || loadingTodayAtt;

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-10">

      {/* ══ Welcome Header ════════════════════════════════════════════════ */}
      <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xl shadow-md overflow-hidden">
          {profile?.profile_photo_url ? (
            <img src={profile.profile_photo_url} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            profile?.full_name?.[0]?.toUpperCase() ?? "C"
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("welcome")}</p>
          <h2 className="text-lg font-black text-slate-800 tracking-tight mt-0.5 truncate">{profile?.full_name}</h2>
          {profile?.cadre_type && (
            <p className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wide">
              {t(`ct.${profile.cadre_type}` as any)} · {profile?.user_id}
            </p>
          )}
        </div>
        <div className="ml-auto shrink-0">
          {loadingTodayAtt ? (
            <div className="h-7 w-24 rounded-full bg-slate-100 animate-pulse" />
          ) : todayAttendance?.status === "present" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-wide">
              <CheckCircle2 className="h-3.5 w-3.5" /> Present
            </span>
          ) : todayAttendance?.status === "absent" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1.5 text-[10px] font-black text-rose-700 uppercase tracking-wide">
              <XCircle className="h-3.5 w-3.5" /> Absent
            </span>
          ) : todayAttendance?.status === "on_leave" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-[10px] font-black text-blue-700 uppercase tracking-wide">
              <Clock className="h-3.5 w-3.5" /> On Leave
            </span>
          ) : todayAttendance?.status === "holiday" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1.5 text-[10px] font-black text-purple-700 uppercase tracking-wide">
              <CalendarDays className="h-3.5 w-3.5" /> Holiday
            </span>
          ) : todayAttendance?.status === "pending_verification" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-[10px] font-black text-amber-700 uppercase tracking-wide">
              <Clock className="h-3.5 w-3.5" /> Pending
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wide">
              <AlertTriangle className="h-3.5 w-3.5" /> Not Marked
            </span>
          )}
        </div>
      </div>

      {todayAttendance?.status === "absent" && todayAttendance.remarks && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-bold text-slate-700 shadow-sm">
          <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-rose-900 font-extrabold">{t("marked_absent")}</p>
            <p className="text-slate-600 mt-1">{todayAttendance.remarks}</p>
          </div>
        </div>
      )}

      {/* ══ Quick Actions ════════════════════════════════════════════════ */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <BigButton to="/cadre/submit"          icon={<ClipboardList className="h-6 w-6 text-white" />} label={t("submit_work")} subLabel={t("submit_work")}   tone="primary"   />
        <BigButton to="/cadre/history"         icon={<History       className="h-6 w-6 text-white" />} label={t("work_history")}   subLabel={t("work_history")}       tone="secondary" />
        <BigButton to="/cadre/profile"         icon={<User          className="h-6 w-6 text-white" />} label={t("profile_settings")}       subLabel={t("profile_settings")}  tone="accent"    />
        <BigButton to="/cadre/help?raise=true" icon={<HelpCircle   className="h-6 w-6 text-white" />} label={t("raise_support")}         subLabel={t("raise_support")} tone="help"      />
      </div>

      {/* ══ Today's Summary ══════════════════════════════════════════════ */}
      <div className="space-y-3">
        <SectionHeading title={`${t("today_summary")} — ${todayStr}`} icon={<Activity className="h-4 w-4" />} />
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <SkeletonTile key={i} />)}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile label={t("today_activities")}    value={todaySummary.activities}    color="blue"   icon={<Activity className="h-4 w-4" />}     sub="गतिविधियाँ" />
            <StatTile label={t("today_villages")}    value={todaySummary.villages}      color="teal"   icon={<MapPin   className="h-4 w-4" />}     sub="गाँव कवर" />
            <StatTile label={t("today_beneficiaries")} value={todaySummary.beneficiaries} color="purple" icon={<Users    className="h-4 w-4" />}     sub="लाभार्थी" />
            <StatTile label={t("today_photos")}     value={todaySummary.withPhoto}     color="orange" icon={<Camera  className="h-4 w-4" />}     sub="फ़ोटो साक्ष्य" />
          </div>
        )}
      </div>

      {/* ══ Monthly Summary ══════════════════════════════════════════════ */}
      <div className="space-y-3">
        <SectionHeading title={t("monthly_summary")} icon={<CalendarDays className="h-4 w-4" />} />
        {loadingMonth || loadingMonthAtt ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <SkeletonTile key={i} />)}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile label={t("monthly_total")} value={monthlySummary.totalActs}     color="blue"    icon={<ClipboardList className="h-4 w-4" />} sub="कुल गतिविधियाँ" />
            <StatTile label={t("monthly_villages")} value={monthlySummary.villages}      color="teal"    icon={<MapPin        className="h-4 w-4" />} sub="अनोखे गाँव" />
            <StatTile label={t("monthly_beneficiaries")}    value={monthlySummary.beneficiaries} color="purple"  icon={<Users         className="h-4 w-4" />} sub="कुल लाभार्थी" />
            <StatTile label={t("attendance_pct")}     value={`${monthlySummary.attendancePct}%`} color="emerald" icon={<TrendingUp className="h-4 w-4" />} sub={`${monthlySummary.presentDays} / ${elapsedDays} days`} />
          </div>
        )}
      </div>

      {/* ══ Recent Activities + Quick Stats ══════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <SectionHeading title={t("recent_activities_heading")} icon={<History className="h-4 w-4" />} />
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            {loadingRecent ? (
              <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-50 animate-pulse" />)}</div>
            ) : recentActivities.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-semibold">{t("no_activities_found")}</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentActivities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3.5 hover:bg-slate-50/50 transition-colors">
                    <div className="h-10 w-14 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                      {a.photo_url ? (
                        <img src={a.photo_url} alt="evidence" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><ImageOff className="h-4 w-4 text-slate-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{typeLabel(a.activity_type)}</p>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />{a.village_name}<span className="mx-1">·</span>{a.activity_date}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">👥 {a.beneficiaries ?? 0} beneficiaries</p>
                    </div>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide shrink-0",
                      a.status === "Pending"  && "bg-amber-50 text-amber-700",
                      a.status === "Approved" && "bg-emerald-50 text-emerald-700",
                      a.status === "Rejected" && "bg-rose-50 text-rose-700",
                      !a.status              && "bg-slate-50 text-slate-400",
                    )}>{a.status ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-slate-50 px-4 py-2.5">
              <Link to="/cadre/history" className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider">
                {t("view_full_history")} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeading title={t("quick_stats")} icon={<BarChart2 className="h-4 w-4" />} />
          <div className="space-y-3">
            {[
              { label: "Approved", value: monthlySummary.approved, pct: monthlySummary.approvedPct, color: "emerald", icon: <BadgeCheck className="h-6 w-6 text-emerald-600" />, sub: "स्वीकृत", barColor: "bg-emerald-400", border: "border-emerald-100" },
              { label: "Pending",  value: monthlySummary.pending,  pct: monthlySummary.pendingPct,  color: "amber",   icon: <Hourglass  className="h-6 w-6 text-amber-600"   />, sub: "लंबित",    barColor: "bg-amber-400",   border: "border-amber-100"   },
              { label: "Rejected", value: monthlySummary.rejected, pct: monthlySummary.rejectedPct, color: "rose",    icon: <ThumbsDown className="h-6 w-6 text-rose-600"    />, sub: "अस्वीकृत", barColor: "bg-rose-400",     border: "border-rose-100"    },
            ].map((s) => (
              <div key={s.label} className={cn("bg-white border rounded-2xl p-4 shadow-sm", s.border)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn("text-[10px] font-black uppercase tracking-wide", `text-${s.color}-600`)}>{s.label}</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{s.value}</p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-1">{s.sub} · {s.pct}% of total</p>
                  </div>
                  <div className={cn("h-11 w-11 flex items-center justify-center rounded-xl", `bg-${s.color}-50`)}>{s.icon}</div>
                </div>
                <div className={cn("mt-3 h-1.5 rounded-full overflow-hidden", `bg-${s.color}-50`)}>
                  <div className={cn("h-full rounded-full transition-all", s.barColor)} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Pending Actions ══════════════════════════════════════════════ */}
      {hasPendingActions && (
        <div className="space-y-3">
          <SectionHeading title={t("pending_actions")} icon={<AlertTriangle className="h-4 w-4" />} />
          <div className="grid gap-3 sm:grid-cols-3">
            {pendingActions.missingPhoto > 0 && (
              <Link to="/cadre/history" className="bg-white border border-orange-100 hover:border-orange-300 rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-all hover:shadow-md">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-orange-50"><Camera className="h-5 w-5 text-orange-500" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800">{t("missing_photo")}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t("missing_photo")}</p>
                  <span className="inline-block mt-2 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5">{pendingActions.missingPhoto} activities</span>
                </div>
              </Link>
            )}
            {pendingActions.absentDays > 0 && (
              <Link to="/cadre/history" className="bg-white border border-rose-100 hover:border-rose-300 rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-all hover:shadow-md">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-rose-50"><FileWarning className="h-5 w-5 text-rose-500" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800">{t("absent_days")}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t("absent_days")}</p>
                  <span className="inline-block mt-2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5">{pendingActions.absentDays} days</span>
                </div>
              </Link>
            )}
            {pendingActions.rejectedActs > 0 && (
              <Link to="/cadre/history" className="bg-white border border-amber-100 hover:border-amber-300 rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-all hover:shadow-md">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-amber-50"><RotateCcw className="h-5 w-5 text-amber-500" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800">{t("rejected_acts")}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">अस्वीकृत गतिविधियाँ देखें</p>
                  <span className="inline-block mt-2 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5">{pendingActions.rejectedActs} activities</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ══ 7-Day Activity Trend Chart ════════════════════════════════════ */}
      <div className="space-y-3">
        <SectionHeading title={t("activity_trend")} icon={<TrendingUp className="h-4 w-4" />} />
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          {loadingTrend ? (
            <div className="h-44"><div className="h-32 w-full rounded-xl bg-slate-50 animate-pulse" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 10, border: "1px solid #e2e8f0" }} formatter={(val: number) => [val, "Activities"]} labelFormatter={(l) => `Date: ${l}`} />
                <Bar dataKey="count" fill="#0055A4" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-[10px] text-slate-400 font-semibold uppercase mt-2 text-right">Real data · {last7[0]} to {last7[6]}</p>
        </div>
      </div>

      {/* ══ Notifications Panel ═══════════════════════════════════════════ */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-slate-400" />
            {t("notifications_panel")}
            {notifications.length > 0 && (
              <span className="ml-1 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5">{notifications.length}</span>
            )}
          </h3>
          <Link to="/cadre/notifications" className="text-[10px] text-blue-600 hover:underline font-bold">{t("notifications_view_all")}</Link>
        </div>
        {notifications.length > 0 ? (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <div key={n.id} onClick={() => markAsRead(n.id)}
                className="flex items-start justify-between gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 rounded-xl cursor-pointer transition-colors text-xs font-bold">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{notifIcon(n.type ?? "")}</span>
                    <h4 className="font-black text-slate-800 truncate">{n.title}</h4>
                  </div>
                  <p className="text-slate-500 font-medium leading-relaxed pl-6">{n.message}</p>
                  <p className="text-[9px] text-slate-400 uppercase mt-1 pl-6">
                    {new Date(n.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button className="text-[10px] font-black text-blue-600 uppercase hover:text-blue-700 shrink-0 mt-0.5">{t("mark_as_read")}</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs font-semibold">{t("no_notifications")}</div>
        )}
      </div>

    </div>
  );
}

// ─── Big Action Button ────────────────────────────────────────────────────
function BigButton({ to, icon, label, subLabel, tone }: {
  to: string; icon: React.ReactNode; label: string; subLabel: string;
  tone: "primary" | "secondary" | "accent" | "help";
}) {
  const map = {
    primary:   "from-[#0055A4] to-[#003B72] hover:shadow-blue-200/50",
    secondary: "from-[#FF9800] to-[#E65100] hover:shadow-orange-200/50",
    accent:    "from-[#4CAF50] to-[#2E7D32] hover:shadow-emerald-200/50",
    help:      "from-slate-700 to-slate-900 hover:shadow-slate-200/50",
  } as const;
  return (
    <Link to={to} className={cn(
      "flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center",
      "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
      "bg-gradient-to-br text-white border border-white/5",
      map[tone],
    )}>
      <div className="p-2 bg-white/10 rounded-xl shadow-inner border border-white/10">{icon}</div>
      <div>
        <h3 className="text-xs font-black tracking-wide leading-none">{label}</h3>
        <p className="text-[9px] text-white/70 font-semibold uppercase mt-1 tracking-wider">{subLabel}</p>
      </div>
    </Link>
  );
}
