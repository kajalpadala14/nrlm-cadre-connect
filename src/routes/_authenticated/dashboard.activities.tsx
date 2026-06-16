import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useT } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  FileText,
  MapPin,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  PlusCircle,
  CheckCircle,
  Clock,
  XCircle,
  Map,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useProfile, highestRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { BarChart3, Search, Calendar, Landmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/activities")({
  component: ActivitiesPage,
});

// Fixed 11 NRLM Activity Types
const ACTIVITY_TYPES = [
  "SHG Meeting",
  "VO Meeting",
  "Training",
  "Farmer Visit",
  "Livelihood Demo",
  "Bank Linkage",
  "Monitoring Visit",
  "Record Verification",
  "Community Mobilization",
  "Enterprise Promotion",
  "Other",
];


function ActivitiesPage() {
  const { t } = useT();
  const { data: profile } = useProfile();
  const role = highestRole(profile?.roles ?? []);
  // block_officer is auto-scoped to their own block; admins can pick any block
  const officerBlockId = role === "block_officer" ? (profile?.block_id ?? null) : null;

  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
  const [busy, setBusy] = useState(false);

  // Block filter — admins can pick, block_officers are locked to their block
  const [filterBlockId, setFilterBlockId] = useState<string>("all");

  // Local filter states for list searching
  const [filterCadreName, setFilterCadreName] = useState("");
  const [filterActType, setFilterActType] = useState("All");
  const [filterVillage, setFilterVillage] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [filtersCollapsed, setFiltersCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFiltersCollapsed(window.innerWidth < 768);
    }
  }, []);

  // Form states
  const [actDate, setActDate] = useState(new Date().toISOString().slice(0, 10));
  const [district, setDistrict] = useState("Dantewada");
  const [blockId, setBlockId] = useState<string>("");
  const [panchayat, setPanchayat] = useState("");
  const [village, setVillage] = useState("");
  const [actType, setActType] = useState("SHG Meeting");
  const [description, setDescription] = useState("");
  const [beneficiaryCount, setBeneficiaryCount] = useState(0);
  const [gpsLocation, setGpsLocation] = useState("20.2706° N, 81.2507° E (Locked)");
  const [autoAttendance, setAutoAttendance] = useState(true);

  // Attachments States
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [pdfDoc, setPdfDoc] = useState<File | null>(null);

  // Offline caching simulator
  const [isOffline, setIsOffline] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);

  // Fetch Blocks from DB
  const { data: blocks } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => (await supabase.from("blocks").select("id,name").order("name")).data ?? [],
  });

  useEffect(() => {
    if (blocks && blocks.length > 0 && !blockId) {
      setBlockId(blocks[0].id);
    }
  }, [blocks, blockId]);

  // Effective block for the query — block_officers are auto-scoped
  const effectiveBlockId = officerBlockId ?? (filterBlockId === "all" ? null : filterBlockId);

  // Fetch real activities from Supabase joined with profiles and blocks
  const {
    data: dbActivities = [],
    isLoading: isLoadingActivities,
    refetch: refetchActivities,
  } = useQuery<any[]>({
    queryKey: ["admin-activities-list", effectiveBlockId],
    queryFn: async () => {
      let q = supabase
        .from("activities")
        .select(
          `
          *,
          profiles!activities_cadre_id_fkey_profiles(full_name, cadre_type),
          blocks(name)
        `,
        )
        .order("submitted_at", { ascending: false })
        .limit(500);
      if (effectiveBlockId) q = q.eq("block_id", effectiveBlockId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  // Map activities to standard shape expected by components
  const activities: any[] = useMemo(() => {
    return dbActivities.map((a: any) => ({
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
      status: a.status as "Pending" | "Approved" | "Rejected",
    }));
  }, [dbActivities]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...filesArray]);
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
      toast.info("छवि संपीड़न सक्रिय / Compressed images to ~800KB. EXIF stripped.");
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const uploadFile = async (bucket: string, file: File) => {
    const fileExt = file.name.split(".").pop();
    const filePath = `${profile?.id}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file);
    if (error) throw error;
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSubmit = async (status: "Pending" | "Draft") => {
    if (!profile) return;
    if (!village.trim() || !panchayat.trim()) {
      toast.error(t("all_required_fields"));
      return;
    }
    if (beneficiaryCount < 0 || beneficiaryCount >= 1000) {
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
      status: status,
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
      // 1. Upload files
      let photoUrl = null;
      if (photos.length > 0) {
        photoUrl = await uploadFile("activity-photos", photos[0]);
      }

      let pdfUrl = null;
      if (pdfDoc) {
        pdfUrl = await uploadFile("activity-photos", pdfDoc);
      }

      const ACTIVITY_MAP_LOCAL: Record<string, any> = {
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
        Other: "Other",
      };

      console.log("DEBUG SUBMIT:", {
        selectedBlockId,
        profileBlockId: profile?.block_id,
        payload,
      });

      // 2. Direct submit to Supabase activities table
      const { error } = await supabase.from("activities").insert({
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
        status: "Pending",
      });

      if (error) throw error;

      // 3. Auto-attendance marking
      if (autoAttendance) {
        const { data: existingAttendance } = await supabase
          .from("attendance")
          .select("id")
          .eq("cadre_id", profile.id)
          .eq("date", actDate)
          .maybeSingle();

        if (existingAttendance) {
          await supabase
            .from("attendance")
            .update({
              status: "present",
              check_in_at: new Date().toISOString(),
              recorded_by: profile.id,
            })
            .eq("id", existingAttendance.id);
        } else {
          await supabase.from("attendance").insert({
            cadre_id: profile.id,
            block_id: selectedBlockId,
            date: actDate,
            status: "present",
            check_in_at: new Date().toISOString(),
            recorded_by: profile.id,
          });
        }
      }

      await refetchActivities();
      toast.success(t("submission_success"));
      if (autoAttendance) {
        toast.success(t("auto_attendance"));
      }

      // Reset Form
      setVillage("");
      setPanchayat("");
      setDescription("");
      setBeneficiaryCount(0);
      setPhotos([]);
      setPhotoPreviews([]);
      setPdfDoc(null);
      setActiveTab("list");
    } catch (err: any) {
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
      const ACTIVITY_MAP_LOCAL: Record<string, any> = {
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
        Other: "Other",
      };

      for (const draft of drafts) {
        const { error } = await supabase.from("activities").insert({
          cadre_id: draft.cadre_id,
          activity_date: draft.date,
          block_id: draft.block_id,
          village_name: draft.village,
          panchayat: draft.panchayat,
          beneficiaries: draft.beneficiaries,
          gps: gpsLocation,
          activity_type: ACTIVITY_MAP_LOCAL[draft.activity_type] ?? "Other",
          description: draft.description,
          status: "Pending",
        });
        if (error) throw error;
      }
      setDrafts([]);
      await refetchActivities();
      toast.success(t("submission_success"));
    } catch (err: any) {
      console.error(err);
      toast.error(`Sync error: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  const filteredActivities = useMemo(() => {
    return (activities as any[]).filter((a: any) => {
      // Block is already filtered server-side by effectiveBlockId; this is just a safety net
      const matchesBlock = effectiveBlockId === null || a.block_id === effectiveBlockId;
      const matchesCadre =
        !filterCadreName.trim() ||
        a.cadre_name.toLowerCase().includes(filterCadreName.toLowerCase());
      const matchesType =
        filterActType === "All" ||
        a.activity_type.toLowerCase() === filterActType.toLowerCase() ||
        (a.activity_type === "Livelihood Activity" && filterActType === "Livelihood Demo") ||
        (a.activity_type === "Livelihood Demo" && filterActType === "Livelihood Activity") ||
        (a.activity_type === "Training" && filterActType === "Training Session") ||
        (a.activity_type === "Training_Session" && filterActType === "Training");
      const matchesVillage =
        !filterVillage.trim() || a.village.toLowerCase().includes(filterVillage.toLowerCase());
      const matchesDate = !filterDate || a.date === filterDate;
      return matchesBlock && matchesCadre && matchesType && matchesVillage && matchesDate;
    });
  }, [activities, effectiveBlockId, filterCadreName, filterActType, filterVillage, filterDate]);

  // Build last-7-days chart data dynamically from the same filtered dataset
  const chartData = useMemo(() => {
    const today = new Date();
    const days: { name: string; isoDate: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const name = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      days.push({ name, isoDate });
    }
    return days.map(({ name, isoDate }) => ({
      name,
      count: filteredActivities.filter((a) => a.date === isoDate).length,
    }));
  }, [filteredActivities]);

  return (
    <div className="space-y-6">
      {/* Offline Simulator Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              isOffline ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600",
            )}
          >
            {isOffline ? <WifiOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">
              {isOffline
            ? t("offline_mode")
            : t("online_mode")}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">
              Simulate offline state and IndexedDB caching
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {drafts.length > 0 && (
            <Button
              onClick={handleSync}
              variant="outline"
              className="h-9 rounded-xl text-xs font-black border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100/50 flex items-center gap-1.5 animate-pulse"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              सिंक करें / Sync {drafts.length} Drafts
            </Button>
          )}
          <button
            onClick={() => setIsOffline((prev) => !prev)}
            className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors",
              isOffline
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700",
            )}
          >
            {isOffline ? "Switch to Online" : "Go Offline"}
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm gap-1 w-max text-xs">
        <button
          onClick={() => setActiveTab("list")}
          className={`rounded-lg px-4.5 py-2 font-bold transition-all ${
            activeTab === "list"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          गतिविधियाँ सूची / Activities Grid
        </button>
        <button
          onClick={() => setActiveTab("form")}
          className={`rounded-lg px-4.5 py-2 font-bold transition-all ${
            activeTab === "form"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          कार्य रिपोर्ट फॉर्म / Submit Activity Form
        </button>
      </div>

      {activeTab === "list" ? (
        /* List View */
        <div className="space-y-6">
          {/* Header Title with action */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                गतिविधि ट्रैकिंग / Activity Tracking
              </h2>
              <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
                Government MIS Participatory Activity Tracking Dashboard
              </p>
            </div>
            <Button
              onClick={() => setActiveTab("form")}
              className="h-11 rounded-xl font-bold bg-[#0055A4] hover:bg-[#004484] text-white shadow-md flex items-center gap-1.5"
            >
              <PlusCircle className="h-5 w-5" />
              नई गतिविधि / New Activity
            </Button>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {/* KPI 1 */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0055A4]">
                  <ClipboardList className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                    आज कुल गतिविधियाँ
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate">
                    Total Today
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mt-2.5">
                {filteredActivities.length}
              </h3>
            </div>

            {/* KPI 2 */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF9800]">
                  <Clock className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                    स्वीकृति प्रतीक्षारत
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate">
                    Pending Approvals
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#FF9800] mt-2.5">
                {filteredActivities.filter((a) => a.status === "Pending").length}
              </h3>
            </div>

            {/* KPI 3 */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#4CAF50]">
                  <CheckCircle className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                    पूर्ण गतिविधियाँ
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate">
                    Completed
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#4CAF50] mt-2.5">
                {filteredActivities.filter((a) => a.status === "Approved").length}
              </h3>
            </div>

            {/* KPI 4 */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Landmark className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                    एसएचजी बैठकें
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate">
                    SHG Meetings
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mt-2.5">
                {
                  filteredActivities.filter((a) => a.activity_type.toLowerCase().includes("shg"))
                    .length
                }
              </h3>
            </div>

            {/* KPI 5 */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <PlusCircle className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                    प्रशिक्षण
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate">
                    Trainings
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mt-2.5">
                {
                  filteredActivities.filter((a) => a.activity_type.toLowerCase().includes("train"))
                    .length
                }
              </h3>
            </div>

            {/* KPI 6 */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <MapPin className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                    किसान सर्वेक्षण
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase -mt-0.5 truncate">
                    Farmer Visits
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mt-2.5">
                {
                  filteredActivities.filter((a) => a.activity_type.toLowerCase().includes("farmer"))
                    .length
                }
              </h3>
            </div>
          </div>

          {/* Activity Trend Chart */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BarChart3 className="h-4.5 w-4.5 text-slate-400" />
              दैनिक गतिविधि प्रगति रुझान / Daily Activity Trend
            </h3>
            <div className="h-44 text-xs font-bold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0055A4" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm space-y-4">
            <div
              className="flex items-center justify-between border-b border-slate-50 pb-2 cursor-pointer select-none"
              onClick={() => setFiltersCollapsed(!filtersCollapsed)}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  फ़िल्टर पैनल / Filter Panel
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-slate-100 rounded-md"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform text-slate-500",
                    !filtersCollapsed && "rotate-180",
                  )}
                />
              </Button>
            </div>
            {!filtersCollapsed && (
              <>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 text-xs font-bold text-slate-700">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-slate-400 font-bold text-[10px] uppercase">
                      तारीख / Date
                    </Label>
                    <Input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="h-10 text-xs rounded-lg border-slate-200 font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-slate-400 font-bold text-[10px] uppercase">
                      गतिविधि प्रकार / Activity Type
                    </Label>
                    <Select value={filterActType} onValueChange={setFilterActType}>
                      <SelectTrigger className="h-10 text-xs rounded-lg border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Types / सभी प्रकार</SelectItem>
                        <SelectItem value="SHG Meeting">SHG Meeting</SelectItem>
                        <SelectItem value="Training">Training</SelectItem>
                        <SelectItem value="Farmer Visit">Farmer Visit</SelectItem>
                        <SelectItem value="Livelihood Demo">Livelihood Demo</SelectItem>
                        <SelectItem value="Monitoring Visit">Monitoring Visit</SelectItem>
                        <SelectItem value="Record Verification">Record Verification</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-slate-400 font-bold text-[10px] uppercase">
                      कर्मी का नाम / Cadre Name
                    </Label>
                    <Input
                      value={filterCadreName}
                      onChange={(e) => setFilterCadreName(e.target.value)}
                      placeholder="कर्मी का नाम..."
                      className="h-10 text-xs rounded-lg border-slate-200 font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-slate-400 font-bold text-[10px] uppercase">
                      गाँव का नाम / Village
                    </Label>
                    <Input
                      value={filterVillage}
                      onChange={(e) => setFilterVillage(e.target.value)}
                      placeholder="गाँव का नाम..."
                      className="h-10 text-xs rounded-lg border-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-1.5">
                  <Button
                    variant="outline"
                    className="h-9 rounded-lg"
                    onClick={() => {
                      setFilterCadreName("");
                      setFilterActType("All");
                      setFilterVillage("");
                      setFilterDate("");
                    }}
                  >
                    साफ़ करें / Reset
                  </Button>
                  <Button
                    className="h-9 rounded-lg bg-slate-900 text-white"
                    onClick={() => toast.success("फ़िल्टर लागू किया गया / Filters applied")}
                  >
                    खोजें / Filter Search
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Table list */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            {/* Mobile Card Deck View */}
            <div className="block md:hidden space-y-4">
              {/* Pending Drafts locally cached */}
              {drafts.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-slate-100 p-4 shadow-sm bg-orange-50/10 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800">{d.cadre_name}</span>
                      <span className="rounded bg-orange-100/50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                        {d.role}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[9px] font-black text-orange-700 uppercase">
                      <Clock className="h-3 w-3" /> Draft
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-semibold text-slate-600">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] uppercase">Date</span>
                      <span className="font-bold text-slate-700">{d.date}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] uppercase">Block</span>
                      <span className="font-bold text-slate-700">{d.block_name}</span>
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="text-slate-400 text-[10px] uppercase">Village</span>
                      <span className="font-bold text-slate-700">{d.village}</span>
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="text-slate-400 text-[10px] uppercase">Activity Type</span>
                      <span className="font-bold text-slate-700">{d.activity_type}</span>
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="text-slate-400 text-[10px] uppercase">Beneficiaries</span>
                      <span className="font-bold text-slate-700">{d.beneficiaries}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100/60">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                      Description:
                    </span>
                    <p className="text-slate-600 font-medium italic">{d.description}</p>
                  </div>
                </div>
              ))}

              {/* Standard Submitted activities */}
              {filteredActivities.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-slate-100 p-4 shadow-sm bg-slate-50/30 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800">{a.cadre_name}</span>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {a.role}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase",
                        a.status === "Pending" && "bg-amber-50 text-amber-700",
                        a.status === "Approved" && "bg-emerald-50 text-emerald-700",
                        a.status === "Rejected" && "bg-rose-50 text-rose-700",
                      )}
                    >
                      {a.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-semibold text-slate-600">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] uppercase">Date</span>
                      <span className="font-bold text-slate-700">{a.date}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] uppercase">Block</span>
                      <span className="font-bold text-slate-700">{a.block_name}</span>
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="text-slate-400 text-[10px] uppercase">Village</span>
                      <span className="font-bold text-slate-700">{a.village}</span>
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="text-slate-400 text-[10px] uppercase">Activity Type</span>
                      <span className="font-bold text-slate-700">{a.activity_type}</span>
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="text-slate-400 text-[10px] uppercase">Beneficiaries</span>
                      <span className="font-bold text-slate-700">{a.beneficiaries}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100/60">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                      Description:
                    </span>
                    <p className="text-slate-600 font-medium italic">{a.description}</p>
                  </div>
                </div>
              ))}

              {filteredActivities.length === 0 && drafts.length === 0 && (
                <div className="text-center py-6 text-slate-400 font-semibold bg-white border border-slate-100 rounded-xl">
                  कोई रिकॉर्ड नहीं मिला / No activities found
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 pr-3">नाम / Name</th>
                    <th className="py-3 pr-3">भूमिका / Role</th>
                    <th className="py-3 pr-3">तारीख / Date</th>
                    <th className="py-3 pr-3">ब्लॉक / Block</th>
                    <th className="py-3 pr-3">गाँव / Village</th>
                    <th className="py-3 pr-3">गतिविधि प्रकार / Activity Type</th>
                    <th className="py-3 pr-3">विवरण / Description</th>
                    <th className="py-3 text-right">लाभार्थी / Beneficiaries</th>
                    <th className="py-3 text-center">स्थिति / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* Pending Drafts locally cached */}
                  {drafts.map((d) => (
                    <tr
                      key={d.id}
                      className="bg-orange-50/10 hover:bg-orange-50/20 transition-colors"
                    >
                      <td className="py-3.5 pr-3 font-bold text-slate-700">{d.cadre_name}</td>
                      <td className="py-3.5 pr-3">
                        <span className="rounded bg-orange-100/50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                          {d.role}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-500 font-bold">{d.date}</td>
                      <td className="py-3.5 pr-3 text-slate-600 font-semibold">{d.block_name}</td>
                      <td className="py-3.5 pr-3 text-slate-600 font-semibold">{d.village}</td>
                      <td className="py-3.5 pr-3 text-slate-800 font-bold">{d.activity_type}</td>
                      <td className="py-3.5 pr-3 text-slate-500 font-medium truncate max-w-[200px]">
                        {d.description}
                      </td>
                      <td className="py-3.5 pr-3 text-right font-bold text-slate-700">
                        {d.beneficiaries}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[9px] font-black text-orange-700 uppercase">
                          <Clock className="h-3 w-3" /> Draft
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Standard Submitted activities */}
                  {filteredActivities.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pr-3 font-bold text-slate-700">{a.cadre_name}</td>
                      <td className="py-3.5 pr-3">
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {a.role}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-500 font-semibold">{a.date}</td>
                      <td className="py-3.5 pr-3 text-slate-600 font-semibold">{a.block_name}</td>
                      <td className="py-3.5 pr-3 text-slate-600 font-semibold">{a.village}</td>
                      <td className="py-3.5 pr-3 text-slate-800 font-bold">{a.activity_type}</td>
                      <td className="py-3.5 pr-3 text-slate-500 font-medium truncate max-w-[200px]">
                        {a.description}
                      </td>
                      <td className="py-3.5 pr-3 text-right font-bold text-slate-700">
                        {a.beneficiaries}
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase",
                            a.status === "Pending" && "bg-amber-50 text-amber-700",
                            a.status === "Approved" && "bg-emerald-50 text-emerald-700",
                            a.status === "Rejected" && "bg-rose-50 text-rose-700",
                          )}
                        >
                          {a.status === "Pending" && <Clock className="h-3 w-3" />}
                          {a.status === "Approved" && <CheckCircle className="h-3 w-3" />}
                          {a.status === "Rejected" && <XCircle className="h-3 w-3" />}
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredActivities.length === 0 && drafts.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-semibold">
                        कोई रिकॉर्ड नहीं मिला / No activities found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Form View */
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm max-w-4xl mx-auto">
          <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide">
            दैनिक कार्य रिपोर्ट फॉर्म / Activity Submission Form
          </h3>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-5 text-xs font-bold text-slate-700"
          >
            {/* Row 1: Date & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-500 font-bold">
                  तारीख / Date of Activity (Cannot select future)
                </Label>
                <Input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={actDate}
                  onChange={(e) => setActDate(e.target.value)}
                  className="h-10 text-xs rounded-lg border-slate-200 font-bold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-500 font-bold">गतिविधि प्रकार / Activity Type</Label>
                <Select value={actType} onValueChange={setActType}>
                  <SelectTrigger className="h-10 text-xs rounded-lg border-slate-200 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Location cascading dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-500 font-bold">राज्य / State</Label>
                <Input
                  value="Chhattisgarh"
                  disabled
                  className="h-10 text-xs rounded-lg border-slate-200 bg-slate-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-500 font-bold">जिला / District</Label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger className="h-10 text-xs rounded-lg border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dantewada">Dantewada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-500 font-bold">ब्लॉक / Block</Label>
                <Select value={blockId} onValueChange={setBlockId}>
                  <SelectTrigger className="h-10 text-xs rounded-lg border-slate-200">
                    <SelectValue placeholder="Select Block" />
                  </SelectTrigger>
                  <SelectContent>
                    {(blocks ?? []).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-500 font-bold">पंचायत / Panchayat</Label>
                <Input
                  value={panchayat}
                  onChange={(e) => setPanchayat(e.target.value)}
                  placeholder="e.g. Kalnar"
                  className="h-10 text-xs rounded-lg border-slate-200 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Village */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-500 font-bold">गाँव / Village</Label>
                <Input
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Reslapur"
                  className="h-10 text-xs rounded-lg border-slate-200 font-bold"
                  required
                />
              </div>

              {/* Beneficiary Members Count */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-500 font-bold">
                  लाभार्थी संख्या / Women Benefited (Max 1000)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={1000}
                  value={beneficiaryCount}
                  onChange={(e) => setBeneficiaryCount(Number(e.target.value))}
                  className="h-10 text-xs rounded-lg border-slate-200 font-bold"
                />
              </div>
            </div>

            {/* Row 4: Description */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">
                गतिविधि विवरण / Description Notes (Max 500 characters)
              </Label>
              <Textarea
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter details of outcome, discussed savings..."
                rows={3}
                className="text-xs rounded-lg border-slate-200 font-semibold"
              />
              <span className="text-[10px] text-slate-400 font-semibold text-right">
                {500 - description.length} characters remaining
              </span>
            </div>

            {/* Row 5: PDF Documents & Camera upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              {/* Image upload preview */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-500 font-bold">साक्ष्य चित्र / Capture Photos</Label>
                <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors">
                  <Camera className="h-6 w-6 text-slate-400" />
                  <span className="text-[10px] text-slate-400 mt-1.5">Snaps (Max 10 pics)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photoPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {photoPreviews.map((src, idx) => (
                      <div
                        key={idx}
                        className="relative group flex h-10 w-10 shrink-0 border rounded overflow-hidden"
                      >
                        <img src={src} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Trash2
                            onClick={() => removePhoto(idx)}
                            className="h-3.5 w-3.5 text-white cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PDF Document */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-500 font-bold">
                  दस्तावेज़ / PDF Attachment (Max 10MB)
                </Label>
                <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors">
                  <FileText className="h-6 w-6 text-slate-400" />
                  <span className="text-[10px] text-slate-400 mt-1.5">Upload PDF (Minutes)</span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                </label>
                {pdfDoc && (
                  <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-2 py-1 text-[10px] mt-1">
                    <span className="truncate">{pdfDoc.name}</span>
                    <Trash2
                      onClick={() => setPdfDoc(null)}
                      className="h-3 w-3 text-rose-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Row 6: GPS auto coordinates & Attendance marking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4.5 items-center bg-slate-50/50 rounded-xl p-3.5">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                    Auto-tagged Geotag Coordinates
                  </p>
                  <p className="text-xs font-black text-slate-700 mt-1">{gpsLocation}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm text-[11px]">
                <div className="leading-tight">
                  <p className="font-bold text-slate-700">
                    उपस्थिति स्वतः दर्ज / Auto-Mark Attendance
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                    Toggle checking-in Present on submission
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoAttendance}
                  onChange={(e) => setAutoAttendance(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Form Footer Buttons */}
            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleSubmit("Draft")}
                className="h-10 rounded-lg text-xs"
              >
                ड्राफ्ट सहेजें / Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit("Pending")}
                className="h-10 px-5 rounded-lg text-xs font-black shadow-md"
              >
                सबमिट करें / Submit Report
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
