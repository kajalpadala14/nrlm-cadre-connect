import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useT } from "./router-yzFmt3hU.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { a as useProfile } from "./use-auth-DM5yQtMG.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { S as Sheet, a as SheetContent, b as SheetHeader, c as SheetTitle } from "./sheet-Dm-yGMie.mjs";
import { t as CircleCheckBig, u as CircleX, v as CalendarDays, w as Clock, n as UserCheck, E as Eye, c as ClipboardList, M as MapPin, H as Hourglass, x as Earth, j as ChevronRight, k as Check, o as CircleCheck, C as CalendarCheck, y as CirclePlus, z as CloudUpload, D as UserPlus } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/class-variance-authority.mjs";
function Overview() {
  const {
    t,
    lang
  } = useT();
  const blockId = "all";
  const date = /* @__PURE__ */ new Date();
  const [dashboardTab, setDashboardTab] = reactExports.useState("operations");
  const {
    data: adminProfile
  } = useProfile();
  const qc = useQueryClient();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const {
    data: dbStats,
    refetch
  } = useQuery({
    queryKey: ["dash-stats-raw", blockId, dateStr],
    queryFn: async () => {
      let totalCadres = 0;
      {
        const {
          count
        } = await supabase.from("user_roles").select("user_id", {
          count: "exact",
          head: true
        }).eq("role", "cadre");
        totalCadres = count ?? 0;
      }
      let attendanceQ = supabase.from("attendance").select("status");
      attendanceQ = attendanceQ.eq("date", dateStr);
      const {
        data: attData
      } = await attendanceQ;
      const presentCount = attData?.filter((a) => a.status === "present").length ?? 0;
      const absentCount = attData?.filter((a) => a.status === "absent").length ?? 0;
      const leaveCount = attData?.filter((a) => a.status === "on_leave").length ?? 0;
      let actAllQ = supabase.from("activities").select("status, activity_type");
      const {
        data: allActs
      } = await actAllQ;
      const totalActivities = allActs?.length ?? 0;
      const pendingActivities = allActs?.filter((a) => a.status === "Pending").length ?? 0;
      const approvedActivities = allActs?.filter((a) => a.status === "Approved").length ?? 0;
      const rejectedActivities = allActs?.filter((a) => a.status === "Rejected").length ?? 0;
      const farmerVisits = allActs?.filter((a) => a.activity_type === "Farmer_Visit").length ?? 0;
      const trainings = allActs?.filter((a) => a.activity_type === "Training_Session").length ?? 0;
      const monitorings = allActs?.filter((a) => a.activity_type === "Monitoring_Visit").length ?? 0;
      const verifications = allActs?.filter((a) => a.activity_type === "Record_Verification").length ?? 0;
      const livelihoods = allActs?.filter((a) => a.activity_type === "Livelihood_Activity").length ?? 0;
      const other = allActs?.filter((a) => a.activity_type === "Other").length ?? 0;
      let actTodayQ = supabase.from("activities").select("cadre_id, village_name, photo_url");
      actTodayQ = actTodayQ.eq("activity_date", dateStr);
      const {
        data: actTodayRows
      } = await actTodayQ;
      new Set((actTodayRows ?? []).map((r) => r.cadre_id));
      const villagesToday = new Set((actTodayRows ?? []).map((r) => r.village_name));
      const evidenceUploadedToday = actTodayRows?.filter((r) => r.photo_url).length ?? 0;
      let pendingListQ = supabase.from("activities").select(`
          id,
          cadre_id,
          village_name,
          activity_type,
          submitted_at,
          status
        `).eq("status", "Pending").order("submitted_at", {
        ascending: false
      });
      const {
        data: pendingActivitiesList
      } = await pendingListQ;
      const pendingCadreIds = Array.from(new Set((pendingActivitiesList ?? []).map((a) => a.cadre_id)));
      const pendingProfilesMap = /* @__PURE__ */ new Map();
      if (pendingCadreIds.length > 0) {
        const {
          data: pendingProfs
        } = await supabase.from("profiles").select("id, full_name, cadre_type").in("id", pendingCadreIds);
        pendingProfs?.forEach((p) => pendingProfilesMap.set(p.id, p));
      }
      const {
        data: blocksData
      } = await supabase.from("blocks").select("id, name");
      let blocksList = [];
      if (blocksData) {
        const {
          data: cadreRoles
        } = await supabase.from("user_roles").select("user_id").eq("role", "cadre");
        const cadreIds = cadreRoles?.map((r) => r.user_id) || [];
        let profs = [];
        if (cadreIds.length > 0) {
          const {
            data
          } = await supabase.from("profiles").select("id, block_id").in("id", cadreIds);
          profs = data || [];
        }
        const {
          data: acts
        } = await supabase.from("activities").select("block_id, cadre_id, village_name").eq("activity_date", dateStr);
        const {
          data: atts
        } = await supabase.from("attendance").select("block_id, status, cadre_id").eq("date", dateStr);
        blocksList = blocksData.map((b) => {
          const cadresInBlock = profs?.filter((p) => p.block_id === b.id) ?? [];
          const total = cadresInBlock.length;
          const presentAttInBlock = atts?.filter((a) => a.block_id === b.id && a.status === "present") ?? [];
          const active = presentAttInBlock.length;
          const inactive = Math.max(0, total - active);
          const actsInBlock = acts?.filter((a) => a.block_id === b.id) ?? [];
          const activities = actsInBlock.length;
          const uniqueVillages = new Set(actsInBlock.map((a) => a.village_name));
          const villages = uniqueVillages.size;
          const attendance = total > 0 ? (active / total * 100).toFixed(2) + "%" : "0.00%";
          return {
            name: b.name,
            total,
            active,
            inactive,
            activities,
            villages,
            attendance
          };
        });
      }
      let recentQ = supabase.from("activities").select(`
          id,
          cadre_id,
          village_name,
          activity_type,
          status,
          submitted_at
        `).order("submitted_at", {
        ascending: false
      }).limit(6);
      const {
        data: dbRecent
      } = await recentQ;
      const recentCadreIds = Array.from(new Set((dbRecent ?? []).map((a) => a.cadre_id)));
      const recentProfilesMap = /* @__PURE__ */ new Map();
      if (recentCadreIds.length > 0) {
        const {
          data: recentProfs
        } = await supabase.from("profiles").select("id, full_name, cadre_type").in("id", recentCadreIds);
        recentProfs?.forEach((p) => recentProfilesMap.set(p.id, p));
      }
      const formattedRecent = (dbRecent ?? []).map((act) => {
        const dateObj = new Date(act.submitted_at);
        const timeStr = dateObj.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit"
        });
        const profile = recentProfilesMap.get(act.cadre_id);
        const cadreName = profile?.full_name || "Unknown Cadre";
        const cadreRole = profile?.cadre_type || "PRP";
        const typeClean = act.activity_type.replace(/_/g, " ");
        let firstLetter = "?";
        if (cadreName.length > 0) {
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
          initial: firstLetter
        };
      });
      const formattedPendingList = (pendingActivitiesList ?? []).map((app) => {
        const dateObj = new Date(app.submitted_at);
        const timeStr = dateObj.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
        const profile = pendingProfilesMap.get(app.cadre_id);
        const cadreName = profile?.full_name || "Unknown Cadre";
        const cadreRole = profile?.cadre_type || "PRP";
        const detailStr = `${app.activity_type.replace(/_/g, " ")} at ${app.village_name}`;
        const firstLetter = cadreName.charAt(0).toUpperCase();
        const bgClassMap = {
          PRP: "bg-emerald-100 text-emerald-800",
          FLCRP: "bg-blue-100 text-blue-800",
          RBK: "bg-orange-100 text-orange-800",
          IFC_Anchor: "bg-purple-100 text-purple-800",
          SR_CRP: "bg-rose-100 text-rose-800"
        };
        const bg = bgClassMap[cadreRole] || "bg-slate-100 text-slate-800";
        return {
          id: app.id,
          cadre: `${cadreRole} - ${cadreName}`,
          detail: detailStr,
          time: timeStr,
          status: "Pending",
          initial: firstLetter,
          bg
        };
      });
      return {
        totalCadres,
        activeToday: presentCount,
        inactiveToday: absentCount,
        leaveCount,
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
        formattedRecent
      };
    }
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
    attendancePercent: dbStats?.totalCadres && dbStats.totalCadres > 0 ? parseFloat((dbStats.activeToday / dbStats.totalCadres * 100).toFixed(2)) : 0
  };
  const [attSheetStatus, setAttSheetStatus] = reactExports.useState(null);
  const {
    data: attDetailRows = [],
    isLoading: attDetailLoading
  } = useQuery({
    queryKey: ["att-detail", blockId, dateStr, attSheetStatus],
    enabled: !!attSheetStatus,
    staleTime: 6e4,
    queryFn: async () => {
      if (!attSheetStatus) return [];
      console.log("[att-detail] QUERY START", {
        attSheetStatus,
        dateStr,
        blockId
      });
      let attQ = supabase.from("attendance").select("cadre_id, status, check_in_at").eq("date", dateStr).eq("status", attSheetStatus);
      const {
        data: attRecords,
        error: attErr
      } = await attQ;
      console.log("[att-detail] attendance records:", attRecords?.length ?? 0, attRecords, attErr?.message);
      if (!attRecords || attRecords.length === 0) {
        console.log("[att-detail] No attendance records found — returning empty");
        return [];
      }
      const cadreIds = attRecords.map((r) => r.cadre_id);
      console.log("[att-detail] fetching profiles for cadreIds:", cadreIds);
      const {
        data: profiles,
        error: profErr
      } = await supabase.from("profiles").select("id, full_name, cadre_type, block_id, blocks(name)").in("id", cadreIds);
      console.log("[att-detail] profiles returned:", profiles?.length ?? 0, profErr?.message);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const result = attRecords.map((rec) => {
        const profile = profileMap.get(rec.cadre_id);
        const checkIn = rec.check_in_at ? new Date(rec.check_in_at).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit"
        }) : "—";
        return {
          id: rec.cadre_id,
          name: profile?.full_name ?? "Unknown Cadre",
          cadreType: profile?.cadre_type ?? "—",
          blockName: profile?.blocks?.name ?? "—",
          status: attSheetStatus,
          checkIn
        };
      });
      console.log("[att-detail] FINAL rendered rows:", result.length, result.map((r) => `${r.name} (${r.status})`));
      return result;
    }
  });
  const sheetTitle = attSheetStatus === "present" ? "Present Cadres / उपस्थित कैडर" : attSheetStatus === "absent" ? "Absent Cadres / अनुपस्थित कैडर" : attSheetStatus === "on_leave" ? "On Leave / अवकाश पर कैडर" : "";
  const handleApprove = async (id, name) => {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const approverId = adminProfile?.id ?? null;
      const approverName = adminProfile?.full_name ?? "Block Officer";
      const {
        error
      } = await supabase.from("activities").update({
        status: "Approved",
        comment: "Approved from Dashboard",
        approved_at: now,
        approved_by: approverId
      }).eq("id", id);
      if (error) throw error;
      const {
        data: actData
      } = await supabase.from("activities").select("cadre_id, activity_type, activity_date, village_name").eq("id", id).single();
      if (actData?.cadre_id) {
        const typeClean = actData.activity_type.replace(/_/g, " ");
        await supabase.from("notifications").insert({
          user_id: actData.cadre_id,
          title: "गतिविधि स्वीकृत / Activity Approved",
          message: `आपकी ${actData.activity_date} की '${typeClean}' गतिविधि ${approverName} द्वारा स्वीकृत कर दी गई है। / Your activity '${typeClean}' for ${actData.activity_date} has been approved by ${approverName}.`,
          type: "success",
          read: false
        });
      }
      toast.success(`अनुमोदित / Approved: ${name}`);
      qc.invalidateQueries({
        queryKey: ["dash-stats-raw"]
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error: ${msg}`);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { open: !!attSheetStatus, onOpenChange: (open) => {
      if (!open) setAttSheetStatus(null);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "right", className: "w-full sm:max-w-lg p-0 flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SheetHeader, { className: "px-5 pt-5 pb-3 border-b border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetTitle, { className: "text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2", children: [
          attSheetStatus === "present" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-emerald-500" }),
          attSheetStatus === "absent" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 text-rose-500" }),
          attSheetStatus === "on_leave" && /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-4 w-4 text-orange-500" }),
          sheetTitle
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-slate-400 uppercase", children: dateStr })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-5 py-4 space-y-2", children: [
        !attDetailLoading && console.log("[att-detail] RENDER: attDetailRows.length =", attDetailRows.length, "| status =", attSheetStatus),
        attDetailLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: Array.from({
          length: 4
        }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 rounded-xl bg-slate-100 animate-pulse" }, i)) }) : attDetailRows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-slate-400 gap-2", children: [
          attSheetStatus === "present" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-8 w-8 text-slate-200" }),
          attSheetStatus === "absent" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-8 w-8 text-slate-200" }),
          attSheetStatus === "on_leave" && /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-8 w-8 text-slate-200" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold", children: attSheetStatus === "present" ? "कोई उपस्थित नहीं / No cadres present" : attSheetStatus === "absent" ? "कोई अनुपस्थित नहीं / No absences recorded" : "कोई छुट्टी नहीं / No leave records" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-slate-300 font-semibold", children: [
            "for ",
            dateStr
          ] })
        ] }) : attDetailRows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black", row.status === "present" && "bg-emerald-100 text-emerald-700", row.status === "absent" && "bg-rose-100 text-rose-700", row.status === "on_leave" && "bg-orange-100 text-orange-700"), children: row.name.charAt(0).toUpperCase() }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black text-slate-800 truncate", children: row.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mt-0.5 flex-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-blue-600 bg-blue-50 rounded px-1.5 py-0.5", children: row.cadreType }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold text-slate-400 truncate", children: row.blockName })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase", row.status === "present" && "bg-emerald-50 text-emerald-700", row.status === "absent" && "bg-rose-50 text-rose-700", row.status === "on_leave" && "bg-orange-50 text-orange-700"), children: [
              row.status === "present" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3 w-3" }),
              row.status === "absent" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3 w-3" }),
              row.status === "on_leave" && /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-3 w-3" }),
              row.status === "present" ? "Present" : row.status === "absent" ? "Absent" : "Leave"
            ] }),
            row.checkIn !== "—" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-mono font-semibold text-slate-400 mt-1 flex items-center justify-end gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-2.5 w-2.5" }),
              row.checkIn
            ] })
          ] })
        ] }, row.id))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100 px-5 py-3 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: attDetailLoading ? "Loading…" : `${attDetailRows.length} cadre${attDetailRows.length !== 1 ? "s" : ""}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Date: ",
          dateStr
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm hover:shadow-md transition-all", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { className: "h-6 w-6" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide", children: "सक्रिय कैडर / Cadre Attendance" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xl font-black text-slate-800 mt-1", children: [
                stats.activeToday,
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-400 font-bold", children: [
                  "/ ",
                  stats.totalCadres
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800", children: [
            stats.attendancePercent,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3.5 space-y-1 border-t border-slate-50 pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
            console.log("[KPI] Present View clicked, setting attSheetStatus=present");
            setAttSheetStatus("present");
          }, className: "w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-emerald-50 transition-colors group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3.5 w-3.5 text-emerald-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold text-slate-600", children: "Present" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-black text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5", children: stats.activeToday })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 flex items-center gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
              " View"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
            console.log("[KPI] Absent View clicked, setting attSheetStatus=absent");
            setAttSheetStatus("absent");
          }, className: "w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-rose-50 transition-colors group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5 text-rose-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold text-slate-600", children: "Absent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-black text-rose-700 bg-rose-50 rounded-full px-2 py-0.5", children: stats.inactiveToday })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-slate-400 group-hover:text-rose-600 flex items-center gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
              " View"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
            console.log("[KPI] Leave View clicked, setting attSheetStatus=on_leave");
            setAttSheetStatus("on_leave");
          }, className: "w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-orange-50 transition-colors group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-3.5 w-3.5 text-orange-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold text-slate-600", children: "On Leave" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-black text-orange-700 bg-orange-50 rounded-full px-2 py-0.5", children: stats.leaveCount })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-slate-400 group-hover:text-orange-600 flex items-center gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
              " View"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm hover:shadow-md transition-all", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "h-6 w-6" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide", children: "कार्य रिपोर्ट / Activities Today" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-black text-slate-800 mt-1", children: stats.activitiesSubmitted })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700", children: [
          stats.evidenceUploaded,
          " Geotags"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm hover:shadow-md transition-all", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-6 w-6" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide", children: "गाँव कवरेज / Villages Covered" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xl font-black text-slate-800 mt-1", children: [
            stats.villagesCovered,
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400 font-semibold", children: "Villages" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm hover:shadow-md transition-all", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Hourglass, { className: "h-6 w-6" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide", children: "स्वीकृति लंबित / Action Required" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-black text-slate-800 mt-1", children: stats.pendingApprovals })
          ] })
        ] }),
        stats.pendingApprovals > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-bold text-white animate-pulse", children: "Action" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm gap-1 w-max text-xs font-bold text-slate-700", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setDashboardTab("operations"), className: `rounded-lg px-4.5 py-2 font-bold transition-all cursor-pointer ${dashboardTab === "operations" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50/50"}`, children: "दैनिक संचालन / Daily Operations" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setDashboardTab("analytics"), className: `rounded-lg px-4.5 py-2 font-bold transition-all cursor-pointer ${dashboardTab === "analytics" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50/50"}`, children: "प्रदर्शन और विश्लेषण / Performance & Analytics" })
    ] }),
    dashboardTab === "analytics" ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold text-slate-700 uppercase tracking-wide", children: "उपस्थिति विवरण / Attendance Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center justify-center h-28 w-28", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "absolute w-full h-full transform -rotate-90", viewBox: "0 0 36 36", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "text-slate-100", strokeWidth: "3", stroke: "currentColor", fill: "none", d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "text-emerald-500", strokeDasharray: `${stats.attendancePercent}, 100`, strokeWidth: "3.5", strokeLinecap: "round", stroke: "currentColor", fill: "none", d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center leading-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xl font-black text-slate-800", children: [
                stats.attendancePercent,
                "%"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[8px] font-semibold text-slate-400 uppercase mt-1", children: "Present / उपस्थित" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 w-full mt-5 text-center text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-emerald-50 text-emerald-800 rounded-lg p-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[10px]", children: "सक्रिय / Present" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-extrabold", children: stats.activeToday })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-rose-50 text-rose-800 rounded-lg p-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[10px]", children: "अनुपस्थित / Absent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-extrabold", children: stats.inactiveToday })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-orange-50 text-orange-800 rounded-lg p-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[10px]", children: "अवकाश / Leave" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-extrabold", children: stats.leaveCount })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold text-slate-700 uppercase tracking-wide", children: "गतिविधि सारांश / Activity Summary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 mt-4 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-slate-100 rounded-xl p-2.5 bg-slate-50/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-semibold block text-[9px] uppercase", children: "Farmer Visits / किसान भेंट" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-black text-slate-800", children: dbStats?.farmerVisits ?? 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-slate-100 rounded-xl p-2.5 bg-slate-50/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-semibold block text-[9px] uppercase", children: "Trainings / प्रशिक्षण" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-black text-slate-800", children: dbStats?.trainings ?? 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-slate-100 rounded-xl p-2.5 bg-slate-50/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-semibold block text-[9px] uppercase", children: "Monitoring / निगरानी" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-black text-slate-800", children: dbStats?.monitorings ?? 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-slate-100 rounded-xl p-2.5 bg-slate-50/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-semibold block text-[9px] uppercase", children: "Verification / सत्यापन" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-black text-slate-800", children: dbStats?.verifications ?? 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-slate-100 rounded-xl p-2.5 bg-slate-50/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-semibold block text-[9px] uppercase", children: "Livelihoods / आजीविका" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-black text-slate-800", children: dbStats?.livelihoods ?? 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-slate-100 rounded-xl p-2.5 bg-slate-50/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-semibold block text-[9px] uppercase", children: "Other / अन्य" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-black text-slate-800", children: dbStats?.other ?? 0 })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold text-slate-700 uppercase tracking-wide mb-3", children: "भौगोलिक कवरेज / Geographic Coverage" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-50 pb-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 font-semibold", children: "District / जिला" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-800", children: "Dantewada" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-50 pb-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 font-semibold", children: "Blocks Covered / ब्लॉक कवरेज" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-800", children: "5 / 5 Blocks" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-50 pb-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 font-semibold", children: "Panchayats Covered / पंचायत कवरेज" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-800", children: "42 Panchayats" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 font-semibold", children: "Villages Covered / गाँव कवरेज" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-slate-800", children: [
                stats.villagesCovered,
                " Villages"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50/50 text-blue-700 rounded-xl p-2.5 text-[10px] font-bold flex items-center gap-2 border border-blue-100 mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Earth, { className: "h-4 w-4 shrink-0 text-blue-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Fully mapped across Dantewada blocks: Dantewada, Geedam, Kuakonda, Katekalyan." })
        ] })
      ] })
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold text-slate-700 uppercase tracking-wide mb-4", children: "ब्लॉक-वार प्रदर्शन / Block Wise Performance Table" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "block md:hidden space-y-4", children: (dbStats?.blocksList || []).map((b, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 p-4 shadow-sm bg-slate-50/30 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-extrabold text-sm text-slate-800", children: b.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700", children: [
                "Attendance: ",
                b.attendance
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between border-r border-slate-100 pr-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: "Total:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: b.total })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between pl-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-emerald-600", children: "Active:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-emerald-600", children: b.active })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between border-r border-slate-100 pr-2 pt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-rose-500", children: "Inactive:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-rose-500", children: b.inactive })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between pl-2 pt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: "Activities:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: b.activities })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between border-r border-slate-100 pr-2 pt-1 col-span-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: "Villages Covered:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: b.villages })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-2 border-t border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboard/activities", search: {
              blockId: b.name.toLowerCase()
            }, className: "w-full inline-flex items-center justify-center rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors", children: "View Details" }) })
          ] }, idx)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-100 text-left text-slate-400 font-semibold uppercase tracking-wider", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 pb-3", children: "Block / ब्लॉक" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 pb-3 text-right", children: "Total Cadres / कुल कैडर" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 pb-3 text-right text-emerald-600", children: "Active / सक्रिय" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 pb-3 text-right text-rose-500", children: "Inactive / निष्क्रिय" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 pb-3 text-right", children: "Activities / गतिविधियां" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 pb-3 text-right", children: "Villages / गाँव" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 pb-3 text-right", children: "Attendance %" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 pb-3 text-center", children: "Action" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: (dbStats?.blocksList || []).map((b, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/50 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-bold text-slate-700", children: b.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-right text-slate-600 font-medium", children: b.total }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-right font-bold text-emerald-600", children: b.active }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-right font-medium text-rose-500", children: b.inactive }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-right text-slate-600 font-medium", children: b.activities }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-right text-slate-600 font-medium", children: b.villages }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-right text-slate-600 font-bold", children: b.attendance }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboard/activities", search: {
                blockId: b.name.toLowerCase()
              }, className: "inline-flex items-center justify-center rounded-md border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors", children: "View Details" }) })
            ] }, idx)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-slate-50 pt-3 mt-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard/reports", className: "inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline", children: [
          "View All Blocks",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3.5 w-3.5" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-4 space-y-6 flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold text-slate-700 uppercase tracking-wide mb-3.5", children: "हाल की गतिविधि / Recent Activity Feed" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative border-l border-slate-100 pl-4 space-y-4 text-xs", children: (dbStats?.formattedRecent || []).map((act) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -left-[22px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-300 shadow-sm" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-snug", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-1 text-[10px] text-slate-400 font-bold mb-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: act.time }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-slate-800 text-[11px] leading-tight", children: lang === "hi" ? act.eventHi : act.eventEn })
              ] })
            ] }, act.id)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-slate-50 pt-3 mt-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard/activities", className: "inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline", children: [
            "View All Activities",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3.5 w-3.5" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold text-slate-700 uppercase tracking-wide", children: "लंबित स्वीकृतियां / Pending Approvals" }),
              stats.pendingApprovals > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white", children: stats.pendingApprovals })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              (dbStats?.pendingActivitiesList || []).map((app) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 p-3 flex flex-col gap-2.5 shadow-sm bg-slate-50/20", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2.5 text-xs", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold border border-slate-100 ${app.bg}`, children: app.initial }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 leading-snug", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-slate-700 truncate", children: app.cadre }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400 mt-0.5", children: app.detail }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold mt-1", children: app.time })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 border-t border-slate-100/60 pt-2.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-md bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-600 uppercase tracking-wide", children: app.status }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toast.info(`Viewing details of submission for ${app.cadre}`), className: "rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
                      "View"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handleApprove(app.id, app.cadre), className: "rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }),
                      "Approve"
                    ] })
                  ] })
                ] })
              ] }, app.id)),
              (dbStats?.pendingActivitiesList || []).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6 text-xs text-slate-400 flex flex-col items-center justify-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-8 w-8 text-emerald-500 mb-1" }),
                "No pending approvals remaining."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-slate-50 pt-3 mt-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard/approvals", className: "inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline", children: [
            "View All Pending",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3.5 w-3.5" })
          ] }) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-100 rounded-2xl p-5 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold text-slate-700 uppercase tracking-wide mb-4", children: "त्वरित क्रियाएं / Quick Actions" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard/attendance", className: "group flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 hover:bg-emerald-50/40 hover:border-emerald-100 transition-all shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarCheck, { className: "h-5.5 w-5.5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-snug", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-slate-700", children: "Mark Attendance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-medium mt-0.5", children: "Daily Attendance / दैनिक उपस्थिति" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cadre/submit", className: "group flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 hover:bg-blue-50/40 hover:border-blue-100 transition-all shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { className: "h-5.5 w-5.5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-snug", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-slate-700", children: "Submit Activity" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-medium mt-0.5", children: "Submit Today's Work / कार्य रिपोर्ट" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard/evidence", className: "group flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 hover:bg-orange-50/40 hover:border-orange-100 transition-all shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:scale-105 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { className: "h-5.5 w-5.5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-snug", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-slate-700", children: "Upload Evidence" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-medium mt-0.5", children: "Evidence Gallery / साक्ष्य गैलरी" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard/users", className: "group flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 hover:bg-purple-50/40 hover:border-purple-100 transition-all shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-5.5 w-5.5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-snug", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-slate-700", children: "Add Cadre" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-medium mt-0.5", children: "Cadre Management / नया कैडर जोड़ें" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Overview as component
};
