import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Calendar, Landmark, HelpCircle, Eye, SlidersHorizontal, RefreshCw, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ActivityCard } from "@/components/app/ActivityCard";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActivityCacheSync } from "@/hooks/use-activity-cache-sync";

export const Route = createFileRoute("/_authenticated/cadre/history")({
  component: HistoryPage,
});

const ACTIVITY_TYPES = [
  "All",
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

function StatCard({ title, value, color }: { title: string; value: number | string; color: "blue" | "emerald" | "amber" | "rose" | "purple" | "teal" }) {
  const styles = {
    blue: "border-blue-100 bg-blue-50/20 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50/20 text-emerald-700",
    amber: "border-amber-100 bg-amber-50/20 text-amber-700",
    rose: "border-rose-100 bg-rose-50/20 text-rose-700",
    purple: "border-purple-100 bg-purple-50/20 text-purple-700",
    teal: "border-teal-100 bg-teal-50/20 text-teal-700",
  };

  return (
    <div className={cn("rounded-2xl border p-4.5 shadow-sm flex flex-col justify-between min-h-[90px]", styles[color])}>
      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{title}</span>
      <h3 className="text-xl font-black text-slate-800 mt-2">{value}</h3>
    </div>
  );
}

function HistoryPage() {
  const { t, lang } = useT();
  const { data: profile } = useProfile();
  useActivityCacheSync();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterVillage, setFilterVillage] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["my-activities", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*, blocks(name), approver:profiles!approved_by(full_name)")
        .eq("cadre_id", profile!.id)
        .order("activity_date", { ascending: false })
        .order("submitted_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Unique villages extraction from fetched activities list
  const uniqueVillages = useMemo(() => {
    const villages = data.map((a) => a.village_name).filter(Boolean);
    return Array.from(new Set(villages)).sort();
  }, [data]);

  // Apply filters in memory
  const filteredActivities = useMemo(() => {
    return data.filter((a) => {
      const matchesSearch =
        !searchQuery.trim() ||
        a.village_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.panchayat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        filterStatus === "All" || (a.status ?? "").toLowerCase() === filterStatus.toLowerCase();

      const matchesType =
        filterType === "All" ||
        a.activity_type.toLowerCase() === filterType.toLowerCase() ||
        (a.activity_type === "Training_Session" && filterType.toLowerCase() === "training") ||
        (a.activity_type === "Livelihood_Activity" && filterType.toLowerCase() === "livelihood demo") ||
        (a.activity_type === "Record_Verification" && filterType.toLowerCase() === "record verification") ||
        (a.activity_type === "Farmer_Visit" && filterType.toLowerCase() === "farmer visit") ||
        (a.activity_type === "Monitoring_Visit" && filterType.toLowerCase() === "monitoring visit");

      const matchesVillage =
        filterVillage === "All" || a.village_name === filterVillage;

      let matchesDate = true;
      if (filterStartDate) {
        matchesDate = matchesDate && a.activity_date >= filterStartDate;
      }
      if (filterEndDate) {
        matchesDate = matchesDate && a.activity_date <= filterEndDate;
      }

      return matchesSearch && matchesStatus && matchesType && matchesVillage && matchesDate;
    });
  }, [data, searchQuery, filterStatus, filterType, filterVillage, filterStartDate, filterEndDate]);

  // Summary statistics calculations
  const stats = useMemo(() => {
    const total = filteredActivities.length;
    const approved = filteredActivities.filter((a) => a.status === "Approved").length;
    const pending = filteredActivities.filter((a) => a.status === "Pending").length;
    const rejected = filteredActivities.filter((a) => a.status === "Rejected").length;
    const villages = new Set(filteredActivities.map((a) => a.village_name).filter(Boolean)).size;
    const beneficiaries = filteredActivities.reduce((acc, a) => acc + (a.beneficiaries || 0), 0);

    return { total, approved, pending, rejected, villages, beneficiaries };
  }, [filteredActivities]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/cadre"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="h-8 rounded-lg text-xs font-bold"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          {t("refresh")}
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {t("history_title")}
        </h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
          {t("history_sub")}
        </p>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid gap-4.5 grid-cols-2 md:grid-cols-6">
        <StatCard title={t("stat_total")} value={stats.total} color="blue" />
        <StatCard title={t("stat_approved")} value={stats.approved} color="emerald" />
        <StatCard title={t("stat_pending")} value={stats.pending} color="amber" />
        <StatCard title={t("stat_rejected")} value={stats.rejected} color="rose" />
        <StatCard title={t("stat_villages")} value={stats.villages} color="purple" />
        <StatCard title={t("stat_beneficiaries")} value={stats.beneficiaries} color="teal" />
      </div>

      {/* Filter Strip */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm space-y-4 text-xs font-bold text-slate-700">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 transition-colors md:cursor-default"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <h3 className="uppercase tracking-wider">{t("filter_options")}</h3>
            <span className="ml-1 md:hidden text-[10px] text-slate-400">
              {showFilters ? "▲" : "▼"}
            </span>
          </button>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterStartDate("");
              setFilterEndDate("");
              setFilterStatus("All");
              setFilterType("All");
              setFilterVillage("All");
            }}
            className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
          >
            {t("reset_filters_btn")}
          </button>
        </div>
        <div className={showFilters ? "space-y-4" : "hidden md:block space-y-4"}>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
          {/* Search bar */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] text-slate-400 font-bold uppercase">{t("search_label")}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="गाँव, विवरण..."
                className="h-10 pl-9 text-xs rounded-lg border-slate-200"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] text-slate-400 font-bold uppercase">{t("start_date")}</Label>
            <Input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="h-10 text-xs rounded-lg border-slate-200 font-bold"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] text-slate-400 font-bold uppercase">{t("end_date")}</Label>
            <Input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="h-10 text-xs rounded-lg border-slate-200 font-bold"
            />
          </div>

          {/* Status Select */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] text-slate-400 font-bold uppercase">{t("col_status")}</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-10 text-xs rounded-lg border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t("all_statuses_opt")}</SelectItem>
                <SelectItem value="Pending">Pending / लंबित</SelectItem>
                <SelectItem value="Approved">Approved / स्वीकृत</SelectItem>
                <SelectItem value="Rejected">Rejected / अस्वीकृत</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Village Select */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] text-slate-400 font-bold uppercase">{t("col_village")}</Label>
            <Select value={filterVillage} onValueChange={setFilterVillage}>
              <SelectTrigger className="h-10 text-xs rounded-lg border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t("all_villages")}</SelectItem>
                {uniqueVillages.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Second Row: Activity Type Select */}
        <div className="flex flex-col gap-1.5 w-full sm:w-1/3">
          <Label className="text-[10px] text-slate-400 font-bold uppercase">{t("col_type")}</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-10 text-xs rounded-lg border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((actType) => (
                <SelectItem key={actType} value={actType}>
                  {actType === "All" ? t("all_types_opt") : actType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>
      </div>

      {/* List items */}
      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-12 text-slate-400 font-bold animate-pulse">
            {t("loading")}
          </div>
        )}
        {!isLoading && filteredActivities.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-400 font-semibold shadow-sm">
            {t("no_activities_history")}
          </div>
        )}
        {!isLoading &&
          filteredActivities.map((a) => (
            <ActivityCard
              key={a.id}
              activity={{
                id: a.id,
                activity_date: a.activity_date,
                activity_type: a.activity_type,
                village_name: a.village_name,
                description: a.description,
                photo_url: a.photo_url,
                pdf_url: a.pdf_url,
                submitted_at: a.submitted_at,
                block_name: (a as { blocks: { name: string } | null }).blocks?.name ?? null,
                status: a.status as "Pending" | "Approved" | "Rejected",
                beneficiaries: a.beneficiaries ?? undefined,
                gps: a.gps ?? undefined,
                comment: a.comment,
                cadre_id: a.cadre_id,
                block_id: a.block_id ?? undefined,
                approved_at: a.approved_at,
                approved_by_name: (a as any).approver?.full_name ?? null,
              }}
              onRefetchHistory={refetch}
            />
          ))}
      </div>
    </div>
  );
}
