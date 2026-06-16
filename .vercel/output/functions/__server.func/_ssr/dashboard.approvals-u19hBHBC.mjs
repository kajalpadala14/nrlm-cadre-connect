import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { D as Dialog, a as DialogContent } from "./dialog-9txPz7Ln.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { a as useProfile } from "./use-auth-CD1GunTm.mjs";
import { u as useT } from "./router-D5xsBJge.mjs";
import { o as CircleCheck, I as Image, E as Eye, M as MapPin, a0 as FileText, b as Users, aa as MessageSquare, X, k as Check } from "../_libs/lucide-react.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
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
import "../_libs/tailwind-merge.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
function ApprovalsPage() {
  const {
    t
  } = useT();
  const qc = useQueryClient();
  const {
    data: adminProfile
  } = useProfile();
  const [workspaceTab, setWorkspaceTab] = reactExports.useState("activities");
  const [comments, setComments] = reactExports.useState({});
  const [selectedPhoto, setSelectedPhoto] = reactExports.useState(null);
  const [filterStatus, setFilterStatus] = reactExports.useState("Pending");
  const {
    data: approvals = [],
    isLoading: isLoadingActivities,
    refetch: refetchActivities
  } = useQuery({
    queryKey: ["approvals-list"],
    queryFn: async () => {
      const {
        data: activities,
        error: actError
      } = await supabase.from("activities").select("*").order("submitted_at", {
        ascending: false
      });
      if (actError) throw actError;
      const cadreIds = Array.from(new Set(activities.map((a) => a.cadre_id)));
      if (cadreIds.length === 0) return [];
      const {
        data: profiles,
        error: profError
      } = await supabase.from("profiles").select("id, full_name, cadre_type").in("id", cadreIds);
      if (profError) throw profError;
      const {
        data: blocks,
        error: blockError
      } = await supabase.from("blocks").select("id, name");
      if (blockError) throw blockError;
      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      const blockMap = new Map(blocks.map((b) => [b.id, b.name]));
      return activities.map((a) => {
        const prof = profileMap.get(a.cadre_id);
        return {
          id: a.id,
          cadre_id: a.cadre_id,
          block_id: a.block_id,
          cadre_name: prof?.full_name || "Unknown Cadre",
          role: prof?.cadre_type || "PRP",
          date: a.activity_date,
          village: a.village_name,
          panchayat: a.panchayat || "",
          activity_type: a.activity_type,
          description: a.description || "",
          beneficiaries: a.beneficiaries || 0,
          photo: a.photo_url || "",
          pdf: a.pdf_url || "",
          status: a.status,
          comment: a.comment || "",
          block: blockMap.get(a.block_id ?? "") || "Unknown Block"
        };
      });
    }
  });
  const {
    data: pendingVerifications = [],
    isLoading: isLoadingVerifications,
    refetch: refetchVerifications
  } = useQuery({
    queryKey: ["pending-verifications"],
    queryFn: async () => {
      const {
        data: attData,
        error: attError
      } = await supabase.from("attendance").select("*").eq("status", "pending_verification").order("date", {
        ascending: false
      });
      if (attError) throw attError;
      if (attData.length === 0) return [];
      const cadreIds = Array.from(new Set(attData.map((a) => a.cadre_id)));
      const dates = Array.from(new Set(attData.map((a) => a.date)));
      const {
        data: profiles,
        error: profError
      } = await supabase.from("profiles").select("id, full_name, cadre_type").in("id", cadreIds);
      if (profError) throw profError;
      const {
        data: blocks,
        error: blockError
      } = await supabase.from("blocks").select("id, name");
      if (blockError) throw blockError;
      const {
        data: activities,
        error: actError
      } = await supabase.from("activities").select("id, cadre_id, activity_date, village_name, activity_type, description").in("cadre_id", cadreIds).in("activity_date", dates);
      if (actError) throw actError;
      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      const blockMap = new Map(blocks.map((b) => [b.id, b.name]));
      return attData.map((att) => {
        const prof = profileMap.get(att.cadre_id);
        const matchingAct = activities?.find((act) => act.cadre_id === att.cadre_id && act.activity_date === att.date);
        return {
          id: att.id,
          cadre_id: att.cadre_id,
          cadre_name: prof?.full_name || "Unknown Cadre",
          role: prof?.cadre_type || "PRP",
          date: att.date,
          block: blockMap.get(att.block_id ?? "") || "Unknown Block",
          activity_id: matchingAct?.id || null,
          village: matchingAct?.village_name || "N/A",
          activity_type: matchingAct?.activity_type || "N/A",
          description: matchingAct?.description || "No description provided",
          status: att.status
        };
      });
    }
  });
  const handleDecision = async (id, decision) => {
    const remark = comments[id] || "";
    if (decision === "Rejected" && !remark.trim()) {
      toast.error("अस्वीकार करने के लिए टिप्पणी आवश्यक है / Rejection comment is required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const approverId = adminProfile?.id ?? null;
      const {
        error
      } = await supabase.from("activities").update({
        status: decision,
        comment: remark || null,
        approved_at: now,
        approved_by: approverId
      }).eq("id", id);
      if (error) throw error;
      const act = approvals.find((a) => a.id === id);
      if (act && act.cadre_id) {
        const typeLabel = act.activity_type;
        const dateStr = act.date;
        const approverName = adminProfile?.full_name ?? "Block Officer";
        const title = decision === "Approved" ? "गतिविधि स्वीकृत / Activity Approved" : "गतिविधि अस्वीकृत / Activity Rejected";
        const message = decision === "Approved" ? `आपकी ${dateStr} की '${typeLabel}' गतिविधि ${approverName} द्वारा स्वीकृत कर दी गई है। / Your activity '${typeLabel}' for ${dateStr} has been approved by ${approverName}.` : `आपकी ${dateStr} की '${typeLabel}' गतिविधि अस्वीकृत कर दी गई है। कारण: ${remark} / Your activity '${typeLabel}' for ${dateStr} has been rejected. Reason: ${remark}`;
        await supabase.from("notifications").insert({
          user_id: act.cadre_id,
          title,
          message,
          type: decision === "Approved" ? "success" : "error",
          read: false
        });
      }
      toast.success(`गतिविधि ${decision === "Approved" ? "स्वीकृत" : "अस्वीकृत"} की गई / Activity ${decision}`);
      refetchActivities();
      qc.invalidateQueries({
        queryKey: ["dash-stats-raw"]
      });
    } catch (err) {
      console.error("Approvals handleDecision error details:", err);
      toast.error(`Error: ${err.message || "Unknown error"}${err.details ? ` (${err.details})` : ""}`);
    }
  };
  const handleApproveVerification = async (attId, cadreId, dateStr) => {
    try {
      const {
        error: attError
      } = await supabase.from("attendance").update({
        status: "present",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", attId);
      if (attError) throw attError;
      await supabase.from("notifications").insert({
        user_id: cadreId,
        title: "उपस्थिति स्वीकृत / Attendance Verified",
        message: `आपकी ${dateStr} की उपस्थिति स्वीकृत कर दी गई है। / Your attendance for ${dateStr} has been verified and marked Present.`,
        type: "success",
        read: false
      });
      toast.success("उपस्थिति सत्यापन स्वीकृत / Attendance verification approved");
      refetchVerifications();
      qc.invalidateQueries({
        queryKey: ["dash-stats-raw"]
      });
    } catch (err) {
      console.error("Approvals handleApproveVerification error details:", err);
      toast.error(`Error: ${err.message || "Unknown error"}${err.details ? ` (${err.details})` : ""}`);
    }
  };
  const handleRejectVerification = async (attId, cadreId, dateStr) => {
    try {
      const {
        error: attError
      } = await supabase.from("attendance").update({
        status: "absent",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", attId);
      if (attError) throw attError;
      await supabase.from("notifications").insert({
        user_id: cadreId,
        title: "उपस्थिति अस्वीकृत / Attendance Verification Rejected",
        message: `आपकी ${dateStr} की उपस्थिति सत्यापन अस्वीकृत कर दी गई है (अनुपस्थित)। / Your attendance verification for ${dateStr} has been rejected (marked Absent).`,
        type: "error",
        read: false
      });
      toast.warning("उपस्थिति सत्यापन अस्वीकृत / Attendance verification rejected");
      refetchVerifications();
      qc.invalidateQueries({
        queryKey: ["dash-stats-raw"]
      });
    } catch (err) {
      console.error("Approvals handleRejectVerification error details:", err);
      toast.error(`Error: ${err.message || "Unknown error"}${err.details ? ` (${err.details})` : ""}`);
    }
  };
  const handleCommentChange = (id, val) => {
    setComments((prev) => ({
      ...prev,
      [id]: val
    }));
  };
  const filteredItems = approvals.filter((item) => {
    if (filterStatus === "All") return true;
    return item.status === filterStatus;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm gap-1 w-max text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setWorkspaceTab("activities"), className: `rounded-lg px-4.5 py-2 font-bold transition-all ${workspaceTab === "activities" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50/50"}`, children: t("activity_submissions_tab") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setWorkspaceTab("attendance"), className: `rounded-lg px-4.5 py-2 font-bold transition-all ${workspaceTab === "attendance" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50/50"}`, children: t("attendance_verifications_tab") })
    ] }),
    workspaceTab === "activities" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black text-slate-800 tracking-tight", children: t("activity_approvals_title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: "Approve or reject activity evidence submissions" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-white border border-slate-100 rounded-xl p-1 shadow-sm gap-1 text-xs", children: ["All", "Pending", "Approved", "Rejected"].map((st) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setFilterStatus(st), className: `rounded-lg px-3 py-1.5 font-bold transition-all ${filterStatus === st ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`, children: [
          st === "All" && t("filter_all_label"),
          st === "Pending" && t("filter_pending_label"),
          st === "Approved" && t("filter_approved_label"),
          st === "Rejected" && t("filter_rejected_label")
        ] }, st)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: isLoadingActivities ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-slate-400 font-medium animate-pulse", children: t("loading_text") }) : filteredItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-400 font-semibold", children: filterStatus === "Pending" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-10 w-10 text-emerald-500 mb-1" }),
        t("no_pending_activities_msg")
      ] }) : t("no_activities_filter_msg") }) : filteredItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full md:w-44 shrink-0 flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide", children: t("photo_evidence_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group overflow-hidden rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center aspect-video md:h-28 md:w-full", children: [
            item.photo ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.photo, alt: "Evidence Thumbnail", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-8 w-8 text-slate-300" }) }),
            item.photo && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setSelectedPhoto(item.photo), className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 rounded-xl", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }),
              "View"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700", children: item.role }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black text-slate-800", children: item.cadre_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300 font-normal", children: "|" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-400 font-semibold flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5" }),
              item.village,
              item.panchayat && `, ${item.panchayat}`
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300 font-normal", children: "|" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400 font-semibold", children: item.date })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wide", children: t("activity_type_label2") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-black text-slate-700 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 text-slate-400" }),
              item.activity_type.replace(/_/g, " ")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wide", children: t("description_label2") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-600 font-medium leading-relaxed", children: item.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50/50 rounded-xl p-2.5 w-max", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4 text-slate-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                t("beneficiaries_label2"),
                ":"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-800 font-extrabold", children: item.beneficiaries })
            ] }),
            item.pdf && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: item.pdf, target: "_blank", rel: "noreferrer", className: "flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100/50 rounded-xl p-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "दस्तावेज़ / View PDF Minutes" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full md:w-64 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide", children: t("workflow_status_label") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase", item.status === "Pending" && "bg-amber-50 text-amber-700", item.status === "Approved" && "bg-emerald-50 text-emerald-700", item.status === "Rejected" && "bg-rose-50 text-rose-700"), children: item.status })
            ] }),
            item.status === "Pending" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold text-[10px] uppercase", children: t("decision_comments_label") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: comments[item.id] || "", onChange: (e) => handleCommentChange(item.id, e.target.value), placeholder: "Comment (Required if rejecting...)", className: "h-9 text-xs rounded-lg border-slate-200" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-50 rounded-xl p-3 space-y-1 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-3 w-3" }),
                t("comments_label2")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600 font-semibold italic", children: item.comment || t("no_comments_text") })
            ] })
          ] }),
          item.status === "Pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => handleDecision(item.id, "Rejected"), className: "flex-1 h-9 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "mr-1 h-3.5 w-3.5" }),
              t("reject_btn")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => handleDecision(item.id, "Approved"), className: "flex-1 h-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs shadow-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-1 h-3.5 w-3.5" }),
              t("approve_btn")
            ] })
          ] })
        ] })
      ] }, item.id)) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black text-slate-800 tracking-tight", children: t("attendance_verif_title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: "Verify attendance submissions that lack photo evidence" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: isLoadingVerifications ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-slate-400 font-medium animate-pulse", children: t("loading_text") }) : pendingVerifications.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-400 font-semibold flex flex-col items-center justify-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-10 w-10 text-emerald-500 mb-1" }),
        t("no_pending_verif_msg")
      ] }) : pendingVerifications.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 animate-fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700", children: item.role }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black text-slate-800", children: item.cadre_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300 font-normal", children: "|" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-400 font-semibold flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5" }),
              item.block
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300 font-normal", children: "|" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400 font-semibold", children: item.date })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-50/40 rounded-xl p-3 border border-amber-100/50 space-y-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-amber-800 font-bold uppercase text-[9px] tracking-wider", children: t("related_activity_label") }),
            item.activity_id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 text-slate-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-extrabold flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3.5 w-3.5 text-amber-600" }),
                item.activity_type.replace(/_/g, " "),
                " (गांव: ",
                item.village,
                ")"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-slate-500 leading-relaxed italic", children: [
                '"',
                item.description,
                '"'
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 italic", children: t("no_activity_for_date_msg") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full md:w-64 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 flex flex-col justify-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => handleRejectVerification(item.id, item.cadre_id, item.date), className: "flex-1 h-9 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "mr-1 h-3 w-3" }),
            t("reject_absent_btn")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => handleApproveVerification(item.id, item.cadre_id, item.date), className: "flex-1 h-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs shadow-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-1 h-3 w-3" }),
            t("verify_present_btn")
          ] })
        ] }) })
      ] }, item.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!selectedPhoto, onOpenChange: () => setSelectedPhoto(null), children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "max-w-lg p-0 overflow-hidden bg-slate-950 flex flex-col justify-center items-center aspect-square border-none shadow-2xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full bg-gradient-to-br from-blue-900/40 to-slate-900 flex flex-col justify-center items-center", children: selectedPhoto ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: selectedPhoto, alt: "Evidence Preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "h-16 w-16 text-slate-600 mb-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-bold", children: t("photo_evidence_label") })
    ] }) }) }) })
  ] });
}
export {
  ApprovalsPage as component
};
