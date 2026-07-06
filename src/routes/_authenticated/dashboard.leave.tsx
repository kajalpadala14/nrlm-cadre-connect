import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  FileText,
  Filter,
  Search,
  ChevronDown,
  User,
  MapPin,
  HelpCircle,
  Check,
  X,
  ArrowRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/hooks/use-auth";
import { getUserDataScope } from "@/lib/data-scope";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/leave")({
  component: DashboardLeavePage,
});

const LEAVE_TYPES = [
  { value: "Casual", labelEn: "Casual Leave", labelHi: "आकस्मिक अवकाश" },
  { value: "Sick", labelEn: "Sick Leave", labelHi: "चिकित्सा अवकाश" },
  { value: "Official", labelEn: "Official Duty", labelHi: "आधिकारिक कार्य" },
  { value: "Training", labelEn: "Training", labelHi: "प्रशिक्षण" },
  { value: "Emergency", labelEn: "Emergency Leave", labelHi: "आपातकालीन अवकाश" },
];

const CADRE_TYPES = ["PRP", "FLCRP", "RBK", "IFC_Anchor", "SR_CRP", "FPO_CEO", "Gender"];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: <XCircle className="h-3 w-3" />,
  },
  cancelled: {
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
    icon: <Ban className="h-3 w-3" />,
  },
};

function LeaveStatCard({
  title,
  value,
  colorClass,
  icon,
}: {
  title: string;
  value: number;
  colorClass: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border p-4.5 shadow-sm transition-all hover:shadow-md flex items-center justify-between", colorClass)}>
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider opacity-70 block">{title}</span>
        <span className="text-3xl font-black tracking-tight leading-none block">{value}</span>
      </div>
      <div className="p-3 rounded-xl bg-white/40 shadow-inner shrink-0">{icon}</div>
    </div>
  );
}

function DashboardLeavePage() {
  const { t, lang } = useT();
  const qc = useQueryClient();
  const { data: adminProfile } = useProfile();
  const scope = getUserDataScope(adminProfile);

  // Filters State
  const [blockFilter, setBlockFilter] = useState<string>("all");
  const [cadreTypeFilter, setCadreTypeFilter] = useState<string>("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fromDateFilter, setFromDateFilter] = useState<string>("");
  const [toDateFilter, setToDateFilter] = useState<string>("");

  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Selected leave request for detail view/approval
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState<string>("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  useEffect(() => {
    if (scope.isScoped && scope.blockId) {
      setBlockFilter(scope.blockId);
    }
  }, [scope.isScoped, scope.blockId]);

  // Fetch Blocks
  const { data: blocks = [] } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocks")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch Leave Requests
  const {
    data: leaveRequests = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["staff-leave-requests", scope.blockId ?? "all"],
    enabled: scope.ready,
    queryFn: async () => {
      let query = supabase.from("leave_requests").select(`
        *,
        profiles!leave_requests_cadre_id_fkey(id, full_name, cadre_type, phone),
        blocks(id, name)
      `);

      if (scope.isScoped && scope.blockId) {
        query = query.eq("block_id", scope.blockId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch all staff list for approved_by resolution
  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-profiles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const staffNameMap = useMemo(() => {
    return new Map(staffList.map((s) => [s.id, s.full_name]));
  }, [staffList]);

  // Compute overall counts
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const stats = useMemo(() => {
    const pending = leaveRequests.filter((l) => l.status === "pending").length;
    const approved = leaveRequests.filter((l) => l.status === "approved").length;
    const rejected = leaveRequests.filter((l) => l.status === "rejected").length;
    const onLeaveToday = leaveRequests.filter(
      (l) => l.status === "approved" && todayStr >= l.from_date && todayStr <= l.to_date
    ).length;

    return { pending, approved, rejected, onLeaveToday };
  }, [leaveRequests, todayStr]);

  // Filter Leave Requests
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((leave) => {
      // Scoping & Block filter
      const matchesBlock = blockFilter === "all" || leave.block_id === blockFilter;

      // Cadre Type filter
      const cadreType = leave.profiles?.cadre_type;
      const matchesCadreType =
        cadreTypeFilter === "all" || cadreType === cadreTypeFilter;

      // Leave Type filter
      const matchesLeaveType =
        leaveTypeFilter === "all" || leave.leave_type === leaveTypeFilter;

      // Status filter
      const matchesStatus = statusFilter === "all" || leave.status === statusFilter;

      // Date Filters
      const matchesFromDate = !fromDateFilter || leave.from_date >= fromDateFilter;
      const matchesToDate = !toDateFilter || leave.to_date <= toDateFilter;

      // Search (Name or reason)
      const name = leave.profiles?.full_name ?? "";
      const reason = leave.reason ?? "";
      const matchesSearch =
        !searchTerm ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reason.toLowerCase().includes(searchTerm.toLowerCase());

      return (
        matchesBlock &&
        matchesCadreType &&
        matchesLeaveType &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate &&
        matchesSearch
      );
    });
  }, [
    leaveRequests,
    blockFilter,
    cadreTypeFilter,
    leaveTypeFilter,
    statusFilter,
    fromDateFilter,
    toDateFilter,
    searchTerm,
  ]);

  const handleDecision = async (decision: "approved" | "rejected") => {
    if (!selectedLeave) return;
    if (decision === "rejected" && !approvalRemarks.trim()) {
      toast.error(
        lang === "hi"
          ? "अस्वीकार करने के लिए टिप्पणी दर्ज करना आवश्यक है"
          : "Please enter remarks for rejection"
      );
      return;
    }

    setSubmittingDecision(true);
    try {
      const approverId = adminProfile?.id ?? null;
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("leave_requests")
        .update({
          status: decision,
          approved_by: approverId,
          approved_at: now,
          approval_remarks: approvalRemarks.trim() || null,
        })
        .eq("id", selectedLeave.id);

      if (error) throw error;

      toast.success(
        decision === "approved"
          ? lang === "hi"
            ? "अवकाश स्वीकृत कर दिया गया है"
            : "Leave request approved successfully"
          : lang === "hi"
            ? "अवकाश अस्वीकृत कर दिया गया है"
            : "Leave request rejected"
      );

      setSelectedLeave(null);
      setApprovalRemarks("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update leave request");
    } finally {
      setSubmittingDecision(false);
    }
  };

  const getLeaveTypeLabel = (val: string) => {
    const found = LEAVE_TYPES.find((l) => l.value === val);
    if (!found) return val;
    return lang === "hi" ? found.labelHi : found.labelEn;
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Cadre Name",
      "Block",
      "Cadre Type",
      "Leave Type",
      "From Date",
      "To Date",
      "Total Days",
      "Status",
      "Reason",
      "Approved/Rejected By",
      "Approval Remarks",
    ];

    const rows = filteredRequests.map((leave) => [
      leave.profiles?.full_name ?? "Unknown",
      leave.blocks?.name ?? "N/A",
      leave.profiles?.cadre_type ?? "N/A",
      leave.leave_type,
      leave.from_date,
      leave.to_date,
      leave.total_days,
      leave.status,
      leave.reason,
      leave.approved_by ? (staffNameMap.get(leave.approved_by) ?? "Staff") : "—",
      leave.approval_remarks ?? "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leave_report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-indigo-600" />
            {t("leave_management")}
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
            {lang === "hi"
              ? "कैडर अवकाश अनुरोधों का सत्यापन और प्रबंधन"
              : "Review and manage cadre leave requests"}
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          className="h-10 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center gap-1.5"
        >
          <Download className="h-4 w-4 text-slate-500" />
          {lang === "hi" ? "रिपोर्ट डाउनलोड करें" : "Download CSV"}
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LeaveStatCard
          title={lang === "hi" ? "लंबित अनुरोध" : "Pending Requests"}
          value={stats.pending}
          colorClass="bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-800 border-amber-200/60"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
        />
        <LeaveStatCard
          title={lang === "hi" ? "आज अवकाश पर कैडर" : "Staff On Leave Today"}
          value={stats.onLeaveToday}
          colorClass="bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-800 border-blue-200/60"
          icon={<Calendar className="h-5 w-5 text-blue-600" />}
        />
        <LeaveStatCard
          title={lang === "hi" ? "स्वीकृत अवकाश" : "Approved Requests"}
          value={stats.approved}
          colorClass="bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-800 border-emerald-200/60"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        />
        <LeaveStatCard
          title={lang === "hi" ? "अस्वीकृत अवकाश" : "Rejected Requests"}
          value={stats.rejected}
          colorClass="bg-gradient-to-br from-rose-50 to-rose-100/50 text-rose-800 border-rose-200/60"
          icon={<XCircle className="h-5 w-5 text-rose-600" />}
        />
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setFiltersCollapsed(!filtersCollapsed)}
          className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-slate-100"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {lang === "hi" ? "फ़िल्टर खोजें" : "Search & Filters"}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-200",
              !filtersCollapsed && "rotate-180"
            )}
          />
        </button>

        {!filtersCollapsed && (
          <div className="p-5 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 animate-in fade-in duration-200">
            {/* Search Input */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {lang === "hi" ? "नाम या कारण से खोजें" : "Search by Name or Reason"}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    lang === "hi" ? "कैडर का नाम या विवरण खोजें..." : "Search cadre name, reason..."
                  }
                  className="pl-9 h-11 text-xs rounded-xl border-slate-200"
                />
              </div>
            </div>

            {/* Block Filter */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {lang === "hi" ? "ब्लॉक चुनें" : "Block"}
              </Label>
              <Select
                value={blockFilter}
                onValueChange={setBlockFilter}
                disabled={scope.isScoped}
              >
                <SelectTrigger className="h-11 text-xs rounded-xl border-slate-200 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "hi" ? "सभी ब्लॉक" : "All Blocks"}</SelectItem>
                  {blocks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cadre Type Filter */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {lang === "hi" ? "कैडर प्रकार" : "Cadre Type"}
              </Label>
              <Select value={cadreTypeFilter} onValueChange={setCadreTypeFilter}>
                <SelectTrigger className="h-11 text-xs rounded-xl border-slate-200 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {lang === "hi" ? "सभी कैडर प्रकार" : "All Cadre Types"}
                  </SelectItem>
                  {CADRE_TYPES.map((ct) => (
                    <SelectItem key={ct} value={ct}>
                      {ct}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leave Type Filter */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {lang === "hi" ? "अवकाश प्रकार" : "Leave Type"}
              </Label>
              <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                <SelectTrigger className="h-11 text-xs rounded-xl border-slate-200 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {lang === "hi" ? "सभी अवकाश प्रकार" : "All Leave Types"}
                  </SelectItem>
                  {LEAVE_TYPES.map((lt) => (
                    <SelectItem key={lt.value} value={lt.value}>
                      {lang === "hi" ? lt.labelHi : lt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {lang === "hi" ? "स्थिति" : "Status"}
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 text-xs rounded-xl border-slate-200 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "hi" ? "सभी स्थितियां" : "All Statuses"}</SelectItem>
                  <SelectItem value="pending">{lang === "hi" ? "लंबित" : "Pending"}</SelectItem>
                  <SelectItem value="approved">{lang === "hi" ? "स्वीकृत" : "Approved"}</SelectItem>
                  <SelectItem value="rejected">{lang === "hi" ? "अस्वीकृत" : "Rejected"}</SelectItem>
                  <SelectItem value="cancelled">{lang === "hi" ? "रद्द" : "Cancelled"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date range filters */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {lang === "hi" ? "प्रारंभ तिथि" : "From Date"}
              </Label>
              <Input
                type="date"
                value={fromDateFilter}
                onChange={(e) => setFromDateFilter(e.target.value)}
                className="h-11 text-xs rounded-xl border-slate-200 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {lang === "hi" ? "समाप्ति तिथि" : "To Date"}
              </Label>
              <Input
                type="date"
                value={toDateFilter}
                onChange={(e) => setToDateFilter(e.target.value)}
                min={fromDateFilter || undefined}
                className="h-11 text-xs rounded-xl border-slate-200 font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Leave Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-medium animate-pulse flex flex-col items-center justify-center gap-2">
            <Clock className="h-6 w-6 animate-spin text-slate-300" />
            {t("loading_text")}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-16 text-center">
            <CalendarCheck className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">
              {lang === "hi" ? "कोई अवकाश अनुरोध नहीं मिला" : "No leave requests found"}
            </p>
            <p className="text-[10px] text-slate-300 font-semibold mt-1">
              {lang === "hi"
                ? "दिए गए फ़िल्टर के साथ कोई रिकॉर्ड मौजूद नहीं है।"
                : "Try adjusting your filters or search term."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === "hi" ? "कैडर का नाम" : "Cadre"}
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === "hi" ? "ब्लॉक / प्रकार" : "Block & Type"}
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === "hi" ? "अवकाश प्रकार" : "Leave Type"}
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === "hi" ? "अवधि" : "Duration"}
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === "hi" ? "दिन" : "Days"}
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === "hi" ? "स्थिति" : "Status"}
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    {lang === "hi" ? "कार्रवाई" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.map((leave) => {
                  const statusConf = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.pending;
                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/20 transition-colors">
                      {/* Cadre name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                            <User className="h-4.5 w-4.5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 leading-tight">
                              {leave.profiles?.full_name ?? "Unknown"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              {leave.profiles?.phone ?? "No phone"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Block and type */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-slate-700">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {leave.blocks?.name ?? "N/A"}
                          </span>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wide">
                            {leave.profiles?.cadre_type ?? "N/A"}
                          </p>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-slate-800">
                          {getLeaveTypeLabel(leave.leave_type)}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold">
                          <span>{leave.from_date}</span>
                          <ArrowRight className="h-3 w-3 text-slate-300" />
                          <span>{leave.to_date}</span>
                        </div>
                      </td>

                      {/* Total Days */}
                      <td className="px-5 py-4">
                        <span className="text-xs font-black text-slate-700">
                          {leave.total_days} {lang === "hi" ? "दिन" : leave.total_days === 1 ? "day" : "days"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide",
                            statusConf.bg,
                            statusConf.text,
                            statusConf.border
                          )}
                        >
                          {statusConf.icon}
                          {leave.status}
                        </span>
                      </td>

                      {/* Review Action */}
                      <td className="px-5 py-4 text-right">
                        {leave.status === "pending" ? (
                          <Button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setApprovalRemarks("");
                            }}
                            className="h-8 rounded-lg text-[10px] font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm uppercase tracking-wider"
                          >
                            {lang === "hi" ? "समीक्षा करें" : "Review"}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setSelectedLeave(leave)}
                            className="h-8 rounded-lg text-[10px] font-bold text-slate-600 hover:text-slate-800 uppercase tracking-wider"
                          >
                            {lang === "hi" ? "विवरण" : "View"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      {selectedLeave && (
        <Dialog open={!!selectedLeave} onOpenChange={(open) => !open && setSelectedLeave(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6 border-slate-100 bg-white">
            <DialogHeader className="border-b border-slate-50 pb-4">
              <DialogTitle className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-indigo-600" />
                {selectedLeave.status === "pending"
                  ? lang === "hi"
                    ? "अवकाश अनुरोध की समीक्षा"
                    : "Review Leave Request"
                  : lang === "hi"
                    ? "अवकाश अनुरोध का विवरण"
                    : "Leave Request Details"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4.5 pt-4 text-xs">
              {/* Cadre Details */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/40 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {lang === "hi" ? "कैडर नाम" : "Cadre Name"}
                  </span>
                  <p className="font-black text-slate-800 mt-0.5">
                    {selectedLeave.profiles?.full_name ?? "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {lang === "hi" ? "कैडर प्रकार" : "Cadre Type"}
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedLeave.profiles?.cadre_type ?? "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {lang === "hi" ? "ब्लॉक" : "Block"}
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedLeave.blocks?.name ?? "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {lang === "hi" ? "फोन" : "Phone"}
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedLeave.profiles?.phone ?? "No phone"}
                  </p>
                </div>
              </div>

              {/* Leave Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {lang === "hi" ? "अवकाश प्रकार" : "Leave Type"}
                    </span>
                    <p className="font-black text-indigo-700 mt-0.5">
                      {getLeaveTypeLabel(selectedLeave.leave_type)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {lang === "hi" ? "कुल अवधि" : "Duration"}
                    </span>
                    <p className="font-black text-slate-800 mt-0.5">
                      {selectedLeave.total_days} {lang === "hi" ? "दिन" : selectedLeave.total_days === 1 ? "day" : "days"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-indigo-900">
                    {selectedLeave.from_date} &rarr; {selectedLeave.to_date}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {lang === "hi" ? "कारण" : "Reason"}
                  </span>
                  <p className="font-medium text-slate-700 bg-slate-50 border border-slate-100 p-2.5 rounded-xl mt-1 leading-relaxed whitespace-pre-line">
                    {selectedLeave.reason}
                  </p>
                </div>

                {selectedLeave.attachment_url && (
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {lang === "hi" ? "दस्तावेज़" : "Attachment"}
                    </span>
                    <div className="mt-1">
                      <a
                        href={selectedLeave.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-150 text-blue-700 hover:bg-blue-100 transition-colors font-bold"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                        {lang === "hi" ? "दस्तावेज़ देखें" : "View Attachment Document"}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Status information if already processed */}
              {selectedLeave.status !== "pending" && (
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {lang === "hi" ? "समीक्षा स्थिति" : "Review Status"}:
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide",
                        (STATUS_CONFIG[selectedLeave.status] ?? STATUS_CONFIG.pending).bg,
                        (STATUS_CONFIG[selectedLeave.status] ?? STATUS_CONFIG.pending).text,
                        (STATUS_CONFIG[selectedLeave.status] ?? STATUS_CONFIG.pending).border
                      )}
                    >
                      {(STATUS_CONFIG[selectedLeave.status] ?? STATUS_CONFIG.pending).icon}
                      {selectedLeave.status}
                    </span>
                  </div>
                  {selectedLeave.approved_by && (
                    <p className="text-[10px] text-slate-500 font-semibold">
                      {lang === "hi" ? "समीक्षक:" : "Reviewed By:"}{" "}
                      {staffNameMap.get(selectedLeave.approved_by) ?? "Staff Admin"}
                      {selectedLeave.approved_at && ` on ${new Date(selectedLeave.approved_at).toLocaleDateString()}`}
                    </p>
                  )}
                  {selectedLeave.approval_remarks && (
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {lang === "hi" ? "टिप्पणी" : "Remarks"}
                      </span>
                      <p className="font-semibold text-slate-700 bg-slate-50 border border-slate-150 p-2.5 rounded-xl mt-1 leading-relaxed">
                        {selectedLeave.approval_remarks}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Approval Remarks Input & Actions (Only if Pending) */}
              {selectedLeave.status === "pending" && (
                <div className="border-t border-slate-100 pt-4 space-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {lang === "hi" ? "समीक्षा टिप्पणी (अस्वीकार करने पर आवश्यक)" : "Review Remarks (Required if rejecting)"}
                    </Label>
                    <Textarea
                      value={approvalRemarks}
                      onChange={(e) => setApprovalRemarks(e.target.value)}
                      placeholder={
                        lang === "hi"
                          ? "यहाँ टिप्पणी दर्ज करें..."
                          : "Provide approval or rejection remarks..."
                      }
                      rows={2}
                      maxLength={500}
                      className="text-xs rounded-xl border-slate-200 resize-none font-medium"
                    />
                    <p className="text-[9px] text-slate-400 font-bold text-right">
                      {approvalRemarks.length}/500
                    </p>
                  </div>

                  <div className="flex gap-3 justify-end pt-1">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedLeave(null)}
                      className="h-10 rounded-xl text-xs font-bold"
                    >
                      {lang === "hi" ? "बंद करें" : "Close"}
                    </Button>
                    <Button
                      onClick={() => handleDecision("rejected")}
                      disabled={submittingDecision}
                      className="h-10 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1"
                    >
                      <X className="h-4.5 w-4.5" />
                      {lang === "hi" ? "अस्वीकार करें" : "Reject"}
                    </Button>
                    <Button
                      onClick={() => handleDecision("approved")}
                      disabled={submittingDecision}
                      className="h-10 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md flex items-center gap-1"
                    >
                      <Check className="h-4.5 w-4.5" />
                      {lang === "hi" ? "स्वीकृत करें" : "Approve"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
