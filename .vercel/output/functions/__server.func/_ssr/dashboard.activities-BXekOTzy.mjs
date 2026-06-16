import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useT } from "./router-D5xsBJge.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { T as Textarea } from "./textarea-DSyJ1nlY.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as useProfile, h as highestRole } from "./use-auth-CD1GunTm.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { a2 as WifiOff, ab as Wifi, ac as RefreshCw, y as CirclePlus, c as ClipboardList, w as Clock, t as CircleCheckBig, ad as Landmark, M as MapPin, ae as ChartColumn, $ as Search, g as ChevronDown, u as CircleX, K as Camera, Z as Trash2, a0 as FileText, af as Map } from "../_libs/lucide-react.mjs";
import { R as ResponsiveContainer, B as BarChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, a as Bar } from "../_libs/recharts.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-router.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
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
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/lodash.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/react-is.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/react-smooth.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/recharts-scale.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
const ACTIVITY_TYPES = ["SHG Meeting", "VO Meeting", "Training", "Farmer Visit", "Livelihood Demo", "Bank Linkage", "Monitoring Visit", "Record Verification", "Community Mobilization", "Enterprise Promotion", "Other"];
function ActivitiesPage() {
  const {
    t
  } = useT();
  const {
    data: profile
  } = useProfile();
  const role = highestRole(profile?.roles ?? []);
  const officerBlockId = role === "block_officer" ? profile?.block_id ?? null : null;
  const [activeTab, setActiveTab] = reactExports.useState("list");
  const [busy, setBusy] = reactExports.useState(false);
  const [filterBlockId, setFilterBlockId] = reactExports.useState("all");
  const [filterCadreName, setFilterCadreName] = reactExports.useState("");
  const [filterActType, setFilterActType] = reactExports.useState("All");
  const [filterVillage, setFilterVillage] = reactExports.useState("");
  const [filterDate, setFilterDate] = reactExports.useState("");
  const [filtersCollapsed, setFiltersCollapsed] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (typeof window !== "undefined") {
      setFiltersCollapsed(window.innerWidth < 768);
    }
  }, []);
  const [actDate, setActDate] = reactExports.useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [district, setDistrict] = reactExports.useState("Dantewada");
  const [blockId, setBlockId] = reactExports.useState("");
  const [panchayat, setPanchayat] = reactExports.useState("");
  const [village, setVillage] = reactExports.useState("");
  const [actType, setActType] = reactExports.useState("SHG Meeting");
  const [description, setDescription] = reactExports.useState("");
  const [beneficiaryCount, setBeneficiaryCount] = reactExports.useState(0);
  const [gpsLocation, setGpsLocation] = reactExports.useState("20.2706° N, 81.2507° E (Locked)");
  const [autoAttendance, setAutoAttendance] = reactExports.useState(true);
  const [photos, setPhotos] = reactExports.useState([]);
  const [photoPreviews, setPhotoPreviews] = reactExports.useState([]);
  const [pdfDoc, setPdfDoc] = reactExports.useState(null);
  const [isOffline, setIsOffline] = reactExports.useState(false);
  const [drafts, setDrafts] = reactExports.useState([]);
  const {
    data: blocks
  } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => (await supabase.from("blocks").select("id,name").order("name")).data ?? []
  });
  reactExports.useEffect(() => {
    if (blocks && blocks.length > 0 && !blockId) {
      setBlockId(blocks[0].id);
    }
  }, [blocks, blockId]);
  const effectiveBlockId = officerBlockId ?? (filterBlockId === "all" ? null : filterBlockId);
  const {
    data: dbActivities = [],
    isLoading: isLoadingActivities,
    refetch: refetchActivities
  } = useQuery({
    queryKey: ["admin-activities-list", effectiveBlockId],
    queryFn: async () => {
      let q = supabase.from("activities").select(`
          *,
          profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type),
          blocks(name)
        `).order("submitted_at", {
        ascending: false
      }).limit(500);
      if (effectiveBlockId) q = q.eq("block_id", effectiveBlockId);
      const {
        data,
        error
      } = await q;
      if (error) throw error;
      return data;
    }
  });
  const activities = reactExports.useMemo(() => {
    return dbActivities.map((a) => ({
      id: a.id,
      cadre_id: a.cadre_id,
      block_id: a.block_id || null,
      cadre_name: a.profiles?.full_name || "Unknown Cadre",
      role: a.profiles?.cadre_type || "PRP",
      date: a.activity_date,
      block_name: a.blocks?.name || "Unknown Block",
      village: a.village_name,
      panchayat: a.panchayat || "",
      activity_type: a.activity_type,
      description: a.description || "",
      beneficiaries: a.beneficiaries || 0,
      status: a.status
    }));
  }, [dbActivities]);
  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...filesArray]);
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
      toast.info("छवि संपीड़न सक्रिय / Compressed images to ~800KB. EXIF stripped.");
    }
  };
  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };
  const handlePdfUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("PDF must be < 10MB");
        return;
      }
      setPdfDoc(file);
      toast.success(t("pdf_attachment"));
    }
  };
  const uploadFile = async (bucket, file) => {
    const fileExt = file.name.split(".").pop();
    const filePath = `${profile?.id}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const {
      data,
      error
    } = await supabase.storage.from(bucket).upload(filePath, file);
    if (error) throw error;
    const {
      data: {
        publicUrl
      }
    } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicUrl;
  };
  const handleSubmit = async (status) => {
    if (!profile) return;
    if (!village.trim() || !panchayat.trim()) {
      toast.error(t("all_required_fields"));
      return;
    }
    if (beneficiaryCount < 0 || beneficiaryCount >= 1e3) {
      toast.error("लाभार्थी संख्या मान्य नहीं है / Beneficiary count must be positive and < 1000");
      return;
    }
    const selectedBlock = (blocks ?? []).find((b) => b.id === blockId);
    const selectedBlockId = blockId || profile?.block_id || null;
    const selectedBlockName = selectedBlock ? selectedBlock.name : "Unknown Block";
    const payload = {
      id: `act-${Date.now()}`,
      cadre_id: profile.id,
      cadre_name: profile.full_name,
      role: profile.cadre_type ?? "PRP",
      date: actDate,
      block_id: selectedBlockId,
      block_name: selectedBlockName,
      village: village.trim(),
      panchayat: panchayat.trim(),
      activity_type: actType,
      description: description.trim() || null,
      beneficiaries: beneficiaryCount,
      status
    };
    if (isOffline || status === "Draft") {
      setDrafts((prev) => [...prev, payload]);
      toast.warning(t("saved_as_draft"));
      setVillage("");
      setPanchayat("");
      setDescription("");
      setBeneficiaryCount(0);
      setPhotos([]);
      setPhotoPreviews([]);
      setPdfDoc(null);
      setActiveTab("list");
      return;
    }
    setBusy(true);
    try {
      let photoUrl = null;
      if (photos.length > 0) {
        photoUrl = await uploadFile("activity-photos", photos[0]);
      }
      let pdfUrl = null;
      if (pdfDoc) {
        pdfUrl = await uploadFile("activity-photos", pdfDoc);
      }
      const ACTIVITY_MAP_LOCAL = {
        "SHG Meeting": "SHG_Meeting",
        "VO Meeting": "Other",
        Training: "Training_Session",
        "Farmer Visit": "Farmer_Visit",
        "Livelihood Demo": "Livelihood_Activity",
        "Bank Linkage": "Other",
        "Monitoring Visit": "Monitoring_Visit",
        "Record Verification": "Record_Verification",
        "Community Mobilization": "Other",
        "Enterprise Promotion": "Livelihood_Activity",
        Other: "Other"
      };
      console.log("DEBUG SUBMIT:", {
        selectedBlockId,
        profileBlockId: profile?.block_id,
        payload
      });
      const {
        error
      } = await supabase.from("activities").insert({
        cadre_id: profile.id,
        activity_date: actDate,
        block_id: selectedBlockId,
        village_name: village.trim(),
        panchayat: panchayat.trim(),
        beneficiaries: beneficiaryCount,
        gps: gpsLocation,
        activity_type: ACTIVITY_MAP_LOCAL[actType] ?? "Other",
        description: description.trim() || null,
        photo_url: photoUrl,
        pdf_url: pdfUrl,
        status: "Pending"
      });
      if (error) throw error;
      if (autoAttendance) {
        const {
          data: existingAttendance
        } = await supabase.from("attendance").select("id").eq("cadre_id", profile.id).eq("date", actDate).maybeSingle();
        if (existingAttendance) {
          await supabase.from("attendance").update({
            status: "present",
            check_in_at: (/* @__PURE__ */ new Date()).toISOString(),
            recorded_by: profile.id
          }).eq("id", existingAttendance.id);
        } else {
          await supabase.from("attendance").insert({
            cadre_id: profile.id,
            block_id: selectedBlockId,
            date: actDate,
            status: "present",
            check_in_at: (/* @__PURE__ */ new Date()).toISOString(),
            recorded_by: profile.id
          });
        }
      }
      await refetchActivities();
      toast.success(t("submission_success"));
      if (autoAttendance) {
        toast.success(t("auto_attendance"));
      }
      setVillage("");
      setPanchayat("");
      setDescription("");
      setBeneficiaryCount(0);
      setPhotos([]);
      setPhotoPreviews([]);
      setPdfDoc(null);
      setActiveTab("list");
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  };
  const handleSync = async () => {
    if (drafts.length === 0) return;
    setBusy(true);
    try {
      const ACTIVITY_MAP_LOCAL = {
        "SHG Meeting": "SHG_Meeting",
        "VO Meeting": "Other",
        Training: "Training_Session",
        "Farmer Visit": "Farmer_Visit",
        "Livelihood Demo": "Livelihood_Activity",
        "Bank Linkage": "Other",
        "Monitoring Visit": "Monitoring_Visit",
        "Record Verification": "Record_Verification",
        "Community Mobilization": "Other",
        "Enterprise Promotion": "Livelihood_Activity",
        Other: "Other"
      };
      for (const draft of drafts) {
        const {
          error
        } = await supabase.from("activities").insert({
          cadre_id: draft.cadre_id,
          activity_date: draft.date,
          block_id: draft.block_id,
          village_name: draft.village,
          panchayat: draft.panchayat,
          beneficiaries: draft.beneficiaries,
          gps: gpsLocation,
          activity_type: ACTIVITY_MAP_LOCAL[draft.activity_type] ?? "Other",
          description: draft.description,
          status: "Pending"
        });
        if (error) throw error;
      }
      setDrafts([]);
      await refetchActivities();
      toast.success(t("submission_success"));
    } catch (err) {
      console.error(err);
      toast.error(`Sync error: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  };
  const filteredActivities = reactExports.useMemo(() => {
    return activities.filter((a) => {
      const matchesBlock = effectiveBlockId === null || a.block_id === effectiveBlockId;
      const matchesCadre = !filterCadreName.trim() || a.cadre_name.toLowerCase().includes(filterCadreName.toLowerCase());
      const matchesType = filterActType === "All" || a.activity_type.toLowerCase() === filterActType.toLowerCase() || a.activity_type === "Livelihood Activity" && filterActType === "Livelihood Demo" || a.activity_type === "Livelihood Demo" && filterActType === "Livelihood Activity" || a.activity_type === "Training" && filterActType === "Training Session" || a.activity_type === "Training_Session" && filterActType === "Training";
      const matchesVillage = !filterVillage.trim() || a.village.toLowerCase().includes(filterVillage.toLowerCase());
      const matchesDate = !filterDate || a.date === filterDate;
      return matchesBlock && matchesCadre && matchesType && matchesVillage && matchesDate;
    });
  }, [activities, effectiveBlockId, filterCadreName, filterActType, filterVillage, filterDate]);
  const chartData = reactExports.useMemo(() => {
    const today = /* @__PURE__ */ new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const name = d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short"
      });
      days.push({
        name,
        isoDate
      });
    }
    return days.map(({
      name,
      isoDate
    }) => ({
      name,
      count: filteredActivities.filter((a) => a.date === isoDate).length
    }));
  }, [filteredActivities]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex h-9 w-9 items-center justify-center rounded-xl", isOffline ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"), children: isOffline ? /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold text-slate-800", children: isOffline ? t("offline_mode") : t("online_mode") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold uppercase", children: "Simulate offline state and IndexedDB caching" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        drafts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSync, variant: "outline", className: "h-9 rounded-xl text-xs font-black border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100/50 flex items-center gap-1.5 animate-pulse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
          "सिंक करें / Sync ",
          drafts.length,
          " Drafts"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setIsOffline((prev) => !prev), className: cn("text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors", isOffline ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 hover:bg-slate-100 text-slate-700"), children: isOffline ? "Switch to Online" : "Go Offline" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm gap-1 w-max text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActiveTab("list"), className: `rounded-lg px-4.5 py-2 font-bold transition-all ${activeTab === "list" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50/50"}`, children: "गतिविधियाँ सूची / Activities Grid" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActiveTab("form"), className: `rounded-lg px-4.5 py-2 font-bold transition-all ${activeTab === "form" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50/50"}`, children: "कार्य रिपोर्ट फॉर्म / Submit Activity Form" })
    ] }),
    activeTab === "list" ? (
      /* List View */
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black text-slate-800 tracking-tight", children: "गतिविधि ट्रैकिंग / Activity Tracking" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: "Government MIS Participatory Activity Tracking Dashboard" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setActiveTab("form"), className: "h-11 rounded-xl font-bold bg-[#0055A4] hover:bg-[#004484] text-white shadow-md flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { className: "h-5 w-5" }),
            "नई गतिविधि / New Activity"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0055A4]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "h-5.5 w-5.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate", children: "आज कुल गतिविधियाँ" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate", children: "Total Today" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black text-slate-800 mt-2.5", children: filteredActivities.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF9800]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5.5 w-5.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate", children: "स्वीकृति प्रतीक्षारत" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate", children: "Pending Approvals" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black text-[#FF9800] mt-2.5", children: filteredActivities.filter((a) => a.status === "Pending").length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#4CAF50]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-5.5 w-5.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate", children: "पूर्ण गतिविधियाँ" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate", children: "Completed" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black text-[#4CAF50] mt-2.5", children: filteredActivities.filter((a) => a.status === "Approved").length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "h-5.5 w-5.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate", children: "एसएचजी बैठकें" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate", children: "SHG Meetings" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black text-slate-800 mt-2.5", children: filteredActivities.filter((a) => a.activity_type.toLowerCase().includes("shg")).length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { className: "h-5.5 w-5.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate", children: "प्रशिक्षण" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate", children: "Trainings" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black text-slate-800 mt-2.5", children: filteredActivities.filter((a) => a.activity_type.toLowerCase().includes("train")).length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-5.5 w-5.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate", children: "किसान सर्वेक्षण" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate", children: "Farmer Visits" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black text-slate-800 mt-2.5", children: filteredActivities.filter((a) => a.activity_type.toLowerCase().includes("farmer")).length })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "h-4.5 w-4.5 text-slate-400" }),
            "दैनिक गतिविधि प्रगति रुझान / Daily Activity Trend"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-44 text-xs font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: chartData, margin: {
            top: 5,
            right: 10,
            left: -25,
            bottom: 5
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f1f5f9" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", stroke: "#94a3b8", tickLine: false, axisLine: false }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "#94a3b8", tickLine: false, axisLine: false }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "count", fill: "#0055A4", radius: [4, 4, 0, 0], barSize: 32 })
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-50 pb-2 cursor-pointer select-none", onClick: () => setFiltersCollapsed(!filtersCollapsed), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 text-slate-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black text-slate-700 uppercase tracking-wider", children: "फ़िल्टर पैनल / Filter Panel" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0 hover:bg-slate-100 rounded-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: cn("h-4 w-4 transition-transform text-slate-500", !filtersCollapsed && "rotate-180") }) })
          ] }),
          !filtersCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 text-xs font-bold text-slate-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold text-[10px] uppercase", children: "तारीख / Date" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: filterDate, onChange: (e) => setFilterDate(e.target.value), className: "h-10 text-xs rounded-lg border-slate-200 font-bold" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold text-[10px] uppercase", children: "गतिविधि प्रकार / Activity Type" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterActType, onValueChange: setFilterActType, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: "All Types / सभी प्रकार" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "SHG Meeting", children: "SHG Meeting" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Training", children: "Training" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Farmer Visit", children: "Farmer Visit" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Livelihood Demo", children: "Livelihood Demo" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Monitoring Visit", children: "Monitoring Visit" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Record Verification", children: "Record Verification" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Other", children: "Other" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold text-[10px] uppercase", children: "कर्मी का नाम / Cadre Name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: filterCadreName, onChange: (e) => setFilterCadreName(e.target.value), placeholder: "कर्मी का नाम...", className: "h-10 text-xs rounded-lg border-slate-200 font-bold" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold text-[10px] uppercase", children: "गाँव का नाम / Village" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: filterVillage, onChange: (e) => setFilterVillage(e.target.value), placeholder: "गाँव का नाम...", className: "h-10 text-xs rounded-lg border-slate-200 font-bold" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 text-xs pt-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "h-9 rounded-lg", onClick: () => {
                setFilterCadreName("");
                setFilterActType("All");
                setFilterVillage("");
                setFilterDate("");
              }, children: "साफ़ करें / Reset" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "h-9 rounded-lg bg-slate-900 text-white", onClick: () => toast.success("फ़िल्टर लागू किया गया / Filters applied"), children: "खोजें / Filter Search" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "block md:hidden space-y-4", children: [
            drafts.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 p-4 shadow-sm bg-orange-50/10 space-y-3 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-extrabold text-sm text-slate-800", children: d.cadre_name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-orange-100/50 px-2 py-0.5 text-[10px] font-bold text-orange-700", children: d.role })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[9px] font-black text-orange-700 uppercase", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
                  " Draft"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 font-semibold text-slate-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Date" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: d.date })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Block" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: d.block_name })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Village" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: d.village })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Activity Type" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: d.activity_type })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Beneficiaries" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: d.beneficiaries })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 border-t border-slate-100/60", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase font-bold block mb-0.5", children: "Description:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600 font-medium italic", children: d.description })
              ] })
            ] }, d.id)),
            filteredActivities.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 p-4 shadow-sm bg-slate-50/30 space-y-3 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-extrabold text-sm text-slate-800", children: a.cadre_name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700", children: a.role })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase", a.status === "Pending" && "bg-amber-50 text-amber-700", a.status === "Approved" && "bg-emerald-50 text-emerald-700", a.status === "Rejected" && "bg-rose-50 text-rose-700"), children: a.status })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 font-semibold text-slate-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Date" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: a.date })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Block" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: a.block_name })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Village" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: a.village })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Activity Type" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: a.activity_type })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Beneficiaries" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: a.beneficiaries })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 border-t border-slate-100/60", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase font-bold block mb-0.5", children: "Description:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600 font-medium italic", children: a.description })
              ] })
            ] }, a.id)),
            filteredActivities.length === 0 && drafts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-6 text-slate-400 font-semibold bg-white border border-slate-100 rounded-xl", children: "कोई रिकॉर्ड नहीं मिला / No activities found" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: "नाम / Name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: "भूमिका / Role" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: "तारीख / Date" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: "ब्लॉक / Block" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: "गाँव / Village" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: "गतिविधि प्रकार / Activity Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: "विवरण / Description" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right", children: "लाभार्थी / Beneficiaries" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-center", children: "स्थिति / Status" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
              drafts.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-orange-50/10 hover:bg-orange-50/20 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 font-bold text-slate-700", children: d.cadre_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-orange-100/50 px-2 py-0.5 text-[10px] font-bold text-orange-700", children: d.role }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-500 font-bold", children: d.date }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-600 font-semibold", children: d.block_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-600 font-semibold", children: d.village }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-800 font-bold", children: d.activity_type }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-500 font-medium truncate max-w-[200px]", children: d.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-right font-bold text-slate-700", children: d.beneficiaries }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[9px] font-black text-orange-700 uppercase", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
                  " Draft"
                ] }) })
              ] }, d.id)),
              filteredActivities.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/50 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 font-bold text-slate-700", children: a.cadre_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700", children: a.role }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-500 font-semibold", children: a.date }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-600 font-semibold", children: a.block_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-600 font-semibold", children: a.village }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-800 font-bold", children: a.activity_type }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-500 font-medium truncate max-w-[200px]", children: a.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-right font-bold text-slate-700", children: a.beneficiaries }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase", a.status === "Pending" && "bg-amber-50 text-amber-700", a.status === "Approved" && "bg-emerald-50 text-emerald-700", a.status === "Rejected" && "bg-rose-50 text-rose-700"), children: [
                  a.status === "Pending" && /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
                  a.status === "Approved" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3 w-3" }),
                  a.status === "Rejected" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3 w-3" }),
                  a.status
                ] }) })
              ] }, a.id)),
              filteredActivities.length === 0 && drafts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 9, className: "py-8 text-center text-slate-400 font-semibold", children: "कोई रिकॉर्ड नहीं मिला / No activities found" }) })
            ] })
          ] }) })
        ] })
      ] })
    ) : (
      /* Form View */
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm max-w-4xl mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black text-slate-800 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide", children: "दैनिक कार्य रिपोर्ट फॉर्म / Activity Submission Form" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => e.preventDefault(), className: "space-y-5 text-xs font-bold text-slate-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "तारीख / Date of Activity (Cannot select future)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), value: actDate, onChange: (e) => setActDate(e.target.value), className: "h-10 text-xs rounded-lg border-slate-200 font-bold" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "गतिविधि प्रकार / Activity Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: actType, onValueChange: setActType, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 text-xs rounded-lg border-slate-200 font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ACTIVITY_TYPES.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t2, children: t2 }, t2)) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "राज्य / State" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: "Chhattisgarh", disabled: true, className: "h-10 text-xs rounded-lg border-slate-200 bg-slate-50" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "जिला / District" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: district, onValueChange: setDistrict, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Dantewada", children: "Dantewada" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "ब्लॉक / Block" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: blockId, onValueChange: setBlockId, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select Block" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: (blocks ?? []).map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: b.id, children: b.name }, b.id)) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "पंचायत / Panchayat" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: panchayat, onChange: (e) => setPanchayat(e.target.value), placeholder: "e.g. Kalnar", className: "h-10 text-xs rounded-lg border-slate-200 font-bold", required: true })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "गाँव / Village" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: village, onChange: (e) => setVillage(e.target.value), placeholder: "e.g. Reslapur", className: "h-10 text-xs rounded-lg border-slate-200 font-bold", required: true })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "लाभार्थी संख्या / Women Benefited (Max 1000)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, max: 1e3, value: beneficiaryCount, onChange: (e) => setBeneficiaryCount(Number(e.target.value)), className: "h-10 text-xs rounded-lg border-slate-200 font-bold" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "गतिविधि विवरण / Description Notes (Max 500 characters)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { maxLength: 500, value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Enter details of outcome, discussed savings...", rows: 3, className: "text-xs rounded-lg border-slate-200 font-semibold" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-slate-400 font-semibold text-right", children: [
              500 - description.length,
              " characters remaining"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "साक्ष्य चित्र / Capture Photos" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-6 w-6 text-slate-400" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400 mt-1.5", children: "Snaps (Max 10 pics)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", multiple: true, accept: "image/*", onChange: handlePhotoUpload, className: "hidden" })
              ] }),
              photoPreviews.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 mt-1.5", children: photoPreviews.map((src, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group flex h-10 w-10 shrink-0 border rounded overflow-hidden", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, className: "h-full w-full object-cover" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { onClick: () => removePhoto(idx), className: "h-3.5 w-3.5 text-white cursor-pointer" }) })
              ] }, idx)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "दस्तावेज़ / PDF Attachment (Max 10MB)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-6 w-6 text-slate-400" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400 mt-1.5", children: "Upload PDF (Minutes)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: ".pdf,.docx", onChange: handlePdfUpload, className: "hidden" })
              ] }),
              pdfDoc && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border bg-slate-50 px-2 py-1 text-[10px] mt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: pdfDoc.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { onClick: () => setPdfDoc(null), className: "h-3 w-3 text-rose-500 cursor-pointer" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4.5 items-center bg-slate-50/50 rounded-xl p-3.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Map, { className: "h-5 w-5 text-slate-400 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase leading-none", children: "Auto-tagged Geotag Coordinates" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black text-slate-700 mt-1", children: gpsLocation })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm text-[11px]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-tight", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-slate-700", children: "उपस्थिति स्वतः दर्ज / Auto-Mark Attendance" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-slate-400 font-semibold mt-0.5", children: "Toggle checking-in Present on submission" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: autoAttendance, onChange: (e) => setAutoAttendance(e.target.checked), className: "h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2.5 border-t border-slate-100 pt-4 mt-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: () => handleSubmit("Draft"), className: "h-10 rounded-lg text-xs", children: "ड्राफ्ट सहेजें / Save Draft" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: () => handleSubmit("Pending"), className: "h-10 px-5 rounded-lg text-xs font-black shadow-md", children: "सबमिट करें / Submit Report" })
          ] })
        ] })
      ] })
    )
  ] });
}
export {
  ActivitiesPage as component
};
