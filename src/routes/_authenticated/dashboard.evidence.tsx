import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  List,
  MapPin,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Check,
  X,
  Share2,
  Building,
  Trash2,
} from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { invalidateConsistencyQueries } from "@/hooks/use-activity-cache-sync";
import { deleteEvidenceWithConsistency } from "@/lib/evidence-consistency";

export const Route = createFileRoute("/_authenticated/dashboard/evidence")({
  component: EvidencePage,
});

function EvidencePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedBlock, setSelectedBlock] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedVO, setSelectedVO] = useState("");
  const [timelineDate, setTimelineDate] = useState<string | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePhoto, setActivePhoto] = useState<any | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  const { data: adminProfile } = useProfile();
  const { t } = useT();
  const qc = useQueryClient();

  const { data: blocks } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => (await supabase.from("blocks").select("id,name").order("name")).data ?? [],
  });

  // Fetch real evidence from activities table.
  // "blocks" is listed in the queryKey so this refetches if the blocks list loads after.
  // Block name is resolved directly from the joined blocks(name) — no stale-closure risk.
  const {
    data: photos = [],
    isLoading: isLoadingEvidence,
    refetch: refetchEvidence,
  } = useQuery({
    queryKey: ["evidence-gallery"],
    queryFn: async () => {
      const { data: evidenceRows, error } = await supabase
        .from("evidence_files")
        .select("id, activity_id, cadre_id, storage_path, public_url, mime_type, latitude, longitude, created_at")
        .like("mime_type", "image/%")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const activityIds = Array.from(new Set((evidenceRows ?? []).map((e) => e.activity_id)));
      if (activityIds.length === 0) return [];

      const { data: activities, error: actError } = await supabase
        .from("activities")
        .select("*, profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type), blocks(name)")
        .in("id", activityIds);
      if (actError) throw actError;

      const activityMap = new Map((activities ?? []).map((activity) => [activity.id, activity]));

      return (evidenceRows ?? []).flatMap((evidence) => {
        const a = activityMap.get(evidence.activity_id);
        if (!a) return [];

        return [{
          id: a.id,
          evidence_id: evidence.id,
          cadre_id: a.cadre_id,
          storage_path: evidence.storage_path,
          url: evidence.public_url || "",
          caption: a.description || a.activity_type.replace(/_/g, " "),
          cadre_name: (a.profiles as any)?.full_name || "Unknown Cadre",
          role: (a.profiles as any)?.cadre_type || "PRP",
          date: a.activity_date,
          type: a.activity_type.replace(/_/g, " "),
          village: a.village_name,
          // Use the joined blocks.name; no stale blockMap closure needed
          block: (a.blocks as any)?.name || "Unknown Block",
          block_id: a.block_id || "",
          status: (a.status as string) || "Pending",
          latitude: evidence.latitude,
          longitude: evidence.longitude,
          description: a.description || "",
          num_beneficiaries: a.beneficiaries || 0,
          pdf_url: a.pdf_url || "",
          isVideo: false,
        }];
      });
    },
    enabled: true,
  });

  // Build timeline from live data
  const timeline = useMemo(() => {
    const dateMap = new Map<string, number>();
    photos.forEach((p) => {
      dateMap.set(p.date, (dateMap.get(p.date) || 0) + 1);
    });
    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [photos]);

  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPhotos.map((p) => p.id));
    }
  };

  const handleBulkAction = async (decision: "Approved" | "Rejected") => {
    if (selectedIds.length === 0) return;
    const now = new Date().toISOString();
    const approverId = adminProfile?.id ?? null;
    const approverName = adminProfile?.full_name ?? "Block Officer";
    const bulkComment = decision === "Rejected" ? "Bulk rejected by admin" : null;
    try {
      const { error } = await supabase
        .from("activities")
        .update({
          status: decision,
          comment: bulkComment,
          approved_at: now,
          approved_by: approverId,
        })
        .in("id", selectedIds);
      if (error) throw error;

      // Notify each affected cadre
      const affected = photos.filter((p) => selectedIds.includes(p.id));
      const notifications = affected.map((p) => ({
        user_id: p.cadre_id,
        title: decision === "Approved"
          ? "गतिविधि स्वीकृत / Activity Approved"
          : "गतिविधि अस्वीकृत / Activity Rejected",
        message: decision === "Approved"
          ? `आपकी ${p.date} की '${p.type}' गतिविधि ${approverName} द्वारा स्वीकृत कर दी गई है। / Your activity '${p.type}' for ${p.date} has been approved by ${approverName}.`
          : `आपकी ${p.date} की '${p.type}' गतिविधि अस्वीकृत कर दी गई है। / Your activity '${p.type}' for ${p.date} has been rejected.`,
        type: decision === "Approved" ? "success" : "error",
        read: false,
      }));
      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }

      toast.success(`${selectedIds.length} साक्ष्य ${decision === "Approved" ? "स्वीकृत" : "अस्वीकृत"} / Bulk ${decision}`);
      setSelectedIds([]);
      refetchEvidence();
      invalidateConsistencyQueries(qc);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    // Escape a value for safe CSV embedding
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

    const headers =
      "Caption,Cadre Name,Role,Block,Village,Date,Activity Type,Beneficiaries,Photo URL,Status\n";
    const rows = filteredPhotos
      .map(
        (p) =>
          [
            esc(p.caption),
            esc(p.cadre_name),
            esc(p.role),
            esc(p.block),
            esc(p.village),
            esc(p.date),
            esc(p.type),
            p.num_beneficiaries,
            esc(p.url),
            esc(p.status),
          ].join(","),
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `evidence_gallery_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filteredPhotos.length} ${t("csv_exported")}`);
  };

  const handleSingleDecision = async (id: string, decision: "Approved" | "Rejected") => {
    if (decision === "Rejected" && !reviewComment.trim()) {
      toast.error("अस्वीकार करने के लिए टिप्पणी आवश्यक है / Rejection comment is required");
      return;
    }
    try {
      const now = new Date().toISOString();
      const approverId = adminProfile?.id ?? null;
      const approverName = adminProfile?.full_name ?? "Block Officer";

      const { error } = await supabase
        .from("activities")
        .update({
          status: decision,
          comment: reviewComment.trim() || null,
          approved_at: now,
          approved_by: approverId,
        })
        .eq("id", id);
      if (error) throw error;

      // Notify the cadre
      if (activePhoto?.cadre_id) {
        const title = decision === "Approved"
          ? "गतिविधि स्वीकृत / Activity Approved"
          : "गतिविधि अस्वीकृत / Activity Rejected";
        const message = decision === "Approved"
          ? `आपकी ${activePhoto.date} की '${activePhoto.type}' गतिविधि ${approverName} द्वारा स्वीकृत कर दी गई है। / Your activity '${activePhoto.type}' for ${activePhoto.date} has been approved by ${approverName}.`
          : `आपकी ${activePhoto.date} की '${activePhoto.type}' गतिविधि अस्वीकृत कर दी गई है। कारण: ${reviewComment} / Your activity '${activePhoto.type}' for ${activePhoto.date} has been rejected. Reason: ${reviewComment}`;

        await supabase.from("notifications").insert({
          user_id: activePhoto.cadre_id,
          title,
          message,
          type: decision === "Approved" ? "success" : "error",
          read: false,
        });
      }

      toast.success(
        `साक्ष्य ${decision === "Approved" ? "स्वीकृत" : "अस्वीकृत"} / Evidence ${decision}`,
      );
      setActivePhoto(null);
      setReviewComment("");
      refetchEvidence();
      invalidateConsistencyQueries(qc);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleDeletePhoto = async (photo: any) => {
    if (!photo?.evidence_id) {
      toast.error("Photo metadata was not found. Please refresh and try again.");
      return;
    }
    if (!confirm("Delete this photo? Auto attendance will be removed if no photos remain for this activity.")) {
      return;
    }

    try {
      await deleteEvidenceWithConsistency(
        { id: photo.evidence_id, storage_path: photo.storage_path ?? null },
        qc,
      );
      toast.success("Photo deleted. Attendance was revalidated.");
      setActivePhoto(null);
      setSelectedIds((prev) => prev.filter((id) => id !== photo.id));
      refetchEvidence();
      invalidateConsistencyQueries(qc);
    } catch (err: any) {
      toast.error(`Photo delete failed: ${err.message || err}`);
    }
  };


  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const matchesSearch =
        p.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cadre_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.village.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "All" || p.type === selectedType;
      const matchesBlock =
        selectedBlock === "all" ||
        p.block_id === selectedBlock ||
        p.block.toLowerCase() === selectedBlock.toLowerCase();
      const matchesStatus = selectedStatus === "All" || p.status === selectedStatus;
      const matchesTimeline = !timelineDate || p.date === timelineDate;
      const matchesVO =
        !selectedVO.trim() || p.village.toLowerCase().includes(selectedVO.toLowerCase());

      return (
        matchesSearch &&
        matchesType &&
        matchesBlock &&
        matchesStatus &&
        matchesTimeline &&
        matchesVO
      );
    });
  }, [
    photos,
    searchTerm,
    selectedType,
    selectedBlock,
    selectedStatus,
    selectedVO,
    timelineDate,
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {t("evidence_title")}
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
            Geotagged image monitoring & activity logs review
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="h-10 rounded-xl font-bold shadow-sm flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            {t("download_csv_btn")}
          </Button>

          {/* View Mode Toggle buttons */}
          <div className="flex bg-white border border-slate-100 rounded-xl p-1 shadow-sm gap-1 text-xs shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-lg p-2 transition-all",
                viewMode === "grid"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-50",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-lg p-2 transition-all",
                viewMode === "list"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-50",
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Date Timeline Sparkline Slider */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 text-xs font-bold">
        <span className="text-slate-400 uppercase tracking-wide shrink-0">
          {t("timeline_label2")}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTimelineDate(null)}
            className={cn(
              "rounded-lg border px-3 py-1.5",
              !timelineDate
                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100",
            )}
          >
            {t("all_dates_label")}
          </button>
          {timeline.map((t) => (
            <button
              key={t.date}
              onClick={() => setTimelineDate(t.date)}
              className={cn(
                "rounded-lg border px-3 py-1.5 flex items-center gap-1.5 transition-colors",
                timelineDate === t.date
                  ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                  : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100",
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              {t.date} ({t.count} files)
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Filter and Content columns */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Col: Filters Panel (col-span-3) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4 text-xs font-bold text-slate-700">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
            <Filter className="h-4 w-4 text-slate-400" />
            {t("filter_panel_title")}
          </h3>

          {/* Search caption */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-slate-400 font-bold">{t("search_text_label")}</Label>
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search caption, cadre..."
                className="h-9 rounded-lg border-slate-200 pl-8 text-xs"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Block filter */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-slate-400 font-bold">{t("block_label2")}</Label>
            <Select value={selectedBlock} onValueChange={setSelectedBlock}>
              <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_blocks_label")}</SelectItem>
                {(blocks ?? []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VO / Village search */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-slate-400 font-bold">{t("vo_village_label")}</Label>
            <Input
              value={selectedVO}
              onChange={(e) => setSelectedVO(e.target.value)}
              placeholder="e.g. Rampur"
              className="h-9 rounded-lg border-slate-200 text-xs"
            />
          </div>

          {/* Activity Type select */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-slate-400 font-bold">{t("activity_type_label3")}</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t("all_types_label")}</SelectItem>
                <SelectItem value="SHG Meeting">SHG Meeting</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Bank Linkage">Bank Linkage</SelectItem>
                <SelectItem value="Record Verification">Record Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Approval Status filter */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-slate-400 font-bold">{t("status_label2")}</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t("all_statuses_label")}</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full h-9 rounded-lg text-xs"
              onClick={() => {
                setSearchTerm("");
                setSelectedType("All");
                setSelectedBlock("all");
                setSelectedStatus("All");
                setSelectedVO("");
                setTimelineDate(null);
                toast.success(t("filters_reset"));
              }}
            >
              {t("reset_filters_label")}
            </Button>
          </div>
        </div>

        {/* Right Col: Media Grid/List Content (col-span-9) */}
        <div className="lg:col-span-9 space-y-4">
          {viewMode === "grid" && (
            /* Grid Layout */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPhotos.map((photo) => {
                const isSelected = selectedIds.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    className={cn(
                      "group relative rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-all",
                      isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-100",
                    )}
                  >
                    {/* Checkbox item */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectToggle(photo.id)}
                        className="h-4.5 w-4.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Image Area */}
                    <div
                      className="relative aspect-video bg-slate-100 overflow-hidden cursor-pointer"
                      onClick={() => setActivePhoto(photo)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const t = e.currentTarget;
                          t.style.display = "none";
                          t.parentElement?.classList.add("broken-img");
                        }}
                      />
                      {photo.isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md">
                            <span className="ml-0.5 text-xs">▶</span>
                          </div>
                        </div>
                      )}
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                        {photo.type}
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeletePhoto(photo);
                        }}
                        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Meta Info */}
                    <div className="p-3.5 text-xs font-bold leading-normal text-slate-700">
                      <h4 className="font-extrabold text-slate-800 truncate">{photo.caption}</h4>
                      <div className="flex items-center gap-1.5 text-slate-400 font-semibold mt-1">
                        <span>{photo.date}</span>
                        <span>•</span>
                        <span className="truncate">
                          {photo.cadre_name} ({photo.role})
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {photo.village}, {photo.block}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide",
                            photo.status === "Pending" && "bg-amber-50 text-amber-600",
                            photo.status === "Approved" && "bg-emerald-50 text-emerald-600",
                            photo.status === "Rejected" && "bg-rose-50 text-rose-600",
                          )}
                        >
                          {photo.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === "list" && (
            /* List Layout */
            <div className="space-y-4">
              {/* Mobile Card Deck View */}
              <div className="block md:hidden space-y-4">
                {filteredPhotos.map((photo) => {
                  const isSelected = selectedIds.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      className={cn(
                        "rounded-xl border p-4 shadow-sm bg-slate-50/30 space-y-3 text-xs font-bold text-slate-700",
                        isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-100",
                      )}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectToggle(photo.id)}
                            className="h-4.5 w-4.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-extrabold text-sm text-slate-800 truncate max-w-[150px]">
                            {photo.caption}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "rounded px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                            photo.status === "Pending" && "bg-amber-50 text-amber-600",
                            photo.status === "Approved" && "bg-emerald-50 text-emerald-600",
                            photo.status === "Rejected" && "bg-rose-50 text-rose-600",
                          )}
                        >
                          {photo.status}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <div
                          className="h-14 w-20 shrink-0 rounded-lg bg-slate-100 overflow-hidden border border-slate-100 cursor-pointer"
                          onClick={() => setActivePhoto(photo)}
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const t = e.currentTarget;
                              t.style.display = "none";
                              t.parentElement?.classList.add("broken-img");
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 flex-1">
                          <div className="flex flex-col">
                            <span className="text-slate-400 text-[9px] uppercase">Cadre</span>
                            <span className="font-bold text-slate-700 truncate">
                              {photo.cadre_name} ({photo.role})
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-400 text-[9px] uppercase">Date</span>
                            <span className="font-bold text-slate-700">{photo.date}</span>
                          </div>
                          <div className="flex flex-col pt-1">
                            <span className="text-slate-400 text-[9px] uppercase">Location</span>
                            <span className="font-bold text-slate-700 truncate">
                              {photo.village}, {photo.block}
                            </span>
                          </div>
                          <div className="flex flex-col pt-1">
                            <span className="text-slate-400 text-[9px] uppercase">Type</span>
                            <span className="font-bold text-slate-700">{photo.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end border-t border-slate-100 pt-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePhoto(photo)}
                          className="h-8 rounded-lg text-[11px] font-bold"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete Photo
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {filteredPhotos.length === 0 && (
                  <div className="text-center py-6 text-slate-400 font-semibold bg-white border border-slate-100 rounded-xl">
                    {t("no_evidence_label")}
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                        <th className="py-2.5 pl-4 w-8">
                          <input
                            type="checkbox"
                            checked={
                              selectedIds.length === filteredPhotos.length &&
                              filteredPhotos.length > 0
                            }
                            onChange={handleSelectAll}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5">{t("col_preview2")}</th>
                        <th className="py-2.5">{t("col_caption2")}</th>
                        <th className="py-2.5">{t("col_cadre2")}</th>
                        <th className="py-2.5">{t("col_location2")}</th>
                        <th className="py-2.5">{t("col_type2")}</th>
                        <th className="py-2.5">{t("col_date2")}</th>
                        <th className="py-2.5">{t("col_status2")}</th>
                        <th className="py-2.5 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredPhotos.map((photo) => {
                        const isSelected = selectedIds.includes(photo.id);
                        return (
                          <tr
                            key={photo.id}
                            className={cn(
                              "hover:bg-slate-50/50 transition-colors",
                              isSelected && "bg-blue-50/10",
                            )}
                          >
                            <td className="py-3 pl-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectToggle(photo.id)}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3">
                              <div
                                className="h-11 w-16 rounded-lg bg-slate-100 overflow-hidden border border-slate-100 cursor-pointer"
                                onClick={() => setActivePhoto(photo)}
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.caption}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const t = e.currentTarget;
                                    t.style.display = "none";
                                    t.parentElement?.classList.add("broken-img");
                                  }}
                                />
                              </div>
                            </td>
                            <td className="py-3 font-bold text-slate-700">{photo.caption}</td>
                            <td className="py-3 text-slate-500 font-semibold">
                              {photo.cadre_name} ({photo.role})
                            </td>
                            <td className="py-3 text-slate-600 font-semibold">
                              {photo.village}, {photo.block}
                            </td>
                            <td className="py-3 font-bold text-slate-800">{photo.type}</td>
                            <td className="py-3 text-slate-500 font-semibold">{photo.date}</td>
                            <td className="py-3">
                              <span
                                className={cn(
                                  "rounded px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                                  photo.status === "Pending" && "bg-amber-50 text-amber-700",
                                  photo.status === "Approved" && "bg-emerald-50 text-emerald-700",
                                  photo.status === "Rejected" && "bg-rose-50 text-rose-700",
                                )}
                              >
                                {photo.status}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeletePhoto(photo)}
                                className="h-8 w-8 p-0 rounded-lg"
                                title="Delete photo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {filteredPhotos.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-400 font-semibold">
              कोई साक्ष्य नहीं मिला / No evidence media matching filters
            </div>
          )}
        </div>
      </div>

      {/* Floating bulk actions toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl px-6 py-4 shadow-xl border border-slate-800 flex items-center gap-5 justify-between max-w-lg w-full animate-bounce-short">
          <div className="text-xs font-bold leading-normal">
            <span className="text-emerald-400 text-sm font-black mr-1">{selectedIds.length}</span>
            साक्ष्य चयनित / Items selected
          </div>
          <div className="flex gap-2 text-xs">
            <Button
              onClick={() => handleBulkAction("Rejected")}
              className="h-8 rounded-lg bg-rose-600 hover:bg-rose-700 font-bold px-3 text-[11px]"
            >
              <X className="mr-1 h-3.5 w-3.5" /> Bulk Reject
            </Button>
            <Button
              onClick={() => handleBulkAction("Approved")}
              className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold px-3 text-[11px]"
            >
              <Check className="mr-1 h-3.5 w-3.5" /> Bulk Approve
            </Button>
          </div>
        </div>
      )}

      {/* Lightbox details modal */}
      <Dialog
        open={!!activePhoto}
        onOpenChange={() => {
          setActivePhoto(null);
          setReviewComment("");
        }}
      >
        {activePhoto && (
          <DialogContent className="max-w-3xl rounded-2xl p-0 overflow-hidden shadow-2xl border border-slate-100">
            <DialogHeader className="border-b border-slate-50 p-4">
              <DialogTitle className="text-base font-black text-slate-800">
                साक्ष्य विवरण / Photo Evidence Details
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col md:flex-row gap-0">
              {/* Left Col: Photo/Video aspect */}
              <div className="flex-1 bg-slate-950 flex flex-col justify-center items-center p-3 relative aspect-video md:aspect-auto">
                {activePhoto.isVideo ? (
                  <div className="w-full h-full min-h-[250px] flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-lg p-4 relative">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-800 shadow cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => toast.info("वीडियो लोड हो रहा है... / Loading video")}
                    >
                      <span className="ml-1 text-sm">▶</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold mt-2">
                      वीडियो लोड हो रहा है... / Play Video Proof
                    </span>
                    {/* Timestamp overlay */}
                    <div className="absolute top-2 left-2 bg-black/60 text-[9px] text-white px-2 py-0.5 rounded font-mono">
                      {activePhoto.date} 14:20:00
                    </div>
                  </div>
                ) : (
                  <img
                    src={activePhoto.url}
                    alt={activePhoto.caption}
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      const t = e.currentTarget;
                      t.style.display = "none";
                      const parent = t.parentElement;
                      if (parent && !parent.querySelector(".img-broken-notice")) {
                        const notice = document.createElement("div");
                        notice.className = "img-broken-notice flex flex-col items-center justify-center gap-2 text-slate-400";
                        notice.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><span class="text-xs font-semibold">Image unavailable</span>`;
                        parent.appendChild(notice);
                      }
                    }}
                  />
                )}
                <span className="absolute bottom-4 right-4 bg-black/60 text-white font-bold rounded px-2.5 py-0.5 text-[9px] uppercase tracking-wider">
                  {activePhoto.type}
                </span>
              </div>

              {/* Right Col: Details / approval inputs */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-100 p-5 space-y-4 text-xs font-bold text-slate-700 flex flex-col justify-between bg-white max-h-[480px] overflow-y-auto">
                <div className="space-y-4">
                  {/* Headline */}
                  <div>
                    <h3 className="font-black text-slate-800 text-sm leading-snug">
                      {activePhoto.caption}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 shrink-0" />
                      {activePhoto.village}, {activePhoto.block}
                    </p>
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-2.5 border-t border-b border-slate-50 py-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">
                        Cadre Name
                      </span>
                      <span className="text-slate-800 font-extrabold">
                        {activePhoto.cadre_name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">
                        Join Date / Role
                      </span>
                      <span className="text-slate-600 font-bold">
                        {activePhoto.date} ({activePhoto.role})
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">
                        GPS Geotag coords
                      </span>
                      <span className="text-slate-600 font-bold">
                        {typeof activePhoto.latitude === "number" && typeof activePhoto.longitude === "number"
                          ? `${activePhoto.latitude.toFixed(4)}, ${activePhoto.longitude.toFixed(4)}`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">
                        Beneficiaries
                      </span>
                      <span className="text-slate-800 font-black">
                        {activePhoto.num_beneficiaries} members
                      </span>
                    </div>
                  </div>

                  {/* Description text */}
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold text-[10px] uppercase">
                      विवरण / Description
                    </p>
                    <p className="text-slate-500 font-semibold leading-relaxed font-mono text-[10px]">
                      {activePhoto.description}
                    </p>
                  </div>

                  {/* Review inputs */}
                  {activePhoto.status === "Pending" ? (
                    <div className="space-y-2">
                      <Label className="text-slate-400 font-bold text-[10px] uppercase">
                        अनुमोदक टिप्पणी / Review Remarks
                      </Label>
                      <Input
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Remarks (Required for reject...)"
                        className="h-9 rounded-lg border-slate-200 text-xs"
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-3 text-xs leading-normal">
                      <p className="text-slate-400 font-bold text-[9px] uppercase">
                        Review Comment
                      </p>
                      <p className="text-slate-600 font-bold italic">
                        {activePhoto.comment || "कोई टिप्पणी नहीं / No comments"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="border-t border-slate-100 pt-4 mt-6 flex gap-2.5 justify-between">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("लिंक कॉपी किया गया / Link copied to clipboard");
                    }}
                    variant="outline"
                    className="h-9 w-9 p-0 rounded-lg shrink-0 border-slate-200 text-slate-500 hover:text-slate-800"
                    title="Share link"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeletePhoto(activePhoto)}
                    variant="destructive"
                    className="h-9 w-9 p-0 rounded-lg shrink-0"
                    title="Delete photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  {activePhoto.status === "Pending" ? (
                    <div className="flex gap-2 w-full">
                      <Button
                        onClick={() => handleSingleDecision(activePhoto.id, "Rejected")}
                        className="flex-1 h-9 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs"
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleSingleDecision(activePhoto.id, "Approved")}
                        className="flex-1 h-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs"
                      >
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setActivePhoto(null)}
                      className="w-full h-9 rounded-lg text-xs font-bold"
                    >
                      बंद करें / Close
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
