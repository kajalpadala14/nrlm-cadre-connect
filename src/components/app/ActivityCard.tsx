import { useEffect, useState } from "react";
import { Calendar, MapPin, FileText, Camera, Edit2, CheckCircle2, XCircle, Clock, Users, Download, Trash2, Eye } from "lucide-react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { invalidateActivityQueries } from "@/hooks/use-activity-cache-sync";
import { deleteEvidenceWithConsistency } from "@/lib/evidence-consistency";
import { getAttendanceBadgeClasses, getAttendanceStatusLabel } from "@/lib/utils/attendance";

export interface ActivityCardData {
  id: string;
  activity_date: string;
  activity_type: string;
  village_name: string;
  description: string | null;
  photo_url: string | null;
  pdf_url?: string | null;
  submitted_at: string;
  block_name: string | null;
  cadre_name?: string;
  status?: "Pending" | "Approved" | "Rejected";
  beneficiaries?: number;
  gps?: string;
  comment?: string | null;
  cadre_id?: string;
  block_id?: string;
  approved_at?: string | null;
  approved_by_name?: string | null;
}

const getActivityStoragePath = (urlOrPath?: string | null) => {
  if (!urlOrPath) return null;
  if (!urlOrPath.startsWith("http")) return urlOrPath;

  const marker = "/activity-photos/";
  const markerIndex = urlOrPath.indexOf(marker);
  if (markerIndex === -1) return null;

  return decodeURIComponent(urlOrPath.slice(markerIndex + marker.length).split("?")[0]);
};

export function ActivityCard({
  activity,
  onRefetchHistory,
}: {
  activity: ActivityCardData;
  onRefetchHistory?: () => void;
}) {
  const { t } = useT();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Editing state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [editDesc, setEditDesc] = useState(activity.description || "");
  const [editBeneficiaries, setEditBeneficiaries] = useState(activity.beneficiaries || 0);
  const [savingEdit, setSavingEdit] = useState(false);

  const { data: attendanceRecord, refetch: refetchAttendance } = useQuery({
    queryKey: ["attendance-status", activity.cadre_id, activity.activity_date],
    queryFn: async () => {
      let query = supabase
        .from("attendance")
        .select("id, status")
        .eq("date", activity.activity_date);
      if (activity.cadre_id) query = query.eq("cadre_id", activity.cadre_id);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(activity.activity_date && activity.cadre_id),
  });

  const { data: evidenceFiles = [], refetch: refetchEvidenceFiles } = useQuery({
    queryKey: ["activity-evidence-files", activity.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evidence_files")
        .select("id, storage_path, public_url, mime_type, created_at")
        .eq("activity_id", activity.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(activity.id),
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const userId = profile?.id || activity.cadre_id;
      if (!userId) {
        toast.error("प्रयोक्ता आईडी नहीं मिली / User ID not found");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/retroactive_${activity.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("activity-photos")
        .upload(filePath, file);
      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("activity-photos").getPublicUrl(filePath);

      const { error: actError } = await supabase
        .from("activities")
        .update({ photo_url: publicUrl })
        .eq("id", activity.id);
      if (actError) throw actError;

      const { error: evidenceError } = await supabase.from("evidence_files").insert({
        activity_id: activity.id,
        cadre_id: userId,
        storage_path: uploadData?.path ?? filePath,
        public_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
      });
      if (evidenceError) throw evidenceError;

      const { error: attError } = await (supabase.rpc as any)("mark_activity_attendance", {
        p_activity_id: activity.id,
      });
      if (attError) throw attError;

      toast.success("फोटो साक्ष्य अपलोड किया गया और उपस्थिति अपडेट की गई / Photo uploaded and attendance updated!");
      refetchAttendance();
      if (onRefetchHistory) onRefetchHistory();
      invalidateActivityQueries(qc);
    } catch (err: any) {
      console.error(err);
      toast.error(`अपलोड विफल / Upload failed: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (editBeneficiaries < 0 || editBeneficiaries >= 1000) {
      toast.error("लाभार्थी संख्या मान्य नहीं है / Beneficiary count must be positive and < 1000");
      return;
    }
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("activities")
        .update({
          description: editDesc.trim() || null,
          beneficiaries: editBeneficiaries,
        })
        .eq("id", activity.id);

      if (error) throw error;
      toast.success("गतिविधि विवरण सफलतापूर्वक अपडेट किया गया / Activity details updated!");
      setOpenEditDialog(false);
      if (onRefetchHistory) onRefetchHistory();
      qc.invalidateQueries({ queryKey: ["my-activities"] });
    } catch (err: any) {
      toast.error(`Error updating: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteActivityRecord = async () => {
    const { error } = await (supabase.rpc as any)("delete_activity_with_consistency", {
      p_activity_id: activity.id,
    });

    if (!error) return;

    const missingRpc =
      error.code === "PGRST202" ||
      error.message?.includes("delete_activity_with_consistency") ||
      error.message?.includes("schema cache");

    if (!missingRpc) {
      throw error;
    }

    console.warn("[ActivityCard] delete_activity_with_consistency RPC unavailable; using direct delete fallback.");
    const { error: deleteError } = await supabase
      .from("activities")
      .delete()
      .eq("id", activity.id);

    if (deleteError) {
      throw deleteError;
    }
  };

  const handleDeleteActivity = async () => {
    if (!confirm("क्या आप वाकई इस गतिविधि को हटाना चाहते हैं? / Are you sure you want to delete this activity?")) return;
    setDeleting(true);
    try {
      const { data: evidenceFiles } = await supabase
        .from("evidence_files")
        .select("storage_path")
        .eq("activity_id", activity.id);
      const storagePaths = (evidenceFiles ?? [])
        .map((file) => file.storage_path)
        .filter(Boolean);
      const legacyStoragePaths = [
        getActivityStoragePath(activity.photo_url),
        getActivityStoragePath(activity.pdf_url),
      ].filter((path): path is string => Boolean(path));
      const pathsToRemove = Array.from(new Set([...storagePaths, ...legacyStoragePaths]));
      if (pathsToRemove.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("activity-photos")
          .remove(pathsToRemove);
        if (storageError) {
          throw storageError;
        }
      }

      await deleteActivityRecord();

      toast.success("गतिविधि सफलतापूर्वक हटा दी गई / Activity deleted successfully!");
      setOpenDetailsDialog(false);
      if (onRefetchHistory) onRefetchHistory();
      invalidateActivityQueries(qc);
    } catch (err: any) {
      toast.error(`हटाने में विफल / Deletion failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePhoto = async () => {
    const photoEvidence =
      evidenceFiles.find((file) => file.public_url === activity.photo_url) ??
      evidenceFiles.find((file) => file.mime_type?.startsWith("image/"));

    if (!photoEvidence) {
      toast.error("Photo metadata was not found. Please refresh and try again.");
      return;
    }

    if (!confirm("Delete this photo evidence? Auto attendance will be removed if no photos remain.")) {
      return;
    }

    setDeletingPhoto(true);
    try {
      await deleteEvidenceWithConsistency(
        { id: photoEvidence.id, storage_path: photoEvidence.storage_path },
        qc,
      );
      toast.success("Photo deleted. Attendance was revalidated.");
      await refetchEvidenceFiles();
      await refetchAttendance();
      if (onRefetchHistory) onRefetchHistory();
    } catch (err: any) {
      toast.error(`Photo delete failed: ${err.message || err}`);
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handleDownloadReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>NRLM Activity Report - ${activity.id}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #0055A4; padding-bottom: 15px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 800; color: #0055A4; }
            .row { display: flex; border-bottom: 1px solid #f1f5f9; padding: 10px 0; font-size: 13px; }
            .label { width: 200px; font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 10px; tracking-wide; }
            .value { flex: 1; font-weight: 600; color: #0f172a; }
            .description-box { margin-top: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; font-style: italic; }
            .remarks { background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7; margin-top: 20px; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">NRLM Cadre Connect - Activity Report</div>
            <div style="font-size: 11px; color: #94a3b8; font-weight: bold; margin-top: 5px; text-transform: uppercase;">Generated: ${new Date().toLocaleString()}</div>
          </div>
          <div class="row"><div class="label">Activity ID</div><div class="value">${activity.id}</div></div>
          <div class="row"><div class="label">Activity Date</div><div class="value">${activity.activity_date}</div></div>
          <div class="row"><div class="label">Activity Type</div><div class="value">${activity.activity_type}</div></div>
          <div class="row"><div class="label">Village / Block</div><div class="value">${activity.village_name} / ${activity.block_name || "N/A"}</div></div>
          <div class="row"><div class="label">Beneficiary Count</div><div class="value">${activity.beneficiaries || 0}</div></div>
          <div class="row"><div class="label">GPS Coordinates</div><div class="value">${activity.gps || "N/A"}</div></div>
          <div class="row"><div class="label">Submitted Date & Time</div><div class="value">${new Date(activity.submitted_at).toLocaleString()}</div></div>
          <div class="row"><div class="label">Approval Status</div><div class="value">${activity.status || "Pending"}</div></div>
          <div class="row"><div class="label">Attendance Status</div><div class="value">${getAttendanceStatusLabel(attendanceRecord?.status)}</div></div>
          ${activity.approved_at ? `<div class="row"><div class="label">Approved Date</div><div class="value">${new Date(activity.approved_at).toLocaleString()}</div></div>` : ""}
          ${activity.approved_by_name ? `<div class="row"><div class="label">Approved By</div><div class="value">${activity.approved_by_name}</div></div>` : ""}
          <div class="description-box">
            <strong style="display: block; margin-bottom: 8px; font-style: normal; color: #475569; font-size: 11px; text-transform: uppercase;">Description Notes:</strong>
            "${activity.description || "No description provided"}"
          </div>
          ${activity.comment ? `<div class="remarks"><strong>Remarks:</strong> "${activity.comment}"</div>` : ""}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("रिपोर्ट पीडीएफ जेनरेशन शुरू किया गया / Report print layout opened");
  };

  useEffect(() => {
    // photo_url is stored as a full public URL from getPublicUrl().
    // No signing is needed — use it directly. If it looks like a relative
    // storage path (legacy rows), derive the public URL via getPublicUrl().
    if (!activity.photo_url) {
      setSignedUrl(null);
      return;
    }
    if (activity.photo_url.startsWith("http")) {
      // Already a full public URL — use it directly.
      setSignedUrl(activity.photo_url);
    } else {
      // Legacy relative path — derive the public URL.
      const {
        data: { publicUrl },
      } = supabase.storage.from("activity-photos").getPublicUrl(activity.photo_url);
      setSignedUrl(publicUrl ?? null);
    }
  }, [activity.photo_url]);

  const activityStatus = activity.status ?? "Pending";

  return (
    <div
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 hover:shadow transition-shadow"
    >
      {/* Header section with status badges */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0055A4]">
            {t(`act.${activity.activity_type}`)}
          </span>
          {/* Status Badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
              activityStatus === "Pending" && "bg-amber-50 text-amber-700",
              activityStatus === "Approved" && "bg-emerald-50 text-emerald-700",
              activityStatus === "Rejected" && "bg-rose-50 text-rose-700"
            )}
          >
            {activityStatus === "Pending" && <Clock className="h-3 w-3" />}
            {activityStatus === "Approved" && <CheckCircle2 className="h-3 w-3" />}
            {activityStatus === "Rejected" && <XCircle className="h-3 w-3" />}
            {activityStatus}
          </span>
          {/* Attendance Status Badge */}
          {attendanceRecord ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                getAttendanceBadgeClasses(attendanceRecord.status)
              )}
            >
              उपस्थिति / Attendance: {getAttendanceStatusLabel(attendanceRecord.status)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 text-slate-500 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
              उपस्थिति / Attendance: Not Marked
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          {activity.activity_date}
        </div>
      </div>

      {/* Info Rows */}
      <div className="space-y-2.5 text-xs font-bold text-slate-600">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="text-slate-800">{activity.village_name}</span>
          {activity.block_name && (
            <span className="text-slate-400">· {activity.block_name}</span>
          )}
        </div>

        {activity.gps && (
          <p className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1.5 pl-0.5">
            <MapPin className="h-3.5 w-3.5" />
            GPS: {activity.gps}
          </p>
        )}

        <div className="flex items-center gap-1.5 pl-0.5">
          <Users className="h-4 w-4 text-slate-400" />
          <span>लाभार्थी / Beneficiaries:</span>
          <span className="text-slate-800 font-black">{activity.beneficiaries || 0}</span>
        </div>

        {activity.description && (
          <div className="flex items-start gap-1.5 pt-1 border-t border-slate-50">
            <FileText className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
            <p className="font-medium text-slate-500 leading-relaxed italic">
              "{activity.description}"
            </p>
          </div>
        )}
      </div>

      {/* Photo evidence preview */}
      {activity.photo_url ? (
        signedUrl ? (
          <div className="space-y-2">
            <a href={signedUrl} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-xl border border-slate-100">
              <img
                src={signedUrl}
                alt="evidence"
                className="h-32 w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </a>
            <div className="flex flex-wrap gap-2">
              <a
                href={signedUrl}
                download={`evidence_${activity.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                साक्ष्य डाउनलोड करें / Download Evidence
              </a>
              {activityStatus === "Pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={deletingPhoto}
                  onClick={handleDeletePhoto}
                  className="h-7 rounded-lg border-rose-200 bg-rose-50 text-[10px] font-black text-rose-600 hover:bg-rose-100"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete Photo
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-32 w-full animate-pulse rounded-xl bg-slate-50" />
        )
      ) : (
        <div className="space-y-3">
          <p className="text-xs italic text-slate-400 font-semibold">{t("no_photo")}</p>
          {!activity.photo_url && attendanceRecord?.status === "pending_verification" && (
            <div className="mt-2 p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2.5 text-xs font-bold text-slate-700">
              <p className="text-amber-800 leading-normal">
                ⚠️ इस तिथि की उपस्थिति सत्यापन लंबित है क्योंकि फ़ोटो साक्ष्य गायब है। / Attendance verification is pending for this date due to missing photo evidence.
              </p>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors shadow-sm select-none">
                <Camera className="h-4 w-4" />
                {uploading ? "अपलोड हो रहा है... / Uploading..." : "सत्यापन फ़ोटो अपलोड करें / Upload Verification Photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* PDF Attachment preview/download */}
      {activity.pdf_url && (
        <div className="flex justify-start pt-1.5">
          <a
            href={activity.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-700 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            पीडीएफ दस्तावेज़ डाउनलोड करें / Download PDF Minutes
          </a>
        </div>
      )}

      {/* Admin Comments for Rejected */}
      {activityStatus === "Rejected" && activity.comment && (
        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 space-y-1 text-xs">
          <p className="text-rose-800 font-black uppercase text-[9px] tracking-wider">
            अस्वीकृति का कारण / Rejection Feedback
          </p>
          <p className="text-slate-600 font-semibold italic">"{activity.comment}"</p>
        </div>
      )}

      {/* Actions footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <span>{t("submitted_at")}: {new Date(activity.submitted_at).toLocaleString()}</span>
        <div className="flex items-center gap-2">
          {activityStatus === "Pending" && (
            <>
              <Button
                size="sm"
                onClick={() => setOpenEditDialog(true)}
                className="h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-sm"
              >
                <Edit2 className="mr-1 h-3.5 w-3.5" />
                संपादित करें / Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={deleting}
                onClick={handleDeleteActivity}
                className="h-8 rounded-lg text-xs font-bold shadow-sm"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                हटाएं / Delete
              </Button>
            </>
          )}
          {activityStatus === "Approved" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadReport}
              className="h-8 rounded-lg border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100/50 text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              रिपोर्ट डाउनलोड / Download Report
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setOpenDetailsDialog(true)}
            className="h-8 rounded-lg text-xs font-bold shadow-sm"
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            विवरण देखें / View Details
          </Button>
        </div>
      </div>

      {/* Dialog for inline details editing */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white text-slate-700">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2.5">
              गतिविधि विवरण संपादित करें / Edit Activity Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs font-bold pt-3.5">
            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-400 font-bold uppercase">विवरण / Description</Label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Enter details..."
                className="h-20 text-xs rounded-lg border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-400 font-bold uppercase">लाभार्थी संख्या / Beneficiaries Count</Label>
              <Input
                type="number"
                value={editBeneficiaries}
                onChange={(e) => setEditBeneficiaries(Number(e.target.value))}
                className="h-10 text-xs rounded-lg border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpenEditDialog(false)}
                className="h-9 rounded-lg"
              >
                रद्द करें / Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white"
              >
                {savingEdit ? "सहेजा जा रहा है... / Saving..." : "अपडेट करें / Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for full details viewing */}
      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        <DialogContent className="max-w-2xl p-6 rounded-2xl bg-white text-slate-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span>गतिविधि विस्तृत रिपोर्ट / Activity Details</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider mr-6",
                  activityStatus === "Pending" && "bg-amber-100 text-amber-800",
                  activityStatus === "Approved" && "bg-emerald-100 text-emerald-800",
                  activityStatus === "Rejected" && "bg-rose-100 text-rose-800"
                )}
              >
                {activityStatus}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 text-xs font-bold pt-3.5">
            {/* Meta details grid */}
            <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase">तारीख / Date</p>
                <p className="text-slate-800 font-extrabold">{activity.activity_date}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase">गतिविधि प्रकार / Activity Type</p>
                <p className="text-[#0055A4] font-extrabold">{t(`act.${activity.activity_type}`)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase">स्थान / Village & Panchayat</p>
                <p className="text-slate-800 font-extrabold">
                  {activity.village_name} {activity.block_name ? `(${activity.block_name})` : ""}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase">महिला लाभार्थी / Beneficiaries</p>
                <p className="text-slate-800 font-extrabold">{activity.beneficiaries || 0}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase">जीपीएस स्थान / GPS Coordinates</p>
                <p className="text-slate-800 font-mono text-[10px]">{activity.gps || "N/A"}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase">उपस्थिति स्थिति / Attendance Status</p>
                {attendanceRecord ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                      getAttendanceBadgeClasses(attendanceRecord.status)
                    )}
                  >
                    {getAttendanceStatusLabel(attendanceRecord.status)}
                  </span>
                ) : (
                  <span className="text-slate-400">Not Marked</span>
                )}
              </div>
            </div>

            {/* Description Notes */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 uppercase">विवरण नोट्स / Full Description</Label>
              <div className="p-3 bg-slate-50/50 border border-slate-100/50 rounded-xl leading-relaxed text-slate-600 font-semibold italic">
                "{activity.description || "No description provided."}"
              </div>
            </div>

            {/* Evidence details section */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <Label className="text-[10px] text-slate-400 uppercase">अपलोड किए गए साक्ष्य / Uploaded Evidence</Label>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {/* Photo evidence preview */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400">साक्ष्य चित्र / Attachment Photo</p>
                  {activity.photo_url ? (
                    signedUrl ? (
                      <div className="space-y-2">
                        <a href={signedUrl} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-xl border border-slate-100 max-h-40">
                          <img src={signedUrl} alt="evidence" className="h-28 w-full object-cover rounded-xl" />
                        </a>
                        <a
                          href={signedUrl}
                          download={`evidence_${activity.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2 py-0.5"
                        >
                          <Download className="h-3 w-3" /> Download Photo
                        </a>
                        {activityStatus === "Pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deletingPhoto}
                            onClick={handleDeletePhoto}
                            className="h-7 rounded-lg border-rose-200 bg-rose-50 text-[10px] font-black text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete Photo
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="h-28 w-full animate-pulse rounded-xl bg-slate-50" />
                    )
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-semibold italic">No photo attached</p>
                      {!activity.photo_url && attendanceRecord?.status === "pending_verification" && (
                        <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl space-y-2 text-[10px] text-amber-800">
                          <p>⚠️ Attendance verification pending due to missing photo.</p>
                          <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white cursor-pointer select-none">
                            <Camera className="h-3 w-3" />
                            {uploading ? "Uploading..." : "Upload Photo"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handlePhotoUpload}
                              disabled={uploading}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* PDF Document */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400">दस्तावेज़ / PDF minutes</p>
                  {activity.pdf_url ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 p-2 bg-slate-50 border rounded-xl">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <span className="truncate max-w-[120px] text-[10px]">Minutes.pdf</span>
                      </div>
                      <a
                        href={activity.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 hover:text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5"
                      >
                        <Download className="h-3 w-3" /> Download PDF
                      </a>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-semibold italic">No PDF document attached</p>
                  )}
                </div>
              </div>
            </div>

            {/* Approval History Timeline */}
            <div className="space-y-2.5 border-t border-slate-100 pt-3">
              <Label className="text-[10px] text-slate-400 uppercase">अनुमोदन इतिहास / Approval History</Label>
              <div className="relative pl-6 border-l border-slate-100 space-y-4 text-[10px]">
                
                {/* Event 1: Submitted */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-[8px]">
                    1
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-800">सबमिट किया गया / Submitted</p>
                    <p className="text-slate-400">Date: {new Date(activity.submitted_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Event 2: Under Review */}
                <div className="relative">
                  <div className={cn(
                    "absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white font-bold text-[8px]",
                    activityStatus === "Pending" ? "bg-amber-500 animate-pulse" : "bg-slate-300"
                  )}>
                    2
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-800">समीक्षा के अंतर्गत / Under Review</p>
                    <p className="text-slate-400">
                      {activityStatus === "Pending" 
                        ? "Currently under review by Block Coordinator" 
                        : "Completed review"}
                    </p>
                  </div>
                </div>

                {/* Event 3: Decision (Approved / Rejected) */}
                {activityStatus !== "Pending" && (
                  <div className="relative">
                    <div className={cn(
                      "absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white font-bold text-[8px]",
                      activityStatus === "Approved" ? "bg-emerald-500" : "bg-rose-500"
                    )}>
                      3
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800">
                        {activityStatus === "Approved" ? "स्वीकृत / Approved" : "अस्वीकृत / Rejected"}
                      </p>
                      {activity.approved_at && (
                        <p className="text-slate-400">Date: {new Date(activity.approved_at).toLocaleString()}</p>
                      )}
                      {activity.approved_by_name && (
                        <p className="text-slate-400">Decided By: {activity.approved_by_name}</p>
                      )}
                      {activity.comment && (
                        <div className="mt-1 p-2 bg-slate-50 border rounded-lg italic text-slate-500">
                          Remarks: "{activity.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons inside details modal */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              {activityStatus === "Pending" && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setOpenDetailsDialog(false);
                      setOpenEditDialog(true);
                    }}
                    className="h-9 rounded-lg"
                  >
                    संपादित करें / Edit
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleting}
                    onClick={handleDeleteActivity}
                    className="h-9 rounded-lg"
                  >
                    हटाएं / Delete
                  </Button>
                </>
              )}
              {activityStatus === "Approved" && (
                <Button
                  onClick={handleDownloadReport}
                  className="h-9 rounded-lg bg-[#0055A4] text-white"
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  रिपोर्ट डाउनलोड करें / Download Report
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setOpenDetailsDialog(false)}
                className="h-9 rounded-lg"
              >
                बंद करें / Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
