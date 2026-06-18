import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  MessageSquare,
  Image as ImageIcon,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Users,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";
import { invalidateConsistencyQueries } from "@/hooks/use-activity-cache-sync";
import { deleteEvidenceWithConsistency } from "@/lib/evidence-consistency";

export const Route = createFileRoute("/_authenticated/dashboard/approvals")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const { data: adminProfile } = useProfile();
  const [workspaceTab, setWorkspaceTab] = useState<"activities" | "attendance">("activities");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Approved" | "Rejected">(
    "Pending",
  );

  // 1. Fetch activities for approval
  const {
    data: approvals = [],
    isLoading: isLoadingActivities,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ["approvals-list"],
    queryFn: async () => {
      const { data: activities, error: actError } = await supabase
        .from("activities")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (actError) throw actError;

      const activityRows = activities ?? [];
      const cadreIds = Array.from(new Set(activityRows.map((a) => a.cadre_id)));
      if (cadreIds.length === 0) return [];

      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, full_name, cadre_type")
        .in("id", cadreIds);
      if (profError) throw profError;

      const { data: blocks, error: blockError } = await supabase.from("blocks").select("id, name");
      if (blockError) throw blockError;

      const activityIds = activityRows.map((a) => a.id);
      const { data: evidenceFiles, error: evidenceError } = await supabase
        .from("evidence_files")
        .select("id, activity_id, storage_path, public_url, mime_type, created_at")
        .in("activity_id", activityIds)
        .like("mime_type", "image/%")
        .order("created_at", { ascending: true });
      if (evidenceError) throw evidenceError;

      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      const blockMap = new Map(blocks.map((b) => [b.id, b.name]));
      const evidenceMap = new Map<string, any>();
      (evidenceFiles ?? []).forEach((file) => {
        if (!evidenceMap.has(file.activity_id)) {
          evidenceMap.set(file.activity_id, file);
        }
      });

      return activityRows.map((a) => {
        const prof = profileMap.get(a.cadre_id);
        const evidence = evidenceMap.get(a.id);
        return {
          id: a.id,
          evidence_id: evidence?.id ?? null,
          storage_path: evidence?.storage_path ?? null,
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
          photo: evidence?.public_url || a.photo_url || "",
          pdf: a.pdf_url || "",
          status: a.status as "Pending" | "Approved" | "Rejected",
          comment: a.comment || "",
          block: blockMap.get(a.block_id ?? "") || "Unknown Block",
        };
      });
    },
  });

  // 2. Fetch pending attendance verifications
  const {
    data: pendingVerifications = [],
    isLoading: isLoadingVerifications,
    refetch: refetchVerifications,
  } = useQuery({
    queryKey: ["pending-verifications"],
    queryFn: async () => {
      const { data: attData, error: attError } = await supabase
        .from("attendance")
        .select("*")
        .eq("status", "pending_verification")
        .order("date", { ascending: false });
      if (attError) throw attError;

      if (attData.length === 0) return [];

      const cadreIds = Array.from(new Set(attData.map((a) => a.cadre_id)));
      const dates = Array.from(new Set(attData.map((a) => a.date)));

      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, full_name, cadre_type")
        .in("id", cadreIds);
      if (profError) throw profError;

      const { data: blocks, error: blockError } = await supabase.from("blocks").select("id, name");
      if (blockError) throw blockError;

      const { data: activities, error: actError } = await supabase
        .from("activities")
        .select("id, cadre_id, activity_date, village_name, activity_type, description")
        .in("cadre_id", cadreIds)
        .in("activity_date", dates);
      if (actError) throw actError;

      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      const blockMap = new Map(blocks.map((b) => [b.id, b.name]));

      return attData.map((att) => {
        const prof = profileMap.get(att.cadre_id);
        const matchingAct = activities?.find(
          (act) => act.cadre_id === att.cadre_id && act.activity_date === att.date,
        );

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
          status: att.status,
        };
      });
    },
  });

  const handleDecision = async (id: string, decision: "Approved" | "Rejected") => {
    const remark = comments[id] || "";
    if (decision === "Rejected" && !remark.trim()) {
      toast.error("अस्वीकार करने के लिए टिप्पणी आवश्यक है / Rejection comment is required");
      return;
    }

    try {
      const now = new Date().toISOString();
      const approverId = adminProfile?.id ?? null;

      const { error } = await supabase
        .from("activities")
        .update({
          status: decision,
          comment: remark || null,
          approved_at: now,
          approved_by: approverId,
        })
        .eq("id", id);

      if (error) throw error;

      // Insert notification for the cadre
      const act = approvals.find((a) => a.id === id);
      if (act && act.cadre_id) {
        const typeLabel = act.activity_type;
        const dateStr = act.date;
        const approverName = adminProfile?.full_name ?? "Block Officer";
        const title = decision === "Approved"
          ? "गतिविधि स्वीकृत / Activity Approved"
          : "गतिविधि अस्वीकृत / Activity Rejected";
        const message = decision === "Approved"
          ? `आपकी ${dateStr} की '${typeLabel}' गतिविधि ${approverName} द्वारा स्वीकृत कर दी गई है। / Your activity '${typeLabel}' for ${dateStr} has been approved by ${approverName}.`
          : `आपकी ${dateStr} की '${typeLabel}' गतिविधि अस्वीकृत कर दी गई है। कारण: ${remark} / Your activity '${typeLabel}' for ${dateStr} has been rejected. Reason: ${remark}`;

        await supabase.from("notifications").insert({
          user_id: act.cadre_id,
          title,
          message,
          type: decision === "Approved" ? "success" : "error",
          read: false,
        });
      }

      toast.success(
        `गतिविधि ${decision === "Approved" ? "स्वीकृत" : "अस्वीकृत"} की गई / Activity ${decision}`,
      );
      refetchActivities();
      invalidateConsistencyQueries(qc);
    } catch (err: any) {
      console.error("Approvals handleDecision error details:", err);
      toast.error(`Error: ${err.message || "Unknown error"}${err.details ? ` (${err.details})` : ""}`);
    }
  };

  const handleDeletePhoto = async (item: any) => {
    if (!item?.evidence_id) {
      toast.error("Photo metadata was not found. Please refresh and try again.");
      return;
    }
    if (!confirm("Delete this photo? Auto attendance will be removed if no photos remain for this activity.")) {
      return;
    }

    try {
      await deleteEvidenceWithConsistency(
        { id: item.evidence_id, storage_path: item.storage_path ?? null },
        qc,
      );
      toast.success("Photo deleted. Attendance was revalidated.");
      setSelectedPhoto(null);
      refetchActivities();
      invalidateConsistencyQueries(qc);
    } catch (err: any) {
      toast.error(`Photo delete failed: ${err.message || err}`);
    }
  };

  const handleApproveVerification = async (attId: string, cadreId: string, dateStr: string) => {
    try {
      const { error: attError } = await supabase
        .from("attendance")
        .update({ status: "present" as const, updated_at: new Date().toISOString() })
        .eq("id", attId);
      if (attError) throw attError;

      await supabase.from("notifications").insert({
        user_id: cadreId,
        title: "उपस्थिति स्वीकृत / Attendance Verified",
        message: `आपकी ${dateStr} की उपस्थिति स्वीकृत कर दी गई है। / Your attendance for ${dateStr} has been verified and marked Present.`,
        type: "success",
        read: false,
      });

      toast.success("उपस्थिति सत्यापन स्वीकृत / Attendance verification approved");
      refetchVerifications();
      invalidateConsistencyQueries(qc);
    } catch (err: any) {
      console.error("Approvals handleApproveVerification error details:", err);
      toast.error(`Error: ${err.message || "Unknown error"}${err.details ? ` (${err.details})` : ""}`);
    }
  };

  const handleRejectVerification = async (attId: string, cadreId: string, dateStr: string) => {
    try {
      const { error: attError } = await supabase
        .from("attendance")
        .update({ status: "absent" as const, updated_at: new Date().toISOString() })
        .eq("id", attId);
      if (attError) throw attError;

      await supabase.from("notifications").insert({
        user_id: cadreId,
        title: "उपस्थिति अस्वीकृत / Attendance Verification Rejected",
        message: `आपकी ${dateStr} की उपस्थिति सत्यापन अस्वीकृत कर दी गई है (अनुपस्थित)। / Your attendance verification for ${dateStr} has been rejected (marked Absent).`,
        type: "error",
        read: false,
      });

      toast.warning("उपस्थिति सत्यापन अस्वीकृत / Attendance verification rejected");
      refetchVerifications();
      invalidateConsistencyQueries(qc);
    } catch (err: any) {
      console.error("Approvals handleRejectVerification error details:", err);
      toast.error(`Error: ${err.message || "Unknown error"}${err.details ? ` (${err.details})` : ""}`);
    }
  };

  const handleCommentChange = (id: string, val: string) => {
    setComments((prev) => ({ ...prev, [id]: val }));
  };

  const filteredItems = approvals.filter((item) => {
    if (filterStatus === "All") return true;
    return item.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Workspace Level Tabs */}
      <div className="flex bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm gap-1 w-max text-xs">
        <button
          onClick={() => setWorkspaceTab("activities")}
          className={`rounded-lg px-4.5 py-2 font-bold transition-all ${
            workspaceTab === "activities"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          {t("activity_submissions_tab")}
        </button>
        <button
          onClick={() => setWorkspaceTab("attendance")}
          className={`rounded-lg px-4.5 py-2 font-bold transition-all ${
            workspaceTab === "attendance"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          {t("attendance_verifications_tab")}
        </button>
      </div>

      {workspaceTab === "activities" ? (
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {t("activity_approvals_title")}
              </h2>
              <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
                Approve or reject activity evidence submissions
              </p>
            </div>
            <div className="flex bg-white border border-slate-100 rounded-xl p-1 shadow-sm gap-1 text-xs">
              {(["All", "Pending", "Approved", "Rejected"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                    filterStatus === st
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {st === "All" && t("filter_all_label")}
                  {st === "Pending" && t("filter_pending_label")}
                  {st === "Approved" && t("filter_approved_label")}
                  {st === "Rejected" && t("filter_rejected_label")}
                </button>
              ))}
            </div>
          </div>

          {/* Approvals Queue */}
          <div className="space-y-4">
            {isLoadingActivities ? (
              <div className="text-center py-8 text-slate-400 font-medium animate-pulse">
                {t("loading_text")}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-400 font-semibold">
                {filterStatus === "Pending" ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-1" />
                    {t("no_pending_activities_msg")}
                  </div>
                ) : (
                  t("no_activities_filter_msg")
                )}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5"
                >
                  {/* Left Col: Photo Evidence Box */}
                  <div className="w-full md:w-44 shrink-0 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {t("photo_evidence_label")}
                    </span>
                    <div className="relative group overflow-hidden rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center aspect-video md:h-28 md:w-full">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt="Evidence Thumbnail"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                      {item.photo && (
                        <button
                          onClick={() => setSelectedPhoto(item)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 rounded-xl"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      )}
                    </div>
                    {item.photo && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePhoto(item)}
                        className="h-8 rounded-lg text-[11px] font-bold"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete Photo
                      </Button>
                    )}
                  </div>

                  {/* Middle Col: Description details */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                        {item.role}
                      </span>
                      <h3 className="text-sm font-black text-slate-800">{item.cadre_name}</h3>
                      <span className="text-slate-300 font-normal">|</span>
                      <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.village}
                        {item.panchayat && `, ${item.panchayat}`}
                      </span>
                      <span className="text-slate-300 font-normal">|</span>
                      <span className="text-xs text-slate-400 font-semibold">{item.date}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        {t("activity_type_label2")}
                      </p>
                      <p className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-slate-400" />
                        {item.activity_type.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        {t("description_label2")}
                      </p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50/50 rounded-xl p-2.5 w-max">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>{t("beneficiaries_label2")}:</span>
                        <span className="text-slate-800 font-extrabold">{item.beneficiaries}</span>
                      </div>
                      {item.pdf && (
                        <a
                          href={item.pdf}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100/50 rounded-xl p-2.5"
                        >
                          <FileText className="h-4 w-4" />
                          <span>दस्तावेज़ / View PDF Minutes</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right Col: Workflow Status Decision Card */}
                  <div className="w-full md:w-64 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {t("workflow_status_label")}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase",
                            item.status === "Pending" && "bg-amber-50 text-amber-700",
                            item.status === "Approved" && "bg-emerald-50 text-emerald-700",
                            item.status === "Rejected" && "bg-rose-50 text-rose-700",
                          )}
                        >
                          {item.status}
                        </span>
                      </div>

                      {item.status === "Pending" ? (
                        <div className="space-y-2">
                          <Label className="text-slate-400 font-bold text-[10px] uppercase">
                            {t("decision_comments_label")}
                          </Label>
                          <Input
                            value={comments[item.id] || ""}
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                            placeholder="Comment (Required if rejecting...)"
                            className="h-9 text-xs rounded-lg border-slate-200"
                          />
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs">
                          <p className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {t("comments_label2")}
                          </p>
                          <p className="text-slate-600 font-semibold italic">
                            {item.comment || t("no_comments_text")}
                          </p>
                        </div>
                      )}
                    </div>

                    {item.status === "Pending" && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => handleDecision(item.id, "Rejected")}
                          className="flex-1 h-9 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md"
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          {t("reject_btn")}
                        </Button>
                        <Button
                          onClick={() => handleDecision(item.id, "Approved")}
                          className="flex-1 h-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs shadow-md"
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          {t("approve_btn")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {t("attendance_verif_title")}
            </h2>
            <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
              Verify attendance submissions that lack photo evidence
            </p>
          </div>

          {/* Pending Verifications Queue */}
          <div className="space-y-4">
            {isLoadingVerifications ? (
              <div className="text-center py-8 text-slate-400 font-medium animate-pulse">
                {t("loading_text")}
              </div>
            ) : pendingVerifications.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-1" />
                {t("no_pending_verif_msg")}
              </div>
            ) : (
              pendingVerifications.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 animate-fade-in"
                >
                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                        {item.role}
                      </span>
                      <h3 className="text-sm font-black text-slate-800">{item.cadre_name}</h3>
                      <span className="text-slate-300 font-normal">|</span>
                      <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.block}
                      </span>
                      <span className="text-slate-300 font-normal">|</span>
                      <span className="text-xs text-slate-400 font-semibold">{item.date}</span>
                    </div>

                    <div className="bg-amber-50/40 rounded-xl p-3 border border-amber-100/50 space-y-2 text-xs">
                      <p className="text-amber-800 font-bold uppercase text-[9px] tracking-wider">
                        {t("related_activity_label")}
                      </p>
                      {item.activity_id ? (
                        <div className="space-y-1 text-slate-700">
                          <p className="font-extrabold flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-amber-600" />
                            {item.activity_type.replace(/_/g, " ")} (गांव: {item.village})
                          </p>
                          <p className="font-medium text-slate-500 leading-relaxed italic">
                            "{item.description}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">{t("no_activity_for_date_msg")}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full md:w-64 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 flex flex-col justify-center gap-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRejectVerification(item.id, item.cadre_id, item.date)}
                        className="flex-1 h-9 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md"
                      >
                        <X className="mr-1 h-3 w-3" />
                        {t("reject_absent_btn")}
                      </Button>
                      <Button
                        onClick={() => handleApproveVerification(item.id, item.cadre_id, item.date)}
                        className="flex-1 h-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs shadow-md"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        {t("verify_present_btn")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Lightbox photo modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="relative max-w-lg p-0 overflow-hidden bg-slate-950 flex flex-col justify-center items-center aspect-square border-none shadow-2xl">
          <div className="h-full w-full bg-gradient-to-br from-blue-900/40 to-slate-900 flex flex-col justify-center items-center">
            {selectedPhoto ? (
              <>
                <img
                  src={selectedPhoto.photo}
                  alt="Evidence Preview"
                  className="w-full h-full object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePhoto(selectedPhoto)}
                  className="absolute top-3 right-3 h-9 rounded-lg text-xs font-bold"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete Photo
                </Button>
              </>
            ) : (
              <>
                <ImageIcon className="h-16 w-16 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 font-bold">
                  {t("photo_evidence_label")}
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
