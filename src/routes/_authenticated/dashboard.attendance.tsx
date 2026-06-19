import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  Download,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ChevronDown,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-auth";
import { getUserDataScope, getCadreIdsInBlock, applyScopeToQuery } from "@/lib/data-scope";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const { t } = useT();
  const { data: profile } = useProfile();
  const scope = getUserDataScope(profile);
  const [date, setDate] = useState<Date>(new Date());
  const [blockFilter, setBlockFilter] = useState("all");

  useEffect(() => {
    if (scope.isScoped && scope.blockId) {
      setBlockFilter(scope.blockId);
    }
  }, [scope.isScoped, scope.blockId]);

  const [searchTerm, setSearchTerm] = useState("");

  const [filtersCollapsed, setFiltersCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFiltersCollapsed(window.innerWidth < 768);
    }
  }, []);

  const { data: blocks } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => (await supabase.from("blocks").select("id,name").order("name")).data ?? [],
  });

  const { data: cadres = [], isLoading: isCadresLoading } = useQuery({
    queryKey: ["cadres", scope.blockId ?? "all"],
    enabled: scope.ready,
    queryFn: async () => {
      const { data: userRoles, error: urError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "cadre");
      if (urError) throw urError;

      const cadreIds = userRoles.map((ur) => ur.user_id);
      if (cadreIds.length === 0) return [];

      let profilesQuery = supabase
        .from("profiles")
        .select("id, full_name, cadre_type, block_id, blocks(name)")
        .in("id", cadreIds);
      if (scope.isScoped && scope.blockId) {
        profilesQuery = profilesQuery.eq("block_id", scope.blockId);
      }
      const { data: profiles, error: pError } = await profilesQuery;
      if (pError) throw pError;

      return profiles ?? [];
    },
  });

  const dateStr = format(date, "yyyy-MM-dd");

  const {
    data: attendanceRecords = [],
    isLoading: isAttendanceLoading,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ["attendance", dateStr, scope.blockId ?? "all"],
    enabled: scope.ready,
    queryFn: async () => {
      let attQ = supabase.from("attendance").select("*").eq("date", dateStr);
      if (scope.isScoped && scope.blockId) {
        const cadreIds = await getCadreIdsInBlock(scope.blockId);
        attQ = applyScopeToQuery(attQ, true, scope.blockId, cadreIds);
      }
      const { data, error } = await attQ;
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = isCadresLoading || isAttendanceLoading;

  // Only include cadres that have an explicit attendance record for the selected date.
  // Cadres with no record on the selected date are NOT shown — they are not "Absent",
  // they simply have not been marked yet. This prevents synthetic rows from appearing
  // when browsing past or future dates.
  const computedAttendance = cadres
    .filter((cadre) => attendanceRecords.some((r) => r.cadre_id === cadre.id))
    .map((cadre) => {
      const record = attendanceRecords.find((r) => r.cadre_id === cadre.id)!;

      let uiStatus = "Absent";
      let checkInStr = "—";
      let checkOutStr = "—";

      if (record.status === "present") {
        uiStatus = "Present";
        if (record.check_in_at) {
          const checkInDate = new Date(record.check_in_at);
          checkInStr = format(checkInDate, "hh:mm a");
          const hours = checkInDate.getHours();
          const minutes = checkInDate.getMinutes();
          if (hours > 9 || (hours === 9 && minutes >= 30)) {
            uiStatus = "Late";
          }
        }
        if (record.check_out_at) {
          checkOutStr = format(new Date(record.check_out_at), "hh:mm a");
        }
      } else if (record.status === "absent") {
        uiStatus = "Absent";
      } else if (record.status === "on_leave") {
        uiStatus = "Leave";
      } else if (record.status === "holiday") {
        uiStatus = "Holiday";
      }

      return {
        id: cadre.id,
        cadre_id: cadre.id,
        name: cadre.full_name,
        role: cadre.cadre_type || "—",
        block_id: cadre.block_id || "—",
        block_name: cadre.blocks?.name || "—",
        status: uiStatus,
        check_in: checkInStr,
        check_out: checkOutStr,
      };
    });

  const filteredAttendance = computedAttendance.filter((a) => {
    const matchesBlock = blockFilter === "all" || a.block_id === blockFilter;
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBlock && matchesSearch;
  });

  const handleStatusChange = async (cadreId: string, newStatus: string) => {
    const cadre = cadres.find((c) => c.id === cadreId);
    if (!cadre) return;

    let check_in_at: string | null = null;
    let check_out_at: string | null = null;
    let dbStatus: "present" | "absent" | "on_leave" | "holiday" = "absent";

    const selectedDate = new Date(date);

    if (newStatus === "Present") {
      dbStatus = "present";
      selectedDate.setHours(9, 0, 0, 0);
      check_in_at = selectedDate.toISOString();
      selectedDate.setHours(17, 0, 0, 0);
      check_out_at = selectedDate.toISOString();
    } else if (newStatus === "Late") {
      dbStatus = "present";
      selectedDate.setHours(9, 45, 0, 0);
      check_in_at = selectedDate.toISOString();
      selectedDate.setHours(17, 0, 0, 0);
      check_out_at = selectedDate.toISOString();
    } else if (newStatus === "Leave") {
      dbStatus = "on_leave";
    } else if (newStatus === "Absent") {
      dbStatus = "absent";
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const recordedBy = user?.id ?? null;

      const { error } = await supabase.from("attendance").upsert(
        {
          cadre_id: cadreId,
          date: dateStr,
          status: dbStatus,
          check_in_at,
          check_out_at,
          block_id: cadre.block_id,
          recorded_by: recordedBy,
        },
        {
          onConflict: "cadre_id,date",
        },
      );

      if (error) throw error;

      toast.success(t("toast_attendance_updated"));
      refetchAttendance();
    } catch (error: any) {
      toast.error(`Error updating attendance: ${error.message}`);
    }
  };

  const handleExport = () => {
    // Generate simple CSV download
    const headers = "Name,Role,Block,Check-In,Check-Out,Status\n";
    const rows = filteredAttendance
      .map(
        (a) =>
          `"${a.name}","${a.role}","${a.block_name}","${a.check_in}","${a.check_out}","${a.status}"`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `attendance_${format(date, "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t("export_excel_btn"));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {t("attendance_mgmt_title")}
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
            Mark check-in/out status and monitor logs
          </p>
        </div>
        <Button
          onClick={handleExport}
          className="h-10 rounded-xl font-bold shadow-md bg-emerald-600 hover:bg-emerald-700"
        >
          <Download className="mr-1.5 h-4 w-4" />
          {t("export_excel_btn")}
        </Button>
      </div>

      {/* Filters Row */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm space-y-4">
        <div
          className="flex items-center justify-between border-b border-slate-50 pb-2 cursor-pointer select-none"
          onClick={() => setFiltersCollapsed(!filtersCollapsed)}
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {t("filter_panel_title")}
            </h3>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-slate-100 rounded-md">
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform text-slate-500",
                !filtersCollapsed && "rotate-180",
              )}
            />
          </Button>
        </div>
        {!filtersCollapsed && (
          <div className="grid gap-4 sm:grid-cols-3 text-xs font-bold text-slate-700">
            {/* Date Filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-500">{t("select_date_label")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                    <span>{format(date, "dd MMMM yyyy")}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Block Filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-500">{t("block_filter_label")}</Label>
              <Select value={blockFilter} onValueChange={setBlockFilter} disabled={scope.isScoped}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {!scope.isScoped && <SelectItem value="all">{t("all_blocks_label")}</SelectItem>}
                  {(blocks ?? [])
                    .filter((b) => !scope.isScoped || b.id === scope.blockId)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-500">{t("search_label")}</Label>
              <div className="relative">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or role..."
                  className="h-10 rounded-xl border-slate-200 pl-9 text-xs"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid Content */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        {/* Mobile Card Deck View */}
        <div className="block md:hidden space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 font-medium animate-pulse">
              {t("loading_msg")}
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-medium">
              {attendanceRecords.length === 0
                ? `${format(date, "dd MMM yyyy")} ${t("no_attendance_for")}`
                : t("no_records")}
            </div>
          ) : (
            filteredAttendance.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-100 p-4 shadow-sm bg-slate-50/30 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-800">{item.name}</span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {item.role}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase",
                      item.status === "Present" && "bg-emerald-50 text-emerald-700",
                      item.status === "Absent" && "bg-rose-50 text-rose-700",
                      item.status === "Leave" && "bg-orange-50 text-orange-700",
                      item.status === "Late" && "bg-amber-50 text-amber-700",
                    )}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] uppercase">Block</span>
                    <span className="font-bold text-slate-700">{item.block_name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] uppercase font-mono">Check-In</span>
                    <span className="font-bold font-mono text-slate-700">{item.check_in}</span>
                  </div>
                  <div className="flex flex-col pt-1">
                    <span className="text-slate-400 text-[10px] uppercase font-mono">
                      Check-Out
                    </span>
                    <span className="font-bold font-mono text-slate-700">{item.check_out}</span>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">
                    Change Status:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(item.id, "Present")}
                      className={cn(
                        "h-7 text-[9px] font-bold rounded-md px-2 flex-1 min-w-[60px]",
                        item.status === "Present"
                          ? "bg-emerald-600 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50",
                      )}
                    >
                      Present
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(item.id, "Absent")}
                      className={cn(
                        "h-7 text-[9px] font-bold rounded-md px-2 flex-1 min-w-[60px]",
                        item.status === "Absent"
                          ? "bg-rose-600 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-rose-50",
                      )}
                    >
                      Absent
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(item.id, "Leave")}
                      className={cn(
                        "h-7 text-[9px] font-bold rounded-md px-2 flex-1 min-w-[60px]",
                        item.status === "Leave"
                          ? "bg-orange-500 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-orange-50",
                      )}
                    >
                      Leave
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(item.id, "Late")}
                      className={cn(
                        "h-7 text-[9px] font-bold rounded-md px-2 flex-1 min-w-[60px]",
                        item.status === "Late"
                          ? "bg-amber-500 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-amber-50",
                      )}
                    >
                      Late
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 pr-3">{t("col_name")}</th>
                <th className="py-3 pr-3">{t("col_role")}</th>
                <th className="py-3 pr-3">{t("col_block")}</th>
                <th className="py-3 pr-3">{t("col_check_in")}</th>
                <th className="py-3 pr-3">{t("col_check_out")}</th>
                <th className="py-3 pr-3">{t("col_status")}</th>
                <th className="py-3 text-center">{t("change_status_label")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-slate-400 font-medium animate-pulse"
                  >
                    {t("loading_msg")}
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    {attendanceRecords.length === 0
                      ? `${format(date, "dd MMM yyyy")} ${t("no_attendance_for")}`
                      : t("no_records")}
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pr-3 font-bold text-slate-700">{item.name}</td>
                    <td className="py-3.5 pr-3">
                      <span className="rounded-md bg-blue-50 px-2.5 py-0.5 font-bold text-blue-700">
                        {item.role}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 text-slate-600 font-semibold">{item.block_name}</td>
                    <td className="py-3.5 pr-3 font-mono text-slate-500 font-bold">
                      {item.check_in}
                    </td>
                    <td className="py-3.5 pr-3 font-mono text-slate-500 font-bold">
                      {item.check_out}
                    </td>
                    <td className="py-3.5 pr-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase",
                          item.status === "Present" && "bg-emerald-50 text-emerald-700",
                          item.status === "Absent" && "bg-rose-50 text-rose-700",
                          item.status === "Leave" && "bg-orange-50 text-orange-700",
                          item.status === "Late" && "bg-amber-50 text-amber-700",
                        )}
                      >
                        {item.status === "Present" && <CheckCircle className="h-3.5 w-3.5" />}
                        {item.status === "Absent" && <XCircle className="h-3.5 w-3.5" />}
                        {item.status === "Leave" && <CalendarIcon className="h-3.5 w-3.5" />}
                        {item.status === "Late" && <Clock className="h-3.5 w-3.5" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(item.id, "Present")}
                          className={cn(
                            "h-7 text-[10px] font-bold rounded-md px-2",
                            item.status === "Present"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700",
                          )}
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(item.id, "Absent")}
                          className={cn(
                            "h-7 text-[10px] font-bold rounded-md px-2",
                            item.status === "Absent"
                              ? "bg-rose-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700",
                          )}
                        >
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(item.id, "Leave")}
                          className={cn(
                            "h-7 text-[10px] font-bold rounded-md px-2",
                            item.status === "Leave"
                              ? "bg-orange-500 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700",
                          )}
                        >
                          Leave
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(item.id, "Late")}
                          className={cn(
                            "h-7 text-[10px] font-bold rounded-md px-2",
                            item.status === "Late"
                              ? "bg-amber-500 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700",
                          )}
                        >
                          Late
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
