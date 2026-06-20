/**
 * cadre.leave.tsx — Cadre Leave Requests Page
 * Routes: /cadre/leave
 *
 * Features:
 * 1. Apply Leave Form — Leave type, date range, auto-calculated days, reason, attachment upload
 * 2. Leave History — Status badges, approval timeline, cancel pending requests
 * 3. Leave Balance Summary — Dynamic calculation of remaining leaves
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  FileText,
  Upload,
  Send,
  Ban,
  Loader2,
  CalendarCheck,
  Hourglass,
  BadgeCheck,
  ThumbsDown,
  History,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cadre/leave")({
  component: CadreLeavePage,
});

// ─── Constants ────────────────────────────────────────────────
const LEAVE_TYPES = [
  { value: "Casual", labelEn: "Casual Leave", labelHi: "आकस्मिक अवकाश" },
  { value: "Sick", labelEn: "Sick Leave", labelHi: "चिकित्सा अवकाश" },
  { value: "Official", labelEn: "Official Duty", labelHi: "आधिकारिक कार्य" },
  { value: "Training", labelEn: "Training", labelHi: "प्रशिक्षण" },
  { value: "Emergency", labelEn: "Emergency Leave", labelHi: "आपातकालीन अवकाश" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Hourglass className="h-3 w-3" />,
  approved: <BadgeCheck className="h-3 w-3" />,
  rejected: <ThumbsDown className="h-3 w-3" />,
  cancelled: <Ban className="h-3 w-3" />,
};

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border p-4 flex flex-col gap-2 shadow-sm", color)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider opacity-70 leading-tight">
          {label}
        </span>
        <span className="opacity-50 shrink-0">{icon}</span>
      </div>
      <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
function CadreLeavePage() {
  const { t, lang } = useT();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Calculate total days
  const totalDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (end < start) return 0;
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [fromDate, toDate]);

  // Fetch leave requests
  const {
    data: leaveRequests = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["cadre-leave-requests", profile?.id],
    enabled: !!profile,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*, blocks(name)")
        .eq("cadre_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Compute stats
  const stats = useMemo(() => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter((l: any) => l.status === "pending").length;
    const approved = leaveRequests.filter((l: any) => l.status === "approved").length;
    const rejected = leaveRequests.filter((l: any) => l.status === "rejected").length;
    const totalApprovedDays = leaveRequests
      .filter((l: any) => l.status === "approved")
      .reduce((sum: number, l: any) => sum + (l.total_days ?? 0), 0);
    return { total, pending, approved, rejected, totalApprovedDays };
  }, [leaveRequests]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!profile) return;
    if (!leaveType) {
      toast.error(lang === "hi" ? "अवकाश प्रकार चुनें" : "Select leave type");
      return;
    }
    if (!fromDate || !toDate) {
      toast.error(lang === "hi" ? "तारीखें भरें" : "Select date range");
      return;
    }
    if (totalDays <= 0) {
      toast.error(lang === "hi" ? "अवैध तारीख सीमा" : "Invalid date range");
      return;
    }
    if (!reason.trim()) {
      toast.error(lang === "hi" ? "कारण भरें" : "Please provide a reason");
      return;
    }

    setSubmitting(true);
    try {
      // Upload attachment if present
      let attachmentUrl: string | null = null;
      if (attachmentFile) {
        const path = `${profile.id}/${Date.now()}_${attachmentFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("leave-attachments")
          .upload(path, attachmentFile);
        if (uploadErr) {
          toast.error("Attachment upload failed: " + uploadErr.message);
          setSubmitting(false);
          return;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("leave-attachments").getPublicUrl(path);
        attachmentUrl = publicUrl;
      }

      // Fetch block_id from profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("block_id")
        .eq("id", profile.id)
        .single();

      const { error } = await supabase.from("leave_requests").insert({
        cadre_id: profile.id,
        block_id: profileData?.block_id ?? null,
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        total_days: totalDays,
        reason: reason.trim(),
        attachment_url: attachmentUrl,
        status: "pending",
      });

      if (error) throw error;

      toast.success(
        lang === "hi"
          ? "अवकाश अनुरोध सफलतापूर्वक सबमिट किया गया"
          : "Leave request submitted successfully"
      );
      setShowForm(false);
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setLeaveType("");
    setFromDate("");
    setToDate("");
    setReason("");
    setAttachmentFile(null);
  };

  // Cancel leave request
  const handleCancel = async (leaveId: string) => {
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "cancelled" })
        .eq("id", leaveId)
        .eq("cadre_id", profile!.id)
        .eq("status", "pending");

      if (error) throw error;
      toast.success(
        lang === "hi" ? "अवकाश अनुरोध रद्द किया गया" : "Leave request cancelled"
      );
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel leave request");
    }
  };

  const leaveTypeLabel = (type: string) => {
    const lt = LEAVE_TYPES.find((l) => l.value === type);
    if (!lt) return type;
    return lang === "hi" ? lt.labelHi : lt.labelEn;
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-10">
      {/* ══ Header ══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <Link
          to="/cadre"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) resetForm();
          }}
          className={cn(
            "h-9 rounded-xl text-xs font-bold shadow-sm transition-all",
            showForm
              ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
          )}
        >
          {showForm ? (
            <>
              <Ban className="mr-1.5 h-3.5 w-3.5" /> {lang === "hi" ? "रद्द करें" : "Cancel"}
            </>
          ) : (
            <>
              <Plus className="mr-1.5 h-3.5 w-3.5" />{" "}
              {lang === "hi" ? "अवकाश आवेदन" : "Apply Leave"}
            </>
          )}
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {t("leave_requests")}
        </h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
          {lang === "hi"
            ? "अपने अवकाश अनुरोध देखें और प्रबंधित करें"
            : "View and manage your leave requests"}
        </p>
      </div>

      {/* ══ Stats ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label={lang === "hi" ? "कुल अनुरोध" : "Total Requests"}
          value={stats.total}
          color="bg-blue-50 text-blue-700 border-blue-100"
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          label={lang === "hi" ? "लंबित" : "Pending"}
          value={stats.pending}
          color="bg-amber-50 text-amber-700 border-amber-100"
          icon={<Hourglass className="h-4 w-4" />}
        />
        <StatCard
          label={lang === "hi" ? "स्वीकृत" : "Approved"}
          value={stats.approved}
          color="bg-emerald-50 text-emerald-700 border-emerald-100"
          icon={<BadgeCheck className="h-4 w-4" />}
        />
        <StatCard
          label={lang === "hi" ? "स्वीकृत दिन" : "Approved Days"}
          value={stats.totalApprovedDays}
          color="bg-purple-50 text-purple-700 border-purple-100"
          icon={<CalendarCheck className="h-4 w-4" />}
        />
      </div>

      {/* ══ Apply Leave Form ════════════════════════════════════════ */}
      {showForm && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {lang === "hi" ? "अवकाश आवेदन फॉर्म" : "Leave Application Form"}
            </h3>
          </div>

          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
            {/* Leave Type */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-slate-400 font-bold uppercase">
                {lang === "hi" ? "अवकाश प्रकार" : "Leave Type"} *
              </Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="h-11 text-xs rounded-xl border-slate-200 font-bold">
                  <SelectValue
                    placeholder={
                      lang === "hi" ? "अवकाश प्रकार चुनें" : "Select leave type"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((lt) => (
                    <SelectItem key={lt.value} value={lt.value}>
                      {lang === "hi" ? lt.labelHi : lt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Spacer for alignment */}
            <div className="hidden sm:block" />

            {/* From Date */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-slate-400 font-bold uppercase">
                {lang === "hi" ? "कब से" : "From Date"} *
              </Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-11 text-xs rounded-xl border-slate-200 font-bold"
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-slate-400 font-bold uppercase">
                {lang === "hi" ? "कब तक" : "To Date"} *
              </Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate || undefined}
                className="h-11 text-xs rounded-xl border-slate-200 font-bold"
              />
            </div>
          </div>

          {/* Total Days Display */}
          {totalDays > 0 && (
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-black text-blue-800">
                {totalDays} {lang === "hi" ? "दिन" : totalDays === 1 ? "Day" : "Days"}
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] text-slate-400 font-bold uppercase">
              {lang === "hi" ? "कारण" : "Reason"} *
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                lang === "hi"
                  ? "अवकाश का कारण लिखें..."
                  : "Provide reason for leave..."
              }
              maxLength={500}
              rows={3}
              className="text-xs rounded-xl border-slate-200 font-medium resize-none"
            />
            <p className="text-[10px] text-slate-400 font-semibold text-right">
              {reason.length}/500
            </p>
          </div>

          {/* Attachment */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] text-slate-400 font-bold uppercase">
              {lang === "hi" ? "दस्तावेज़ संलग्न करें (वैकल्पिक)" : "Attach Document (Optional)"}
            </Label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-slate-500 font-medium
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-xl file:border-0
                  file:text-xs file:font-bold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 transition-colors
                  cursor-pointer"
              />
            </div>
            {attachmentFile && (
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <Upload className="h-3 w-3" /> {attachmentFile.name}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-50">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="h-10 rounded-xl text-xs font-bold"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-10 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  {lang === "hi" ? "भेजा जा रहा है..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {lang === "hi" ? "अवकाश आवेदन भेजें" : "Submit Leave Request"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ══ Leave History ═══════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <History className="h-4 w-4 text-slate-400" />
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
            {lang === "hi" ? "अवकाश इतिहास" : "Leave History"}
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-slate-50 animate-pulse border border-slate-100"
              />
            ))}
          </div>
        ) : leaveRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
            <CalendarDays className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">
              {lang === "hi"
                ? "कोई अवकाश अनुरोध नहीं मिला"
                : "No leave requests found"}
            </p>
            <p className="text-[10px] text-slate-300 font-semibold mt-1">
              {lang === "hi"
                ? "अवकाश आवेदन करने के लिए ऊपर बटन दबाएं"
                : "Click the Apply Leave button above to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaveRequests.map((leave: any) => (
              <div
                key={leave.id}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Left: Leave info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-800">
                        {leaveTypeLabel(leave.leave_type)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide",
                          STATUS_COLORS[leave.status] ?? STATUS_COLORS.pending
                        )}
                      >
                        {STATUS_ICONS[leave.status] ?? STATUS_ICONS.pending}
                        {leave.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {leave.from_date} → {leave.to_date}
                      </span>
                      <span className="bg-slate-100 rounded-full px-2 py-0.5 font-black">
                        {leave.total_days} {lang === "hi" ? "दिन" : "days"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium line-clamp-2">
                      {leave.reason}
                    </p>
                    {leave.attachment_url && (
                      <a
                        href={leave.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FileText className="h-3 w-3" />{" "}
                        {lang === "hi" ? "दस्तावेज़ देखें" : "View Attachment"}
                      </a>
                    )}

                    {/* Approval info */}
                    {(leave.status === "approved" || leave.status === "rejected") && (
                      <div className="mt-2 bg-slate-50 rounded-xl p-3 space-y-1 border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {leave.status === "approved"
                            ? lang === "hi"
                              ? "स्वीकृति विवरण"
                              : "Approval Details"
                            : lang === "hi"
                              ? "अस्वीकृति विवरण"
                              : "Rejection Details"}
                        </p>
                        {leave.approved_at && (
                          <p className="text-[10px] text-slate-500 font-semibold">
                            {lang === "hi" ? "तिथि:" : "Date:"}{" "}
                            {new Date(leave.approved_at).toLocaleDateString()}
                          </p>
                        )}
                        {leave.approval_remarks && (
                          <p className="text-[11px] text-slate-600 font-medium">
                            {lang === "hi" ? "टिप्पणी:" : "Remarks:"}{" "}
                            {leave.approval_remarks}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Cancel button (only for pending) */}
                  {leave.status === "pending" && (
                    <div className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(leave.id)}
                        className="h-8 rounded-lg text-[10px] font-black text-rose-600 border-rose-200 hover:bg-rose-50 uppercase tracking-wider"
                      >
                        <Ban className="mr-1 h-3 w-3" />
                        {lang === "hi" ? "रद्द करें" : "Cancel"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Timeline footer */}
                <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between">
                  <p className="text-[9px] text-slate-300 font-semibold">
                    {lang === "hi" ? "सबमिट:" : "Submitted:"}{" "}
                    {new Date(leave.created_at).toLocaleDateString()}{" "}
                    {new Date(leave.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
