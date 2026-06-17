import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle } from "./dialog-9txPz7Ln.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { a as useProfile } from "./use-auth-DM5yQtMG.mjs";
import { u as useT } from "./router-yzFmt3hU.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { a1 as Download, a4 as LayoutGrid, a5 as List, _ as Calendar, a6 as Funnel, $ as Search, M as MapPin, X, k as Check, a7 as Building, a8 as Share2 } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tailwind-merge.mjs";
function EvidencePage() {
  const [viewMode, setViewMode] = reactExports.useState("grid");
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [selectedType, setSelectedType] = reactExports.useState("All");
  const [selectedBlock, setSelectedBlock] = reactExports.useState("all");
  const [selectedStatus, setSelectedStatus] = reactExports.useState("All");
  const [selectedVO, setSelectedVO] = reactExports.useState("");
  const [timelineDate, setTimelineDate] = reactExports.useState(null);
  const [selectedIds, setSelectedIds] = reactExports.useState([]);
  const [activePhoto, setActivePhoto] = reactExports.useState(null);
  const [reviewComment, setReviewComment] = reactExports.useState("");
  const {
    data: adminProfile
  } = useProfile();
  const {
    t
  } = useT();
  const {
    data: blocks
  } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => (await supabase.from("blocks").select("id,name").order("name")).data ?? []
  });
  const {
    data: photos = [],
    isLoading: isLoadingEvidence,
    refetch: refetchEvidence
  } = useQuery({
    queryKey: ["evidence-gallery", blocks],
    queryFn: async () => {
      const {
        data: activities,
        error
      } = await supabase.from("activities").select("*, profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type), blocks(name)").order("submitted_at", {
        ascending: false
      });
      if (error) throw error;
      const filtered = (activities ?? []).filter((a) => !!a.photo_url);
      return filtered.map((a) => ({
        id: a.id,
        cadre_id: a.cadre_id,
        url: a.photo_url || "",
        caption: a.description || a.activity_type.replace(/_/g, " "),
        cadre_name: a.profiles?.full_name || "Unknown Cadre",
        role: a.profiles?.cadre_type || "PRP",
        date: a.activity_date,
        type: a.activity_type.replace(/_/g, " "),
        village: a.village_name,
        // Use the joined blocks.name; no stale blockMap closure needed
        block: a.blocks?.name || "Unknown Block",
        block_id: a.block_id || "",
        status: a.status || "Pending",
        latitude: 20.27,
        longitude: 81.25,
        description: a.description || "",
        num_beneficiaries: a.beneficiaries || 0,
        pdf_url: a.pdf_url || "",
        isVideo: false
      }));
    },
    enabled: true
  });
  const timeline = reactExports.useMemo(() => {
    const dateMap = /* @__PURE__ */ new Map();
    photos.forEach((p) => {
      dateMap.set(p.date, (dateMap.get(p.date) || 0) + 1);
    });
    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  }, [photos]);
  const handleSelectToggle = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };
  const handleSelectAll = () => {
    if (selectedIds.length === filteredPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPhotos.map((p) => p.id));
    }
  };
  const handleBulkAction = async (decision) => {
    if (selectedIds.length === 0) return;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const approverId = adminProfile?.id ?? null;
    const approverName = adminProfile?.full_name ?? "Block Officer";
    const bulkComment = decision === "Rejected" ? "Bulk rejected by admin" : null;
    try {
      const {
        error
      } = await supabase.from("activities").update({
        status: decision,
        comment: bulkComment,
        approved_at: now,
        approved_by: approverId
      }).in("id", selectedIds);
      if (error) throw error;
      const affected = photos.filter((p) => selectedIds.includes(p.id));
      const notifications = affected.map((p) => ({
        user_id: p.cadre_id,
        title: decision === "Approved" ? "गतिविधि स्वीकृत / Activity Approved" : "गतिविधि अस्वीकृत / Activity Rejected",
        message: decision === "Approved" ? `आपकी ${p.date} की '${p.type}' गतिविधि ${approverName} द्वारा स्वीकृत कर दी गई है। / Your activity '${p.type}' for ${p.date} has been approved by ${approverName}.` : `आपकी ${p.date} की '${p.type}' गतिविधि अस्वीकृत कर दी गई है। / Your activity '${p.type}' for ${p.date} has been rejected.`,
        type: decision === "Approved" ? "success" : "error",
        read: false
      }));
      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }
      toast.success(`${selectedIds.length} साक्ष्य ${decision === "Approved" ? "स्वीकृत" : "अस्वीकृत"} / Bulk ${decision}`);
      setSelectedIds([]);
      refetchEvidence();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };
  const handleExportCSV = () => {
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const headers = "Caption,Cadre Name,Role,Block,Village,Date,Activity Type,Beneficiaries,Photo URL,Status\n";
    const rows = filteredPhotos.map((p) => [esc(p.caption), esc(p.cadre_name), esc(p.role), esc(p.block), esc(p.village), esc(p.date), esc(p.type), p.num_beneficiaries, esc(p.url), esc(p.status)].join(",")).join("\n");
    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    link.setAttribute("download", `evidence_gallery_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filteredPhotos.length} ${t("csv_exported")}`);
  };
  const handleSingleDecision = async (id, decision) => {
    if (decision === "Rejected" && !reviewComment.trim()) {
      toast.error("अस्वीकार करने के लिए टिप्पणी आवश्यक है / Rejection comment is required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const approverId = adminProfile?.id ?? null;
      const approverName = adminProfile?.full_name ?? "Block Officer";
      const {
        error
      } = await supabase.from("activities").update({
        status: decision,
        comment: reviewComment.trim() || null,
        approved_at: now,
        approved_by: approverId
      }).eq("id", id);
      if (error) throw error;
      if (activePhoto?.cadre_id) {
        const title = decision === "Approved" ? "गतिविधि स्वीकृत / Activity Approved" : "गतिविधि अस्वीकृत / Activity Rejected";
        const message = decision === "Approved" ? `आपकी ${activePhoto.date} की '${activePhoto.type}' गतिविधि ${approverName} द्वारा स्वीकृत कर दी गई है। / Your activity '${activePhoto.type}' for ${activePhoto.date} has been approved by ${approverName}.` : `आपकी ${activePhoto.date} की '${activePhoto.type}' गतिविधि अस्वीकृत कर दी गई है। कारण: ${reviewComment} / Your activity '${activePhoto.type}' for ${activePhoto.date} has been rejected. Reason: ${reviewComment}`;
        await supabase.from("notifications").insert({
          user_id: activePhoto.cadre_id,
          title,
          message,
          type: decision === "Approved" ? "success" : "error",
          read: false
        });
      }
      toast.success(`साक्ष्य ${decision === "Approved" ? "स्वीकृत" : "अस्वीकृत"} / Evidence ${decision}`);
      setActivePhoto(null);
      setReviewComment("");
      refetchEvidence();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };
  const filteredPhotos = reactExports.useMemo(() => {
    return photos.filter((p) => {
      const matchesSearch = p.caption.toLowerCase().includes(searchTerm.toLowerCase()) || p.cadre_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.village.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "All" || p.type === selectedType;
      const matchesBlock = selectedBlock === "all" || p.block_id === selectedBlock || p.block.toLowerCase() === selectedBlock.toLowerCase();
      const matchesStatus = selectedStatus === "All" || p.status === selectedStatus;
      const matchesTimeline = !timelineDate || p.date === timelineDate;
      const matchesVO = !selectedVO.trim() || p.village.toLowerCase().includes(selectedVO.toLowerCase());
      return matchesSearch && matchesType && matchesBlock && matchesStatus && matchesTimeline && matchesVO;
    });
  }, [photos, searchTerm, selectedType, selectedBlock, selectedStatus, selectedVO, timelineDate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black text-slate-800 tracking-tight", children: t("evidence_title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: "Geotagged image monitoring & activity logs review" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleExportCSV, variant: "outline", className: "h-10 rounded-xl font-bold shadow-sm flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
          t("download_csv_btn")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-white border border-slate-100 rounded-xl p-1 shadow-sm gap-1 text-xs shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setViewMode("grid"), className: cn("rounded-lg p-2 transition-all", viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setViewMode("list"), className: cn("rounded-lg p-2 transition-all", viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "h-4 w-4" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 text-xs font-bold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 uppercase tracking-wide shrink-0", children: t("timeline_label2") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTimelineDate(null), className: cn("rounded-lg border px-3 py-1.5", !timelineDate ? "bg-slate-900 border-slate-900 text-white shadow-sm" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"), children: t("all_dates_label") }),
        timeline.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setTimelineDate(t2.date), className: cn("rounded-lg border px-3 py-1.5 flex items-center gap-1.5 transition-colors", timelineDate === t2.date ? "bg-slate-900 border-slate-900 text-white shadow-sm" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3.5 w-3.5" }),
          t2.date,
          " (",
          t2.count,
          " files)"
        ] }, t2.date))
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4 text-xs font-bold text-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-4 w-4 text-slate-400" }),
          t("filter_panel_title")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold", children: t("search_text_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: "Search caption, cadre...", className: "h-9 rounded-lg border-slate-200 pl-8 text-xs" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold", children: t("block_label2") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedBlock, onValueChange: setSelectedBlock, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: t("all_blocks_label") }),
              (blocks ?? []).map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: b.id, children: b.name }, b.id)),
              (blocks ?? []).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "dantewada-mock", children: "Dantewada" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "geedam-mock", children: "Geedam" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "kuakonda-mock", children: "Kuakonda" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "katekalyan-mock", children: "Katekalyan" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold", children: t("vo_village_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: selectedVO, onChange: (e) => setSelectedVO(e.target.value), placeholder: "e.g. Rampur", className: "h-9 rounded-lg border-slate-200 text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold", children: t("activity_type_label3") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedType, onValueChange: setSelectedType, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: t("all_types_label") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "SHG Meeting", children: "SHG Meeting" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Training", children: "Training" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Bank Linkage", children: "Bank Linkage" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Record Verification", children: "Record Verification" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold", children: t("status_label2") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedStatus, onValueChange: setSelectedStatus, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: t("all_statuses_label") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Pending", children: "Pending" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Approved", children: "Approved" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Rejected", children: "Rejected" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "w-full h-9 rounded-lg text-xs", onClick: () => {
          setSearchTerm("");
          setSelectedType("All");
          setSelectedBlock("all");
          setSelectedStatus("All");
          setSelectedVO("");
          setTimelineDate(null);
          toast.success(t("filters_reset"));
        }, children: t("reset_filters_label") }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-9 space-y-4", children: [
        viewMode === "grid" && /* Grid Layout */
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: filteredPhotos.map((photo) => {
          const isSelected = selectedIds.includes(photo.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("group relative rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-all", isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-100"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2.5 left-2.5 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: isSelected, onChange: () => handleSelectToggle(photo.id), className: "h-4.5 w-4.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative aspect-video bg-slate-100 overflow-hidden cursor-pointer", onClick: () => setActivePhoto(photo), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: photo.url, alt: photo.caption, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", onError: (e) => {
                const t2 = e.currentTarget;
                t2.style.display = "none";
                t2.parentElement?.classList.add("broken-img");
              } }),
              photo.isVideo && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-0.5 text-xs", children: "▶" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider", children: photo.type })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 text-xs font-bold leading-normal text-slate-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-extrabold text-slate-800 truncate", children: photo.caption }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-slate-400 font-semibold mt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: photo.date }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
                  photo.cadre_name,
                  " (",
                  photo.role,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-slate-400 font-semibold flex items-center gap-1 truncate", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3 shrink-0" }),
                  photo.village,
                  ", ",
                  photo.block
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide", photo.status === "Pending" && "bg-amber-50 text-amber-600", photo.status === "Approved" && "bg-emerald-50 text-emerald-600", photo.status === "Rejected" && "bg-rose-50 text-rose-600"), children: photo.status })
              ] })
            ] })
          ] }, photo.id);
        }) }),
        viewMode === "list" && /* List Layout */
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "block md:hidden space-y-4", children: [
            filteredPhotos.map((photo) => {
              const isSelected = selectedIds.includes(photo.id);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("rounded-xl border p-4 shadow-sm bg-slate-50/30 space-y-3 text-xs font-bold text-slate-700", isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-100"), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: isSelected, onChange: () => handleSelectToggle(photo.id), className: "h-4.5 w-4.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-extrabold text-sm text-slate-800 truncate max-w-[150px]", children: photo.caption })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider", photo.status === "Pending" && "bg-amber-50 text-amber-600", photo.status === "Approved" && "bg-emerald-50 text-emerald-600", photo.status === "Rejected" && "bg-rose-50 text-rose-600"), children: photo.status })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-20 shrink-0 rounded-lg bg-slate-100 overflow-hidden border border-slate-100 cursor-pointer", onClick: () => setActivePhoto(photo), children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: photo.url, alt: photo.caption, className: "h-full w-full object-cover", onError: (e) => {
                    const t2 = e.currentTarget;
                    t2.style.display = "none";
                    t2.parentElement?.classList.add("broken-img");
                  } }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 flex-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[9px] uppercase", children: "Cadre" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-slate-700 truncate", children: [
                        photo.cadre_name,
                        " (",
                        photo.role,
                        ")"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[9px] uppercase", children: "Date" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: photo.date })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[9px] uppercase", children: "Location" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-slate-700 truncate", children: [
                        photo.village,
                        ", ",
                        photo.block
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[9px] uppercase", children: "Type" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: photo.type })
                    ] })
                  ] })
                ] })
              ] }, photo.id);
            }),
            filteredPhotos.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-6 text-slate-400 font-semibold bg-white border border-slate-100 rounded-xl", children: t("no_evidence_label") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 pl-4 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: selectedIds.length === filteredPhotos.length && filteredPhotos.length > 0, onChange: handleSelectAll, className: "h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5", children: t("col_preview2") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5", children: t("col_caption2") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5", children: t("col_cadre2") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5", children: t("col_location2") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5", children: t("col_type2") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5", children: t("col_date2") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5", children: t("col_status2") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: filteredPhotos.map((photo) => {
              const isSelected = selectedIds.includes(photo.id);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: cn("hover:bg-slate-50/50 transition-colors", isSelected && "bg-blue-50/10"), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pl-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: isSelected, onChange: () => handleSelectToggle(photo.id), className: "h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-11 w-16 rounded-lg bg-slate-100 overflow-hidden border border-slate-100 cursor-pointer", onClick: () => setActivePhoto(photo), children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: photo.url, alt: photo.caption, className: "h-full w-full object-cover", onError: (e) => {
                  const t2 = e.currentTarget;
                  t2.style.display = "none";
                  t2.parentElement?.classList.add("broken-img");
                } }) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-bold text-slate-700", children: photo.caption }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-3 text-slate-500 font-semibold", children: [
                  photo.cadre_name,
                  " (",
                  photo.role,
                  ")"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-3 text-slate-600 font-semibold", children: [
                  photo.village,
                  ", ",
                  photo.block
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-bold text-slate-800", children: photo.type }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-slate-500 font-semibold", children: photo.date }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider", photo.status === "Pending" && "bg-amber-50 text-amber-700", photo.status === "Approved" && "bg-emerald-50 text-emerald-700", photo.status === "Rejected" && "bg-rose-50 text-rose-700"), children: photo.status }) })
              ] }, photo.id);
            }) })
          ] }) }) })
        ] }),
        filteredPhotos.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-400 font-semibold", children: "कोई साक्ष्य नहीं मिला / No evidence media matching filters" })
      ] })
    ] }),
    selectedIds.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl px-6 py-4 shadow-xl border border-slate-800 flex items-center gap-5 justify-between max-w-lg w-full animate-bounce-short", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-bold leading-normal", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-400 text-sm font-black mr-1", children: selectedIds.length }),
        "साक्ष्य चयनित / Items selected"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => handleBulkAction("Rejected"), className: "h-8 rounded-lg bg-rose-600 hover:bg-rose-700 font-bold px-3 text-[11px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "mr-1 h-3.5 w-3.5" }),
          " Bulk Reject"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => handleBulkAction("Approved"), className: "h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold px-3 text-[11px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-1 h-3.5 w-3.5" }),
          " Bulk Approve"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!activePhoto, onOpenChange: () => {
      setActivePhoto(null);
      setReviewComment("");
    }, children: activePhoto && /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-3xl rounded-2xl p-0 overflow-hidden shadow-2xl border border-slate-100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { className: "border-b border-slate-50 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-base font-black text-slate-800", children: "साक्ष्य विवरण / Photo Evidence Details" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row gap-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 bg-slate-950 flex flex-col justify-center items-center p-3 relative aspect-video md:aspect-auto", children: [
          activePhoto.isVideo ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full min-h-[250px] flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-lg p-4 relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-800 shadow cursor-pointer hover:scale-105 transition-transform", onClick: () => toast.info("वीडियो लोड हो रहा है... / Play mock video"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-sm", children: "▶" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400 font-semibold mt-2", children: "वीडियो लोड हो रहा है... / Play Video Proof" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-2 left-2 bg-black/60 text-[9px] text-white px-2 py-0.5 rounded font-mono", children: [
              activePhoto.date,
              " 14:20:00"
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: activePhoto.url, alt: activePhoto.caption, className: "w-full h-full object-contain rounded-lg", onError: (e) => {
            const t2 = e.currentTarget;
            t2.style.display = "none";
            const parent = t2.parentElement;
            if (parent && !parent.querySelector(".img-broken-notice")) {
              const notice = document.createElement("div");
              notice.className = "img-broken-notice flex flex-col items-center justify-center gap-2 text-slate-400";
              notice.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><span class="text-xs font-semibold">Image unavailable</span>`;
              parent.appendChild(notice);
            }
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-4 right-4 bg-black/60 text-white font-bold rounded px-2.5 py-0.5 text-[9px] uppercase tracking-wider", children: activePhoto.type })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-100 p-5 space-y-4 text-xs font-bold text-slate-700 flex flex-col justify-between bg-white max-h-[480px] overflow-y-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-black text-slate-800 text-sm leading-snug", children: activePhoto.caption }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-slate-400 font-semibold uppercase mt-0.5 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Building, { className: "h-3.5 w-3.5 shrink-0" }),
                activePhoto.village,
                ", ",
                activePhoto.block
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5 border-t border-b border-slate-50 py-3.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-bold text-[10px] uppercase", children: "Cadre Name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-800 font-extrabold", children: activePhoto.cadre_name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-bold text-[10px] uppercase", children: "Join Date / Role" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-600 font-bold", children: [
                  activePhoto.date,
                  " (",
                  activePhoto.role,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-bold text-[10px] uppercase", children: "GPS Geotag coords" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-600 font-bold", children: [
                  activePhoto.latitude.toFixed(4),
                  ", ",
                  activePhoto.longitude.toFixed(4)
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-bold text-[10px] uppercase", children: "Beneficiaries" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-800 font-black", children: [
                  activePhoto.num_beneficiaries,
                  " members"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 font-bold text-[10px] uppercase", children: "विवरण / Description" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-semibold leading-relaxed font-mono text-[10px]", children: activePhoto.description })
            ] }),
            activePhoto.status === "Pending" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold text-[10px] uppercase", children: "अनुमोदक टिप्पणी / Review Remarks" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: reviewComment, onChange: (e) => setReviewComment(e.target.value), placeholder: "Remarks (Required for reject...)", className: "h-9 rounded-lg border-slate-200 text-xs" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-50 rounded-xl p-3 text-xs leading-normal", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 font-bold text-[9px] uppercase", children: "Review Comment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600 font-bold italic", children: activePhoto.comment || "कोई टिप्पणी नहीं / No comments" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100 pt-4 mt-6 flex gap-2.5 justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("लिंक कॉपी किया गया / Link copied to clipboard");
            }, variant: "outline", className: "h-9 w-9 p-0 rounded-lg shrink-0 border-slate-200 text-slate-500 hover:text-slate-800", title: "Share link", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4 w-4" }) }),
            activePhoto.status === "Pending" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 w-full", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleSingleDecision(activePhoto.id, "Rejected"), className: "flex-1 h-9 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs", children: "Reject" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleSingleDecision(activePhoto.id, "Approved"), className: "flex-1 h-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs", children: "Approve" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setActivePhoto(null), className: "w-full h-9 rounded-lg text-xs font-bold", children: "बंद करें / Close" })
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  EvidencePage as component
};
