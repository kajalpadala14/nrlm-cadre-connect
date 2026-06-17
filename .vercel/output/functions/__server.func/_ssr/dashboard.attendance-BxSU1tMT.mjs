import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useT } from "./router-yzFmt3hU.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { B as Button, b as buttonVariants } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { R as Root2, T as Trigger, P as Portal, C as Content2 } from "../_libs/radix-ui__react-popover.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { f as format } from "../_libs/date-fns.mjs";
import { a1 as Download, $ as Search, g as ChevronDown, _ as Calendar$1, t as CircleCheckBig, u as CircleX, w as Clock, a9 as ChevronLeft, j as ChevronRight } from "../_libs/lucide-react.mjs";
import { g as getDefaultClassNames, D as DayPicker } from "../_libs/react-day-picker.mjs";
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
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
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
import "../_libs/date-fns__tz.mjs";
const Popover = Root2;
const PopoverTrigger = Trigger;
const PopoverContent = reactExports.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = Content2.displayName;
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    DayPicker,
    {
      showOutsideDays,
      className: cn(
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      ),
      captionLayout,
      formatters: {
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters
      },
      classNames: {
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label" ? "text-sm" : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day
        ),
        range_start: cn("bg-accent rounded-l-md", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames
      },
      components: {
        Root: ({ className: className2, rootRef, ...props2 }) => {
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-slot": "calendar", ref: rootRef, className: cn(className2), ...props2 });
        },
        Chevron: ({ className: className2, orientation, ...props2 }) => {
          if (orientation === "left") {
            return /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: cn("size-4", className2), ...props2 });
          }
          if (orientation === "right") {
            return /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: cn("size-4", className2), ...props2 });
          }
          return /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: cn("size-4", className2), ...props2 });
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props2 }) => {
          return /* @__PURE__ */ jsxRuntimeExports.jsx("td", { ...props2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-(--cell-size) items-center justify-center text-center", children }) });
        },
        ...components
      },
      ...props
    }
  );
}
function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();
  const ref = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Button,
    {
      ref,
      variant: "ghost",
      size: "icon",
      "data-day": day.date.toLocaleDateString(),
      "data-selected-single": modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle,
      "data-range-start": modifiers.range_start,
      "data-range-end": modifiers.range_end,
      "data-range-middle": modifiers.range_middle,
      className: cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-(--cell-size) flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      ),
      ...props
    }
  );
}
function AttendancePage() {
  const {
    t
  } = useT();
  const [date, setDate] = reactExports.useState(/* @__PURE__ */ new Date());
  const [blockFilter, setBlockFilter] = reactExports.useState("all");
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [filtersCollapsed, setFiltersCollapsed] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (typeof window !== "undefined") {
      setFiltersCollapsed(window.innerWidth < 768);
    }
  }, []);
  const {
    data: blocks
  } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => (await supabase.from("blocks").select("id,name").order("name")).data ?? []
  });
  const {
    data: cadres = [],
    isLoading: isCadresLoading
  } = useQuery({
    queryKey: ["cadres"],
    queryFn: async () => {
      const {
        data: userRoles,
        error: urError
      } = await supabase.from("user_roles").select("user_id").eq("role", "cadre");
      if (urError) throw urError;
      const cadreIds = userRoles.map((ur) => ur.user_id);
      if (cadreIds.length === 0) return [];
      const {
        data: profiles,
        error: pError
      } = await supabase.from("profiles").select("id, full_name, cadre_type, block_id, blocks(name)").in("id", cadreIds);
      if (pError) throw pError;
      return profiles ?? [];
    }
  });
  const dateStr = format(date, "yyyy-MM-dd");
  const {
    data: attendanceRecords = [],
    isLoading: isAttendanceLoading,
    refetch: refetchAttendance
  } = useQuery({
    queryKey: ["attendance", dateStr],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("attendance").select("*").eq("date", dateStr);
      if (error) throw error;
      return data ?? [];
    }
  });
  const isLoading = isCadresLoading || isAttendanceLoading;
  const computedAttendance = cadres.filter((cadre) => attendanceRecords.some((r) => r.cadre_id === cadre.id)).map((cadre) => {
    const record = attendanceRecords.find((r) => r.cadre_id === cadre.id);
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
        if (hours > 9 || hours === 9 && minutes >= 30) {
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
      check_out: checkOutStr
    };
  });
  const filteredAttendance = computedAttendance.filter((a) => {
    const matchesBlock = blockFilter === "all" || a.block_id === blockFilter;
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBlock && matchesSearch;
  });
  const handleStatusChange = async (cadreId, newStatus) => {
    const cadre = cadres.find((c) => c.id === cadreId);
    if (!cadre) return;
    let check_in_at = null;
    let check_out_at = null;
    let dbStatus = "absent";
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
        data: {
          user
        }
      } = await supabase.auth.getUser();
      const recordedBy = user?.id ?? null;
      const {
        error
      } = await supabase.from("attendance").upsert({
        cadre_id: cadreId,
        date: dateStr,
        status: dbStatus,
        check_in_at,
        check_out_at,
        block_id: cadre.block_id,
        recorded_by: recordedBy
      }, {
        onConflict: "cadre_id,date"
      });
      if (error) throw error;
      toast.success(t("toast_attendance_updated"));
      refetchAttendance();
    } catch (error) {
      toast.error(`Error updating attendance: ${error.message}`);
    }
  };
  const handleExport = () => {
    const headers = "Name,Role,Block,Check-In,Check-Out,Status\n";
    const rows = filteredAttendance.map((a) => `"${a.name}","${a.role}","${a.block_name}","${a.check_in}","${a.check_out}","${a.status}"`).join("\n");
    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `attendance_${format(date, "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t("export_excel_btn"));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black text-slate-800 tracking-tight", children: t("attendance_mgmt_title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: "Mark check-in/out status and monitor logs" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleExport, className: "h-10 rounded-xl font-bold shadow-md bg-emerald-600 hover:bg-emerald-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "mr-1.5 h-4 w-4" }),
        t("export_excel_btn")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-50 pb-2 cursor-pointer select-none", onClick: () => setFiltersCollapsed(!filtersCollapsed), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 text-slate-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black text-slate-700 uppercase tracking-wider", children: t("filter_panel_title") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0 hover:bg-slate-100 rounded-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: cn("h-4 w-4 transition-transform text-slate-500", !filtersCollapsed && "rotate-180") }) })
      ] }),
      !filtersCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3 text-xs font-bold text-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("select_date_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar$1, { className: "h-4 w-4 text-slate-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: format(date, "dd MMMM yyyy") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { mode: "single", selected: date, onSelect: (d) => d && setDate(d), initialFocus: true }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("block_filter_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: blockFilter, onValueChange: setBlockFilter, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-xl border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: t("all_blocks_label") }),
              (blocks ?? []).map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: b.id, children: b.name }, b.id))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("search_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: "Search by name or role...", className: "h-10 rounded-xl border-slate-200 pl-9 text-xs" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-slate-400" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "block md:hidden space-y-4", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-slate-400 font-medium animate-pulse", children: t("loading_msg") }) : filteredAttendance.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-slate-400 font-medium", children: attendanceRecords.length === 0 ? `${format(date, "dd MMM yyyy")} ${t("no_attendance_for")}` : t("no_records") }) : filteredAttendance.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 p-4 shadow-sm bg-slate-50/30 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-extrabold text-sm text-slate-800", children: item.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700", children: item.role })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase", item.status === "Present" && "bg-emerald-50 text-emerald-700", item.status === "Absent" && "bg-rose-50 text-rose-700", item.status === "Leave" && "bg-orange-50 text-orange-700", item.status === "Late" && "bg-amber-50 text-amber-700"), children: item.status })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Block" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: item.block_name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase font-mono", children: "Check-In" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-slate-700", children: item.check_in })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase font-mono", children: "Check-Out" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-slate-700", children: item.check_out })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2.5 border-t border-slate-100", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-bold uppercase mb-1.5", children: "Change Status:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => handleStatusChange(item.id, "Present"), className: cn("h-7 text-[9px] font-bold rounded-md px-2 flex-1 min-w-[60px]", item.status === "Present" ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50"), children: "Present" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => handleStatusChange(item.id, "Absent"), className: cn("h-7 text-[9px] font-bold rounded-md px-2 flex-1 min-w-[60px]", item.status === "Absent" ? "bg-rose-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-rose-50"), children: "Absent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => handleStatusChange(item.id, "Leave"), className: cn("h-7 text-[9px] font-bold rounded-md px-2 flex-1 min-w-[60px]", item.status === "Leave" ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-orange-50"), children: "Leave" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => handleStatusChange(item.id, "Late"), className: cn("h-7 text-[9px] font-bold rounded-md px-2 flex-1 min-w-[60px]", item.status === "Late" ? "bg-amber-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-amber-50"), children: "Late" })
          ] })
        ] })
      ] }, item.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_role") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_block") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_check_in") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_check_out") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_status") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-center", children: t("change_status_label") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "py-8 text-center text-slate-400 font-medium animate-pulse", children: t("loading_msg") }) }) : filteredAttendance.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "py-8 text-center text-slate-400 font-medium", children: attendanceRecords.length === 0 ? `${format(date, "dd MMM yyyy")} ${t("no_attendance_for")}` : t("no_records") }) }) : filteredAttendance.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/50 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 font-bold text-slate-700", children: item.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-md bg-blue-50 px-2.5 py-0.5 font-bold text-blue-700", children: item.role }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-600 font-semibold", children: item.block_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 font-mono text-slate-500 font-bold", children: item.check_in }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 font-mono text-slate-500 font-bold", children: item.check_out }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase", item.status === "Present" && "bg-emerald-50 text-emerald-700", item.status === "Absent" && "bg-rose-50 text-rose-700", item.status === "Leave" && "bg-orange-50 text-orange-700", item.status === "Late" && "bg-amber-50 text-amber-700"), children: [
            item.status === "Present" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3.5 w-3.5" }),
            item.status === "Absent" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5" }),
            item.status === "Leave" && /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar$1, { className: "h-3.5 w-3.5" }),
            item.status === "Late" && /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5" }),
            item.status
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => handleStatusChange(item.id, "Present"), className: cn("h-7 text-[10px] font-bold rounded-md px-2", item.status === "Present" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"), children: "Present" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => handleStatusChange(item.id, "Absent"), className: cn("h-7 text-[10px] font-bold rounded-md px-2", item.status === "Absent" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700"), children: "Absent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => handleStatusChange(item.id, "Leave"), className: cn("h-7 text-[10px] font-bold rounded-md px-2", item.status === "Leave" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700"), children: "Leave" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => handleStatusChange(item.id, "Late"), className: cn("h-7 text-[10px] font-bold rounded-md px-2", item.status === "Late" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700"), children: "Late" })
          ] }) })
        ] }, item.id)) })
      ] }) })
    ] })
  ] });
}
export {
  AttendancePage as component
};
