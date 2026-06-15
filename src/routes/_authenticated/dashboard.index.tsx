import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  MapPin,
  Hourglass,
  CalendarCheck,
  PlusCircle,
  UploadCloud,
  ChevronRight,
  UserCheck,
  Check,
  Eye,
  UserPlus,
  Globe2,
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

function Overview() {
  const { t, lang } = useT();
  // Always show all blocks, always use today's date — filters removed
  const blockId = "all";
  const date = new Date();
  const [dashboardTab, setDashboardTab] = useState<"operations" | "analytics">("operations");
  const { data: adminProfile } = useProfile();
  const qc = useQueryClient();

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  // DB queries with live statistics
  const { data: dbStats, refetch } = useQuery({
    queryKey: ["dash-stats-raw", blockId, dateStr],
    queryFn: async () => {
      // 1. Total Cadres count (filtered by block_id if not 'all')
      let totalCadres = 0;
      if (blockId === "all") {
        const { count } = await supabase
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "cadre");
        totalCadres = count ?? 0;
      } else {
        const { data: cadreRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "cadre");
        const cadreIds = cadreRoles?.map((r) => r.user_id) || [];
        if (cadreIds.length > 0) {
          const { count } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("block_id", blockId)
            .in("id", cadreIds);
          totalCadres = count ?? 0;
        } else {
          totalCadres = 0;
        }
      }

      // 2. Attendance count (present, absent, on_leave) on dateStr for the block
      let attendanceQ = supabase.from("attendance").select("status");
      if (blockId !== "all") {
        attendanceQ = attendanceQ.eq("block_id", blockId);
      }
      attendanceQ = attendanceQ.eq("date", dateStr);
      const { data: attData } = await attendanceQ;

      const presentCount = attData?.filter((a) => a.status === "present").length ?? 0;
      const absentCount = attData?.filter((a) => a.status === "absent").length ?? 0;
      const leaveCount = attData?.filter((a) => a.status === "on_leave").length ?? 0;

      // 3. Activities counts (overall / lifetime)
      let actAllQ = supabase.from("activities").select("status, activity_type");
      if (blockId !== "all") {
        actAllQ = actAllQ.eq("block_id", blockId);
      }
      const { data: allActs } = await actAllQ;

      const totalActivities = allActs?.length ?? 0;
      const pendingActivities = allActs?.filter((a) => a.status === "Pending").length ?? 0;
      const approvedActivities = allActs?.filter((a) => a.status === "Approved").length ?? 0;
      const rejectedActivities = allActs?.filter((a) => a.status === "Rejected").length ?? 0;

      const farmerVisits = allActs?.filter((a) => a.activity_type === "Farmer_Visit").length ?? 0;
      const trainings = allActs?.filter((a) => a.activity_type === "Training_Session").length ?? 0;
      const monitorings =
        allActs?.filter((a) => a.activity_type === "Monitoring_Visit").length ?? 0;
      const verifications =
        allActs?.filter((a) => a.activity_type === "Record_Verification").length ?? 0;
      const livelihoods =
        allActs?.filter((a) => a.activity_type === "Livelihood_Activity").length ?? 0;
      const other = allActs?.filter((a) => a.activity_type === "Other").length ?? 0;

      // 4. Activities submitted today (on dateStr)
      let actTodayQ = supabase.from("activities").select("cadre_id, village_name, photo_url");
      if (blockId !== "all") {
        actTodayQ = actTodayQ.eq("block_id", blockId);
      }
      actTodayQ = actTodayQ.eq("activity_date", dateStr);
      const { data: actTodayRows } = await actTodayQ;

      const activeTodayIds = new Set((actTodayRows ?? []).map((r) => r.cadre_id));
      const villagesToday = new Set((actTodayRows ?? []).map((r) => r.village_name));
      const evidenceUploadedToday = actTodayRows?.filter((r) => r.photo_url).length ?? 0;

      // 5. Fetch actual pending activities list for the sidebar
      let pendingListQ = supabase
        .from("activities")
        .select(
          `
          id,
          cadre_id,
          village_name,
          activity_type,
          submitted_at,
          status
        `,
        )
        .eq("status", "Pending")
        .order("submitted_at", { ascending: false });

      if (blockId !== "all") {
        pendingListQ = pendingListQ.eq("block_id", blockId);
      }
      const { data: pendingActivitiesList } = await pendingListQ;

      const pendingCadreIds = Array.from(
        new Set((pendingActivitiesList ?? []).map((a) => a.cadre_id)),
      );
      const pendingProfilesMap = new Map();
      if (pendingCadreIds.length > 0) {
        const { data: pendingProfs } = await supabase
          .from("profiles")
          .select("id, full_name, cadre_type")
          .in("id", pendingCadreIds);
        pendingProfs?.forEach((p) => pendingProfilesMap.set(p.id, p));
      }

      // 6. Block-wise list performance
      const { data: blocksData } = await supabase.from("blocks").select("id, name");

      interface BlockPerformance {
        name: string;
        total: number;
        active: number;
        inactive: number;
        activities: number;
        villages: number;
        attendance: string;
      }
      let blocksList: BlockPerformance[] = [];
      if (blocksData) {
        const { data: cadreRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "cadre");
        const cadreIds = cadreRoles?.map((r) => r.user_id) || [];
        let profs: { id: string; block_id: string | null }[] = [];
        if (cadreIds.length > 0) {
          const { data } = await supabase
            .from("profiles")
            .select("id, block_id")
            .in("id", cadreIds);
          profs = data || [];
        }

        const { data: acts } = await supabase
          .from("activities")
          .select("block_id, cadre_id, village_name")
          .eq("activity_date", dateStr);

        const { data: atts } = await supabase
          .from("attendance")
          .select("block_id, status, cadre_id")
          .eq("date", dateStr);

        blocksList = blocksData.map((b) => {
          const cadresInBlock = profs?.filter((p) => p.block_id === b.id) ?? [];
          const total = cadresInBlock.length;

          const presentAttInBlock =
            atts?.filter((a) => a.block_id === b.id && a.status === "present") ?? [];
          const active = presentAttInBlock.length;
          const inactive = Math.max(0, total - active);

          const actsInBlock = acts?.filter((a) => a.block_id === b.id) ?? [];
          const activities = actsInBlock.length;

          const uniqueVillages = new Set(actsInBlock.map((a) => a.village_name));
          const villages = uniqueVillages.size;

          const attendance = total > 0 ? ((active / total) * 100).toFixed(2) + "%" : "0.00%";

          return {
            name: b.name,
            total,
            active,
            inactive,
            activities,
            villages,
            attendance,
          };
        });
      }

      // 7. Recent activities feed (latest 6 activities)
      let recentQ = supabase
        .from("activities")
        .select(
          `
          id,
          cadre_id,
          village_name,
          activity_type,
          status,
          submitted_at
        `,
        )
        .order("submitted_at", { ascending: false })
        .limit(6);
      if (blockId !== "all") {
        recentQ = recentQ.eq("block_id", blockId);
      }
      const { data: dbRecent } = await recentQ;

      const recentCadreIds = Array.from(new Set((dbRecent ?? []).map((a) => a.cadre_id)));
      const recentProfilesMap = new Map();
      if (recentCadreIds.length > 0) {
        const { data: recentProfs } = await supabase
          .from("profiles")
          .select("id, full_name, cadre_type")
          .in("id", recentCadreIds);
        recentProfs?.forEach((p) => recentProfilesMap.set(p.id, p));
      }

      const formattedRecent = (dbRecent ?? []).map((act) => {
        const dateObj = new Date(act.submitted_at);
        const timeStr = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        const profile = recentProfilesMap.get(act.cadre_id);
        const cadreName = profile?.full_name || "Unknown Cadre";
        const cadreRole = profile?.cadre_type || "PRP";
        const typeClean = act.activity_type.replace(/_/g, " ");

        let firstLetter = "?";
        if (cadreName && cadreName.length > 0) {
          firstLetter = cadreName.charAt(0).toUpperCase();
        }

        let eventEn = "";
        let eventHi = "";

        if (act.status === "Approved") {
          eventEn = `✅ ${cadreRole} ${cadreName} activity in ${act.village_name} was Approved`;
          eventHi = `✅ ${cadreRole} ${cadreName} की ${act.village_name} में गतिविधि को मंजूरी दी गई`;
        } else if (act.status === "Rejected") {
          eventEn = `❌ ${cadreRole} ${cadreName} activity in ${act.village_name} was Rejected`;
          eventHi = `❌ ${cadreRole} ${cadreName} की ${act.village_name} में गतिविधि को अस्वीकार किया गया`;
        } else {
          eventEn = `📝 ${cadreRole} ${cadreName} submitted ${typeClean} in ${act.village_name}`;
          eventHi = `📝 ${cadreRole} ${cadreName} ने ${act.village_name} में ${typeClean} रिपोर्ट प्रस्तुत की`;
        }

        return {
          id: act.id,
          time: timeStr,
          eventEn,
          eventHi,
          initial: firstLetter,
        };
      });

      const formattedPendingList = (pendingActivitiesList ?? []).map((app) => {
        const dateObj = new Date(app.submitted_at);
        const timeStr = dateObj.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const profile = pendingProfilesMap.get(app.cadre_id);
        const cadreName = profile?.full_name || "Unknown Cadre";
        const cadreRole = profile?.cadre_type || "PRP";
        const detailStr = `${app.activity_type.replace(/_/g, " ")} at ${app.village_name}`;
        const firstLetter = cadreName.charAt(0).toUpperCase();

        const bgClassMap: Record<string, string> = {
          PRP: "bg-emerald-100 text-emerald-800",
          FLCRP: "bg-blue-100 text-blue-800",
          RBK: "bg-orange-100 text-orange-800",
          IFC_Anchor: "bg-purple-100 text-purple-800",
          SR_CRP: "bg-rose-100 text-rose-800",
        };
        const bg = bgClassMap[cadreRole] || "bg-slate-100 text-slate-800";

        return {
          id: app.id,
          cadre: `${cadreRole} - ${cadreName}`,
          detail: detailStr,
          time: timeStr,
          status: "Pending",
          initial: firstLetter,
          bg,
        };
      });

      return {
        totalCadres,
        activeToday: presentCount,
        inactiveToday: absentCount,
        leaveCount: leaveCount,
        activitiesToday: actTodayRows?.length ?? 0,
        villagesToday: villagesToday.size,
        evidenceUploadedToday,
        totalActivities,
        pendingActivities,
        approvedActivities,
        rejectedActivities,
        farmerVisits,
        trainings,
        monitorings,
        verifications,
        livelihoods,
        other,
        pendingActivitiesList: formattedPendingList,
        blocksList,
        formattedRecent,
      };
    },
  });

  const stats = {
    totalCadres: dbStats?.totalCadres ?? 0,
    activeToday: dbStats?.activeToday ?? 0,
    inactiveToday: dbStats?.inactiveToday ?? 0,
    leaveCount: dbStats?.leaveCount ?? 0,
    villagesCovered: dbStats?.villagesToday ?? 0,
    evidenceUploaded: dbStats?.evidenceUploadedToday ?? 0,
    pendingApprovals: dbStats?.pendingActivities ?? 0,
    activitiesSubmitted: dbStats?.activitiesToday ?? 0,
    attendancePercent:
      dbStats?.totalCadres && dbStats.totalCadres > 0
        ? parseFloat(((dbStats.activeToday / dbStats.totalCadres) * 100).toFixed(2))
        : 0,
  };

  // ── Attendance Detail Sheet ──────────────────────────────────────────────
  // null = closed. "present" | "absent" | "on_leave" = which tab was clicked.
  const [attSheetStatus, setAttSheetStatus] = useState<"present" | "absent" | "on_leave" | null>(null);

  // Lazy query — only fires when admin clicks a View button (enabled: !!attSheetStatus).
  // Fetches ONLY cadres that have an attendance record matching the chosen status on dateStr.
  // Zero extra DB calls at page load.
  const { data: attDetailRows = [], isLoading: attDetailLoading } = useQuery({
    queryKey: ["att-detail", blockId, dateStr, attSheetStatus],
    enabled: !!attSheetStatus,
    staleTime: 60_000,
    queryFn: async () => {
      if (!attSheetStatus) return [];

      console.log("[att-detail] QUERY START", { attSheetStatus, dateStr, blockId });

      // 1. Fetch attendance rows for today filtered by status (and block if set)
      let attQ = supabase
        .from("attendance")
        .select("cadre_id, status, check_in_at")
        .eq("date", dateStr)
        .eq("status", attSheetStatus);
      if (blockId !== "all") attQ = attQ.eq("block_id", blockId);
      const { data: attRecords, error: attErr } = await attQ;

      console.log("[att-detail] attendance records:", attRecords?.length ?? 0, attRecords, attErr?.message);

      if (!attRecords || attRecords.length === 0) {
        console.log("[att-detail] No attendance records found — returning empty");
        return [];
      }

      // 2. Fetch profiles only for those cadre IDs — single targeted query
      const cadreIds = attRecords.map((r) => r.cadre_id);
      console.log("[att-detail] fetching profiles for cadreIds:", cadreIds);

      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name, cadre_type, block_id, blocks(name)")
        .in("id", cadreIds);

      console.log("[att-detail] profiles returned:", profiles?.length ?? 0, profErr?.message);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      // 3. Merge and return only records that matched the attendance filter
      const result = attRecords.map((rec) => {
        const profile = profileMap.get(rec.cadre_id);
        const checkIn =
          rec.check_in_at
            ? new Date(rec.check_in_at).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—";
        return {
          id: rec.cadre_id,
          name: profile?.full_name ?? "Unknown Cadre",
          cadreType: profile?.cadre_type ?? "—",
          blockName: (profile?.blocks as any)?.name ?? "—",
          status: attSheetStatus,
          checkIn,
        };
      });

      console.log("[att-detail] FINAL rendered rows:", result.length, result.map(r => `${r.name} (${r.status})`));
      return result;
    },
  });

  const sheetTitle =
    attSheetStatus === "present"
      ? "Present Cadres / उपस्थित कैडर"
      : attSheetStatus === "absent"
        ? "Absent Cadres / अनुपस्थित कैडर"
        : attSheetStatus === "on_leave"
          ? "On Leave / अवकाश पर कैडर"
          : "";

  const handleApprove = async (id: string, name: string) => {
    try {
      const now = new Date().toISOString();
      const approverId = adminProfile?.id ?? null;
      const approverName = adminProfile?.full_name ?? "Block Officer";

      const { error } = await supabase
        .from("activities")
        .update({
          status: "Approved",
          comment: "Approved from Dashboard",
          approved_at: now,
          approved_by: approverId,
        })
        .eq("id", id);
      if (error) throw error;

      // Look up the cadre_id for this activity to send notification
      const { data: actData } = await supabase
        .from("activities")
        .select("cadre_id, activity_type, activity_date, village_name")
        .eq("id", id)
        .single();

      if (actData?.cadre_id) {
        const typeClean = actData.activity_type.replace(/_/g, " ");
        await supabase.from("notifications").insert({
          user_id: actData.cadre_id,
          title: "गतिविधि स्वीकृत / Activity Approved",
          message: `आपकी ${actData.activity_date} की '${typeClean}' गतिविधि ${approverName} द्वारा स्वीकृत कर दी गई है। / Your activity '${typeClean}' for ${actData.activity_date} has been approved by ${approverName}.`,
          type: "success",
          read: false,
        });
      }

      toast.success(`अनुमोदित / Approved: ${name}`);
      qc.invalidateQueries({ queryKey: ["dash-stats-raw"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error: ${msg}`);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Attendance Detail Sheet ── */}
      <Sheet open={!!attSheetStatus} onOpenChange={(open) => { if (!open) setAttSheetStatus(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                {attSheetStatus === "present" && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                {attSheetStatus === "absent" && <XCircle className="h-4 w-4 text-rose-500" />}
                {attSheetStatus === "on_leave" && <CalendarDays className="h-4 w-4 text-orange-500" />}
                {sheetTitle}
              </SheetTitle>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{dateStr}</span>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {/* Runtime verification log */}
            {!attDetailLoading && console.log("[att-detail] RENDER: attDetailRows.length =", attDetailRows.length, "| status =", attSheetStatus) as any}
            {attDetailLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : attDetailRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                {attSheetStatus === "present" && <CheckCircle className="h-8 w-8 text-slate-200" />}
                {attSheetStatus === "absent" && <XCircle className="h-8 w-8 text-slate-200" />}
                {attSheetStatus === "on_leave" && <CalendarDays className="h-8 w-8 text-slate-200" />}
                <p className="text-xs font-bold">
                  {attSheetStatus === "present"
                    ? "कोई उपस्थित नहीं / No cadres present"
                    : attSheetStatus === "absent"
                      ? "कोई अनुपस्थित नहीं / No absences recorded"
                      : "कोई छुट्टी नहीं / No leave records"}
                </p>
                <p className="text-[10px] text-slate-300 font-semibold">for {dateStr}</p>
              </div>
            ) : (
              attDetailRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black",
                      row.status === "present" && "bg-emerald-100 text-emerald-700",
                      row.status === "absent" && "bg-rose-100 text-rose-700",
                      row.status === "on_leave" && "bg-orange-100 text-orange-700",
                    )}>
                      {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{row.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">
                          {row.cadreType}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 truncate">
                          {row.blockName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                      row.status === "present" && "bg-emerald-50 text-emerald-700",
                      row.status === "absent" && "bg-rose-50 text-rose-700",
                      row.status === "on_leave" && "bg-orange-50 text-orange-700",
                    )}>
                      {row.status === "present" && <CheckCircle className="h-3 w-3" />}
                      {row.status === "absent" && <XCircle className="h-3 w-3" />}
                      {row.status === "on_leave" && <CalendarDays className="h-3 w-3" />}
                      {row.status === "present" ? "Present" : row.status === "absent" ? "Absent" : "Leave"}
                    </span>
                    {row.checkIn !== "—" && (
                      <p className="text-[10px] font-mono font-semibold text-slate-400 mt-1 flex items-center justify-end gap-0.5">
                        <Clock className="h-2.5 w-2.5" />{row.checkIn}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
            <span>{attDetailLoading ? "Loading…" : `${attDetailRows.length} cadre${attDetailRows.length !== 1 ? "s" : ""}`}</span>
            <span>Date: {dateStr}</span>
          </div>
        </SheetContent>
      </Sheet>

      {/* 4 High-Impact KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Attendance Summary */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  सक्रिय कैडर / Cadre Attendance
                </p>
                <h3 className="text-xl font-black text-slate-800 mt-1">
                  {stats.activeToday}{" "}
                  <span className="text-xs text-slate-400 font-bold">/ {stats.totalCadres}</span>
                </h3>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
              {stats.attendancePercent}%
            </span>
          </div>

          {/* Three status rows — each opens the detail sheet for that status */}
          <div className="mt-3.5 space-y-1 border-t border-slate-50 pt-3">
            <button
              onClick={() => { console.log("[KPI] Present View clicked, setting attSheetStatus=present"); setAttSheetStatus("present"); }}
              className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-emerald-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] font-bold text-slate-600">Present</span>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                  {stats.activeToday}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 flex items-center gap-0.5">
                <Eye className="h-3 w-3" /> View
              </span>
            </button>

            <button
              onClick={() => { console.log("[KPI] Absent View clicked, setting attSheetStatus=absent"); setAttSheetStatus("absent"); }}
              className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-rose-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-[11px] font-bold text-slate-600">Absent</span>
                <span className="text-[11px] font-black text-rose-700 bg-rose-50 rounded-full px-2 py-0.5">
                  {stats.inactiveToday}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-rose-600 flex items-center gap-0.5">
                <Eye className="h-3 w-3" /> View
              </span>
            </button>

            <button
              onClick={() => { console.log("[KPI] Leave View clicked, setting attSheetStatus=on_leave"); setAttSheetStatus("on_leave"); }}
              className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-orange-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-[11px] font-bold text-slate-600">On Leave</span>
                <span className="text-[11px] font-black text-orange-700 bg-orange-50 rounded-full px-2 py-0.5">
                  {stats.leaveCount}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-600 flex items-center gap-0.5">
                <Eye className="h-3 w-3" /> View
              </span>
            </button>
          </div>
        </div>

        {/* KPI 2: Activities Today */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  कार्य रिपोर्ट / Activities Today
                </p>
                <h3 className="text-xl font-black text-slate-800 mt-1">
                  {stats.activitiesSubmitted}
                </h3>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
              {stats.evidenceUploaded} Geotags
            </span>
          </div>
        </div>

        {/* KPI 3: Villages Covered */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                गाँव कवरेज / Villages Covered
              </p>
              <h3 className="text-xl font-black text-slate-800 mt-1">
                {stats.villagesCovered}{" "}
                <span className="text-xs text-slate-400 font-semibold">Villages</span>
              </h3>
            </div>
          </div>
        </div>

        {/* KPI 4: Pending Approvals */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Hourglass className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  स्वीकृति लंबित / Action Required
                </p>
                <h3 className="text-xl font-black text-slate-800 mt-1">{stats.pendingApprovals}</h3>
              </div>
            </div>
            {stats.pendingApprovals > 0 && (
              <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-bold text-white animate-pulse">
                Action
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm gap-1 w-max text-xs font-bold text-slate-700">
        <button
          onClick={() => setDashboardTab("operations")}
          className={`rounded-lg px-4.5 py-2 font-bold transition-all cursor-pointer ${
            dashboardTab === "operations"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          दैनिक संचालन / Daily Operations
        </button>
        <button
          onClick={() => setDashboardTab("analytics")}
          className={`rounded-lg px-4.5 py-2 font-bold transition-all cursor-pointer ${
            dashboardTab === "analytics"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          प्रदर्शन और विश्लेषण / Performance & Analytics
        </button>
      </div>

      {dashboardTab === "analytics" ? (
        <>
          {/* Row 2: Attendance Doughnut, Activity summary counts & Geographic */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Attendance Doughnut Gauge */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                उपस्थिति विवरण / Attendance Details
              </h3>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative flex items-center justify-center h-28 w-28">
                  <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500"
                      strokeDasharray={`${stats.attendancePercent}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="text-center leading-none">
                    <span className="text-xl font-black text-slate-800">
                      {stats.attendancePercent}%
                    </span>
                    <p className="text-[8px] font-semibold text-slate-400 uppercase mt-1">
                      Present / उपस्थित
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full mt-5 text-center text-xs">
                  <div className="bg-emerald-50 text-emerald-800 rounded-lg p-1.5">
                    <p className="font-bold text-[10px]">सक्रिय / Present</p>
                    <span className="text-sm font-extrabold">{stats.activeToday}</span>
                  </div>
                  <div className="bg-rose-50 text-rose-800 rounded-lg p-1.5">
                    <p className="font-bold text-[10px]">अनुपस्थित / Absent</p>
                    <span className="text-sm font-extrabold">{stats.inactiveToday}</span>
                  </div>
                  <div className="bg-orange-50 text-orange-800 rounded-lg p-1.5">
                    <p className="font-bold text-[10px]">अवकाश / Leave</p>
                    <span className="text-sm font-extrabold">{stats.leaveCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Summary Counts by Type (No SHG) */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                गतिविधि सारांश / Activity Summary
              </h3>
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div className="border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                  <span className="text-slate-400 font-semibold block text-[9px] uppercase">
                    Farmer Visits / किसान भेंट
                  </span>
                  <span className="text-lg font-black text-slate-800">
                    {dbStats?.farmerVisits ?? 0}
                  </span>
                </div>
                <div className="border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                  <span className="text-slate-400 font-semibold block text-[9px] uppercase">
                    Trainings / प्रशिक्षण
                  </span>
                  <span className="text-lg font-black text-slate-800">
                    {dbStats?.trainings ?? 0}
                  </span>
                </div>
                <div className="border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                  <span className="text-slate-400 font-semibold block text-[9px] uppercase">
                    Monitoring / निगरानी
                  </span>
                  <span className="text-lg font-black text-slate-800">
                    {dbStats?.monitorings ?? 0}
                  </span>
                </div>
                <div className="border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                  <span className="text-slate-400 font-semibold block text-[9px] uppercase">
                    Verification / सत्यापन
                  </span>
                  <span className="text-lg font-black text-slate-800">
                    {dbStats?.verifications ?? 0}
                  </span>
                </div>
                <div className="border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                  <span className="text-slate-400 font-semibold block text-[9px] uppercase">
                    Livelihoods / आजीविका
                  </span>
                  <span className="text-lg font-black text-slate-800">
                    {dbStats?.livelihoods ?? 0}
                  </span>
                </div>
                <div className="border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                  <span className="text-slate-400 font-semibold block text-[9px] uppercase">
                    Other / अन्य
                  </span>
                  <span className="text-lg font-black text-slate-800">{dbStats?.other ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Geographic Coverage */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                  भौगोलिक कवरेज / Geographic Coverage
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500 font-semibold">District / जिला</span>
                    <span className="font-bold text-slate-800">Dantewada</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500 font-semibold">
                      Blocks Covered / ब्लॉक कवरेज
                    </span>
                    <span className="font-bold text-slate-800">5 / 5 Blocks</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500 font-semibold">
                      Panchayats Covered / पंचायत कवरेज
                    </span>
                    <span className="font-bold text-slate-800">42 Panchayats</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">
                      Villages Covered / गाँव कवरेज
                    </span>
                    <span className="font-bold text-slate-800">
                      {stats.villagesCovered} Villages
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50/50 text-blue-700 rounded-xl p-2.5 text-[10px] font-bold flex items-center gap-2 border border-blue-100 mt-2">
                <Globe2 className="h-4 w-4 shrink-0 text-blue-500" />
                <span>Fully mapped across Dantewada blocks: Dantewada, Geedam, Kuakonda, Katekalyan.</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Row 4: Table and Sidebar Panels */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column: Block wise Performance Table (col-span-8) */}
            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">
                  ब्लॉक-वार प्रदर्शन / Block Wise Performance Table
                </h3>
                {/* Mobile Card Deck View */}
                <div className="block md:hidden space-y-4">
                  {(dbStats?.blocksList || []).map((b, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 p-4 shadow-sm bg-slate-50/30 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-extrabold text-sm text-slate-800">{b.name}</span>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Attendance: {b.attendance}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                        <div className="flex justify-between border-r border-slate-100 pr-2">
                          <span className="text-slate-400">Total:</span>
                          <span className="font-bold">{b.total}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span className="text-slate-400 text-emerald-600">Active:</span>
                          <span className="font-bold text-emerald-600">{b.active}</span>
                        </div>
                        <div className="flex justify-between border-r border-slate-100 pr-2 pt-1">
                          <span className="text-slate-400 text-rose-500">Inactive:</span>
                          <span className="font-bold text-rose-500">{b.inactive}</span>
                        </div>
                        <div className="flex justify-between pl-2 pt-1">
                          <span className="text-slate-400">Activities:</span>
                          <span className="font-bold">{b.activities}</span>
                        </div>
                        <div className="flex justify-between border-r border-slate-100 pr-2 pt-1 col-span-2">
                          <span className="text-slate-400">Villages Covered:</span>
                          <span className="font-bold">{b.villages}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100">
                        <Link
                          to="/dashboard/activities"
                          search={{ blockId: b.name.toLowerCase() }}
                          className="w-full inline-flex items-center justify-center rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 pb-3">Block / ब्लॉक</th>
                        <th className="py-2.5 pb-3 text-right">Total Cadres / कुल कैडर</th>
                        <th className="py-2.5 pb-3 text-right text-emerald-600">Active / सक्रिय</th>
                        <th className="py-2.5 pb-3 text-right text-rose-500">
                          Inactive / निष्क्रिय
                        </th>
                        <th className="py-2.5 pb-3 text-right">Activities / गतिविधियां</th>
                        <th className="py-2.5 pb-3 text-right">Villages / गाँव</th>
                        <th className="py-2.5 pb-3 text-right">Attendance %</th>
                        <th className="py-2.5 pb-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(dbStats?.blocksList || []).map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 font-bold text-slate-700">{b.name}</td>
                          <td className="py-3 text-right text-slate-600 font-medium">{b.total}</td>
                          <td className="py-3 text-right font-bold text-emerald-600">{b.active}</td>
                          <td className="py-3 text-right font-medium text-rose-500">
                            {b.inactive}
                          </td>
                          <td className="py-3 text-right text-slate-600 font-medium">
                            {b.activities}
                          </td>
                          <td className="py-3 text-right text-slate-600 font-medium">
                            {b.villages}
                          </td>
                          <td className="py-3 text-right text-slate-600 font-bold">
                            {b.attendance}
                          </td>
                          <td className="py-3 text-center">
                            <Link
                              to="/dashboard/activities"
                              search={{ blockId: b.name.toLowerCase() }}
                              className="inline-flex items-center justify-center rounded-md border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="border-t border-slate-50 pt-3 mt-4 text-center">
                <Link
                  to="/dashboard/reports"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  View All Blocks
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Pending Approvals & Recent Activities (col-span-4) */}
            <div className="lg:col-span-4 space-y-6 flex flex-col">
              {/* Recent Activities Feed (Bilingual logs) */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3.5">
                    हाल की गतिविधि / Recent Activity Feed
                  </h3>
                  <div className="relative border-l border-slate-100 pl-4 space-y-4 text-xs">
                    {(dbStats?.formattedRecent || []).map((act) => (
                      <div key={act.id} className="relative">
                        {/* Circle Dot */}
                        <div className="absolute -left-[22px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-300 shadow-sm"></div>
                        <div className="leading-snug">
                          <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 font-bold mb-0.5">
                            <span>{act.time}</span>
                          </div>
                          <p className="font-bold text-slate-800 text-[11px] leading-tight">
                            {lang === "hi" ? act.eventHi : act.eventEn}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-50 pt-3 mt-4 text-center">
                  <Link
                    to="/dashboard/activities"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View All Activities
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Pending Approvals panel */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      लंबित स्वीकृतियां / Pending Approvals
                    </h3>
                    {stats.pendingApprovals > 0 && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white">
                        {stats.pendingApprovals}
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {(dbStats?.pendingActivitiesList || []).map((app) => (
                      <div
                        key={app.id}
                        className="rounded-xl border border-slate-100 p-3 flex flex-col gap-2.5 shadow-sm bg-slate-50/20"
                      >
                        <div className="flex gap-2.5 text-xs">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold border border-slate-100 ${app.bg}`}
                          >
                            {app.initial}
                          </div>
                          <div className="min-w-0 flex-1 leading-snug">
                            <p className="font-bold text-slate-700 truncate">{app.cadre}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{app.detail}</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">
                              {app.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-t border-slate-100/60 pt-2.5">
                          <span className="rounded-md bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-600 uppercase tracking-wide">
                            {app.status}
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() =>
                                toast.info(`Viewing details of submission for ${app.cadre}`)
                              }
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </button>
                            <button
                              onClick={() => handleApprove(app.id, app.cadre)}
                              className="rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(dbStats?.pendingActivitiesList || []).length === 0 && (
                      <div className="text-center py-6 text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-1" />
                        No pending approvals remaining.
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-50 pt-3 mt-4 text-center">
                  <Link
                    to="/dashboard/approvals"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View All Pending
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Row 5: Quick Actions */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">
          त्वरित क्रियाएं / Quick Actions
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {/* Action 1: Mark Attendance */}
          <Link
            to="/dashboard/attendance"
            className="group flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 hover:bg-emerald-50/40 hover:border-emerald-100 transition-all shadow-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
              <CalendarCheck className="h-5.5 w-5.5" />
            </div>
            <div className="leading-snug">
              <p className="text-xs font-bold text-slate-700">Mark Attendance</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Daily Attendance / दैनिक उपस्थिति
              </p>
            </div>
          </Link>

          {/* Action 2: Submit Activity */}
          <Link
            to="/cadre/submit"
            className="group flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 hover:bg-blue-50/40 hover:border-blue-100 transition-all shadow-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
              <PlusCircle className="h-5.5 w-5.5" />
            </div>
            <div className="leading-snug">
              <p className="text-xs font-bold text-slate-700">Submit Activity</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Submit Today's Work / कार्य रिपोर्ट
              </p>
            </div>
          </Link>

          {/* Action 3: Upload Evidence */}
          <Link
            to="/dashboard/evidence"
            className="group flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 hover:bg-orange-50/40 hover:border-orange-100 transition-all shadow-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:scale-105 transition-transform">
              <UploadCloud className="h-5.5 w-5.5" />
            </div>
            <div className="leading-snug">
              <p className="text-xs font-bold text-slate-700">Upload Evidence</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Evidence Gallery / साक्ष्य गैलरी
              </p>
            </div>
          </Link>

          {/* Action 4: Add Cadre */}
          <Link
            to="/dashboard/users"
            className="group flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 hover:bg-purple-50/40 hover:border-purple-100 transition-all shadow-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
              <UserPlus className="h-5.5 w-5.5" />
            </div>
            <div className="leading-snug">
              <p className="text-xs font-bold text-slate-700">Add Cadre</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Cadre Management / नया कैडर जोड़ें
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
