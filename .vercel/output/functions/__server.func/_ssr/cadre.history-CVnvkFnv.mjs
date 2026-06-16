import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQuery, a as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { u as useT } from "./router-D5xsBJge.mjs";
import { a as useProfile } from "./use-auth-CD1GunTm.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { T as Textarea } from "./textarea-DSyJ1nlY.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle } from "./dialog-9txPz7Ln.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { ag as ArrowLeft, ac as RefreshCw, ak as SlidersHorizontal, $ as Search, w as Clock, o as CircleCheck, u as CircleX, _ as Calendar, M as MapPin, b as Users, a0 as FileText, a1 as Download, K as Camera, Y as Pen, Z as Trash2, E as Eye } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__query-core.mjs";
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
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
function ActivityCard({
  activity,
  onRefetchHistory
}) {
  const { t } = useT();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [signedUrl, setSignedUrl] = reactExports.useState(null);
  const [uploading, setUploading] = reactExports.useState(false);
  const [openEditDialog, setOpenEditDialog] = reactExports.useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = reactExports.useState(false);
  const [deleting, setDeleting] = reactExports.useState(false);
  const [editDesc, setEditDesc] = reactExports.useState(activity.description || "");
  const [editBeneficiaries, setEditBeneficiaries] = reactExports.useState(activity.beneficiaries || 0);
  const [savingEdit, setSavingEdit] = reactExports.useState(false);
  const { data: attendanceRecord, refetch: refetchAttendance } = useQuery({
    queryKey: ["attendance-status", activity.activity_date],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance").select("id, status").eq("date", activity.activity_date).maybeSingle();
      if (error) throw error;
      return data;
    }
  });
  const handlePhotoUpload = async (e) => {
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
      const { data: uploadData, error: uploadErr } = await supabase.storage.from("activity-photos").upload(filePath, file);
      if (uploadErr) throw uploadErr;
      const {
        data: { publicUrl }
      } = supabase.storage.from("activity-photos").getPublicUrl(filePath);
      const { error: actError } = await supabase.from("activities").update({ photo_url: publicUrl }).eq("id", activity.id);
      if (actError) throw actError;
      if (attendanceRecord?.id) {
        const { error: attError } = await supabase.from("attendance").update({ status: "present", check_in_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", attendanceRecord.id);
        if (attError) throw attError;
      } else {
        const { error: attError } = await supabase.from("attendance").insert({
          cadre_id: userId,
          block_id: activity.block_id || profile?.block_id,
          date: activity.activity_date,
          status: "present",
          check_in_at: (/* @__PURE__ */ new Date()).toISOString(),
          recorded_by: userId
        });
        if (attError) throw attError;
      }
      toast.success("फोटो साक्ष्य अपलोड किया गया और उपस्थिति 'उपस्थित' मार्क की गई / Photo uploaded and attendance marked Present!");
      refetchAttendance();
      if (onRefetchHistory) onRefetchHistory();
      qc.invalidateQueries({ queryKey: ["my-activities"] });
      qc.invalidateQueries({ queryKey: ["dash-stats-raw"] });
    } catch (err) {
      console.error(err);
      toast.error(`अपलोड विफल / Upload failed: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };
  const handleSaveEdit = async () => {
    if (editBeneficiaries < 0 || editBeneficiaries >= 1e3) {
      toast.error("लाभार्थी संख्या मान्य नहीं है / Beneficiary count must be positive and < 1000");
      return;
    }
    setSavingEdit(true);
    try {
      const { error } = await supabase.from("activities").update({
        description: editDesc.trim() || null,
        beneficiaries: editBeneficiaries
      }).eq("id", activity.id);
      if (error) throw error;
      toast.success("गतिविधि विवरण सफलतापूर्वक अपडेट किया गया / Activity details updated!");
      setOpenEditDialog(false);
      if (onRefetchHistory) onRefetchHistory();
      qc.invalidateQueries({ queryKey: ["my-activities"] });
    } catch (err) {
      toast.error(`Error updating: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };
  const handleDeleteActivity = async () => {
    if (!confirm("क्या आप वाकई इस गतिविधि को हटाना चाहते हैं? / Are you sure you want to delete this activity?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("activities").delete().eq("id", activity.id);
      if (error) throw error;
      const userId = profile?.id || activity.cadre_id;
      if (userId) {
        const { data: otherActs } = await supabase.from("activities").select("id").eq("cadre_id", userId).eq("activity_date", activity.activity_date);
        if (!otherActs || otherActs.length === 0) {
          await supabase.from("attendance").delete().eq("cadre_id", userId).eq("date", activity.activity_date);
        }
      }
      toast.success("गतिविधि सफलतापूर्वक हटा दी गई / Activity deleted successfully!");
      setOpenDetailsDialog(false);
      if (onRefetchHistory) onRefetchHistory();
      qc.invalidateQueries({ queryKey: ["my-activities"] });
      qc.invalidateQueries({ queryKey: ["dash-stats-raw"] });
    } catch (err) {
      toast.error(`हटाने में विफल / Deletion failed: ${err.message}`);
    } finally {
      setDeleting(false);
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
            <div style="font-size: 11px; color: #94a3b8; font-weight: bold; margin-top: 5px; text-transform: uppercase;">Generated: ${(/* @__PURE__ */ new Date()).toLocaleString()}</div>
          </div>
          <div class="row"><div class="label">Activity ID</div><div class="value">${activity.id}</div></div>
          <div class="row"><div class="label">Activity Date</div><div class="value">${activity.activity_date}</div></div>
          <div class="row"><div class="label">Activity Type</div><div class="value">${activity.activity_type}</div></div>
          <div class="row"><div class="label">Village / Block</div><div class="value">${activity.village_name} / ${activity.block_name || "N/A"}</div></div>
          <div class="row"><div class="label">Beneficiary Count</div><div class="value">${activity.beneficiaries || 0}</div></div>
          <div class="row"><div class="label">GPS Coordinates</div><div class="value">${activity.gps || "N/A"}</div></div>
          <div class="row"><div class="label">Submitted Date & Time</div><div class="value">${new Date(activity.submitted_at).toLocaleString()}</div></div>
          <div class="row"><div class="label">Approval Status</div><div class="value">${activity.status || "Pending"}</div></div>
          <div class="row"><div class="label">Attendance Status</div><div class="value">${attendanceRecord?.status || "Not Marked"}</div></div>
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
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("रिपोर्ट पीडीएफ जेनरेशन शुरू किया गया / Report print layout opened");
  };
  reactExports.useEffect(() => {
    if (!activity.photo_url) {
      setSignedUrl(null);
      return;
    }
    if (activity.photo_url.startsWith("http")) {
      setSignedUrl(activity.photo_url);
    } else {
      const {
        data: { publicUrl }
      } = supabase.storage.from("activity-photos").getPublicUrl(activity.photo_url);
      setSignedUrl(publicUrl ?? null);
    }
  }, [activity.photo_url]);
  const activityStatus = activity.status ?? "Pending";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 hover:shadow transition-shadow",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0055A4]", children: t(`act.${activity.activity_type}`) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                  activityStatus === "Pending" && "bg-amber-50 text-amber-700",
                  activityStatus === "Approved" && "bg-emerald-50 text-emerald-700",
                  activityStatus === "Rejected" && "bg-rose-50 text-rose-700"
                ),
                children: [
                  activityStatus === "Pending" && /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
                  activityStatus === "Approved" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3 w-3" }),
                  activityStatus === "Rejected" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3 w-3" }),
                  activityStatus
                ]
              }
            ),
            attendanceRecord ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                  attendanceRecord.status === "present" && "bg-emerald-100 text-emerald-800",
                  attendanceRecord.status === "pending_verification" && "bg-amber-100 text-amber-800",
                  attendanceRecord.status === "absent" && "bg-rose-100 text-rose-800",
                  attendanceRecord.status === "on_leave" && "bg-blue-100 text-blue-800",
                  attendanceRecord.status === "holiday" && "bg-slate-100 text-slate-800"
                ),
                children: [
                  "उपस्थिति / Attendance: ",
                  attendanceRecord.status === "present" ? "Present" : attendanceRecord.status === "pending_verification" ? "Pending Verification" : attendanceRecord.status
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-1 rounded-full bg-slate-50 text-slate-500 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider", children: "उपस्थिति / Attendance: Not Marked" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold text-slate-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3.5 w-3.5" }),
            activity.activity_date
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5 text-xs font-bold text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4 text-slate-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-800", children: activity.village_name }),
            activity.block_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-400", children: [
              "· ",
              activity.block_name
            ] })
          ] }),
          activity.gps && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1.5 pl-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5" }),
            "GPS: ",
            activity.gps
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 pl-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4 text-slate-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "लाभार्थी / Beneficiaries:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-800 font-black", children: activity.beneficiaries || 0 })
          ] }),
          activity.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1.5 pt-1 border-t border-slate-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "mt-0.5 h-4 w-4 text-slate-400 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-slate-500 leading-relaxed italic", children: [
              '"',
              activity.description,
              '"'
            ] })
          ] })
        ] }),
        activity.photo_url ? signedUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: signedUrl, target: "_blank", rel: "noreferrer", className: "block relative group overflow-hidden rounded-xl border border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: signedUrl,
              alt: "evidence",
              className: "h-32 w-full object-cover group-hover:scale-105 transition-transform duration-300"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: signedUrl,
              download: `evidence_${activity.id}`,
              target: "_blank",
              rel: "noreferrer",
              className: "inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
                "साक्ष्य डाउनलोड करें / Download Evidence"
              ]
            }
          ) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 w-full animate-pulse rounded-xl bg-slate-50" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs italic text-slate-400 font-semibold", children: t("no_photo") }),
          !activity.photo_url && attendanceRecord?.status === "pending_verification" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2.5 text-xs font-bold text-slate-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-amber-800 leading-normal", children: "⚠️ इस तिथि की उपस्थिति सत्यापन लंबित है क्योंकि फ़ोटो साक्ष्य गायब है। / Attendance verification is pending for this date due to missing photo evidence." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors shadow-sm select-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-4 w-4" }),
              uploading ? "अपलोड हो रहा है... / Uploading..." : "सत्यापन फ़ोटो अपलोड करें / Upload Verification Photo",
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "file",
                  accept: "image/*",
                  className: "hidden",
                  onChange: handlePhotoUpload,
                  disabled: uploading
                }
              )
            ] })
          ] })
        ] }),
        activity.pdf_url && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-start pt-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: activity.pdf_url,
            target: "_blank",
            rel: "noreferrer",
            className: "inline-flex items-center gap-1.5 text-[10px] font-black text-slate-700 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3.5 w-3.5 text-slate-400" }),
              "पीडीएफ दस्तावेज़ डाउनलोड करें / Download PDF Minutes"
            ]
          }
        ) }),
        activityStatus === "Rejected" && activity.comment && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-rose-50/50 border border-rose-100 rounded-xl p-3 space-y-1 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-rose-800 font-black uppercase text-[9px] tracking-wider", children: "अस्वीकृति का कारण / Rejection Feedback" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-600 font-semibold italic", children: [
            '"',
            activity.comment,
            '"'
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            t("submitted_at"),
            ": ",
            new Date(activity.submitted_at).toLocaleString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            activityStatus === "Pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  size: "sm",
                  onClick: () => setOpenEditDialog(true),
                  className: "h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "mr-1 h-3.5 w-3.5" }),
                    "संपादित करें / Edit"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  size: "sm",
                  variant: "destructive",
                  disabled: deleting,
                  onClick: handleDeleteActivity,
                  className: "h-8 rounded-lg text-xs font-bold shadow-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1 h-3.5 w-3.5" }),
                    "हटाएं / Delete"
                  ]
                }
              )
            ] }),
            activityStatus === "Approved" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                onClick: handleDownloadReport,
                className: "h-8 rounded-lg border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100/50 text-xs font-bold shadow-sm flex items-center gap-1",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
                  "रिपोर्ट डाउनलोड / Download Report"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                size: "sm",
                variant: "secondary",
                onClick: () => setOpenDetailsDialog(true),
                className: "h-8 rounded-lg text-xs font-bold shadow-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "mr-1 h-3.5 w-3.5" }),
                  "विवरण देखें / View Details"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: openEditDialog, onOpenChange: setOpenEditDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md p-6 rounded-2xl bg-white text-slate-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-sm font-black text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2.5", children: "गतिविधि विवरण संपादित करें / Edit Activity Details" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 text-xs font-bold pt-3.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold uppercase", children: "विवरण / Description" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  value: editDesc,
                  onChange: (e) => setEditDesc(e.target.value),
                  placeholder: "Enter details...",
                  className: "h-20 text-xs rounded-lg border-slate-200"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 font-bold uppercase", children: "लाभार्थी संख्या / Beneficiaries Count" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: editBeneficiaries,
                  onChange: (e) => setEditBeneficiaries(Number(e.target.value)),
                  className: "h-10 text-xs rounded-lg border-slate-200"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2.5 pt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  onClick: () => setOpenEditDialog(false),
                  className: "h-9 rounded-lg",
                  children: "रद्द करें / Cancel"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: handleSaveEdit,
                  disabled: savingEdit,
                  className: "h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white",
                  children: savingEdit ? "सहेजा जा रहा है... / Saving..." : "अपडेट करें / Save"
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: openDetailsDialog, onOpenChange: setOpenDetailsDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl p-6 rounded-2xl bg-white text-slate-700 max-h-[90vh] overflow-y-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "text-sm font-black text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2.5 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "गतिविधि विस्तृत रिपोर्ट / Activity Details" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: cn(
                  "rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider mr-6",
                  activityStatus === "Pending" && "bg-amber-100 text-amber-800",
                  activityStatus === "Approved" && "bg-emerald-100 text-emerald-800",
                  activityStatus === "Rejected" && "bg-rose-100 text-rose-800"
                ),
                children: activityStatus
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 text-xs font-bold pt-3.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3.5 grid-cols-1 sm:grid-cols-2 bg-slate-50 p-4 rounded-xl border border-slate-100", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "तारीख / Date" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-800 font-extrabold", children: activity.activity_date })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "गतिविधि प्रकार / Activity Type" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[#0055A4] font-extrabold", children: t(`act.${activity.activity_type}`) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "स्थान / Village & Panchayat" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-800 font-extrabold", children: [
                  activity.village_name,
                  " ",
                  activity.block_name ? `(${activity.block_name})` : ""
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "महिला लाभार्थी / Beneficiaries" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-800 font-extrabold", children: activity.beneficiaries || 0 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "जीपीएस स्थान / GPS Coordinates" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-800 font-mono text-[10px]", children: activity.gps || "N/A" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "उपस्थिति स्थिति / Attendance Status" }),
                attendanceRecord ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                      attendanceRecord.status === "present" && "bg-emerald-100 text-emerald-800",
                      attendanceRecord.status === "pending_verification" && "bg-amber-100 text-amber-800",
                      attendanceRecord.status === "absent" && "bg-rose-100 text-rose-800"
                    ),
                    children: attendanceRecord.status === "present" ? "Present" : attendanceRecord.status === "pending_verification" ? "Pending Verification" : attendanceRecord.status
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: "Not Marked" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] text-slate-400 uppercase", children: "विवरण नोट्स / Full Description" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-slate-50/50 border border-slate-100/50 rounded-xl leading-relaxed text-slate-600 font-semibold italic", children: [
                '"',
                activity.description || "No description provided.",
                '"'
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 border-t border-slate-100 pt-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] text-slate-400 uppercase", children: "अपलोड किए गए साक्ष्य / Uploaded Evidence" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 grid-cols-1 sm:grid-cols-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400", children: "साक्ष्य चित्र / Attachment Photo" }),
                  activity.photo_url ? signedUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: signedUrl, target: "_blank", rel: "noreferrer", className: "block relative group overflow-hidden rounded-xl border border-slate-100 max-h-40", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: signedUrl, alt: "evidence", className: "h-28 w-full object-cover rounded-xl" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "a",
                      {
                        href: signedUrl,
                        download: `evidence_${activity.id}`,
                        target: "_blank",
                        rel: "noreferrer",
                        className: "inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2 py-0.5",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3 w-3" }),
                          " Download Photo"
                        ]
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-28 w-full animate-pulse rounded-xl bg-slate-50" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold italic", children: "No photo attached" }),
                    !activity.photo_url && attendanceRecord?.status === "pending_verification" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 bg-amber-50 border border-amber-100 rounded-xl space-y-2 text-[10px] text-amber-800", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "⚠️ Attendance verification pending due to missing photo." }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white cursor-pointer select-none", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-3 w-3" }),
                        uploading ? "Uploading..." : "Upload Photo",
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "file",
                            accept: "image/*",
                            className: "hidden",
                            onChange: handlePhotoUpload,
                            disabled: uploading
                          }
                        )
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400", children: "दस्तावेज़ / PDF minutes" }),
                  activity.pdf_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 p-2 bg-slate-50 border rounded-xl", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-5 w-5 text-slate-400" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate max-w-[120px] text-[10px]", children: "Minutes.pdf" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "a",
                      {
                        href: activity.pdf_url,
                        target: "_blank",
                        rel: "noreferrer",
                        className: "inline-flex items-center gap-1 text-[10px] font-black text-slate-600 hover:text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3 w-3" }),
                          " Download PDF"
                        ]
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold italic", children: "No PDF document attached" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5 border-t border-slate-100 pt-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] text-slate-400 uppercase", children: "अनुमोदन इतिहास / Approval History" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative pl-6 border-l border-slate-100 space-y-4 text-[10px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-[8px]", children: "1" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-extrabold text-slate-800", children: "सबमिट किया गया / Submitted" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400", children: [
                      "Date: ",
                      new Date(activity.submitted_at).toLocaleString()
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                    "absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white font-bold text-[8px]",
                    activityStatus === "Pending" ? "bg-amber-500 animate-pulse" : "bg-slate-300"
                  ), children: "2" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-extrabold text-slate-800", children: "समीक्षा के अंतर्गत / Under Review" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400", children: activityStatus === "Pending" ? "Currently under review by Block Coordinator" : "Completed review" })
                  ] })
                ] }),
                activityStatus !== "Pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
                    "absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white font-bold text-[8px]",
                    activityStatus === "Approved" ? "bg-emerald-500" : "bg-rose-500"
                  ), children: "3" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-extrabold text-slate-800", children: activityStatus === "Approved" ? "स्वीकृत / Approved" : "अस्वीकृत / Rejected" }),
                    activity.approved_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400", children: [
                      "Date: ",
                      new Date(activity.approved_at).toLocaleString()
                    ] }),
                    activity.approved_by_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400", children: [
                      "Decided By: ",
                      activity.approved_by_name
                    ] }),
                    activity.comment && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 p-2 bg-slate-50 border rounded-lg italic text-slate-500", children: [
                      'Remarks: "',
                      activity.comment,
                      '"'
                    ] })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 border-t border-slate-100 pt-3", children: [
              activityStatus === "Pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "ghost",
                    onClick: () => {
                      setOpenDetailsDialog(false);
                      setOpenEditDialog(true);
                    },
                    className: "h-9 rounded-lg",
                    children: "संपादित करें / Edit"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "destructive",
                    disabled: deleting,
                    onClick: handleDeleteActivity,
                    className: "h-9 rounded-lg",
                    children: "हटाएं / Delete"
                  }
                )
              ] }),
              activityStatus === "Approved" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  onClick: handleDownloadReport,
                  className: "h-9 rounded-lg bg-[#0055A4] text-white",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "mr-1 h-3.5 w-3.5" }),
                    "रिपोर्ट डाउनलोड करें / Download Report"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  onClick: () => setOpenDetailsDialog(false),
                  className: "h-9 rounded-lg",
                  children: "बंद करें / Close"
                }
              )
            ] })
          ] })
        ] }) })
      ]
    }
  );
}
const ACTIVITY_TYPES = ["All", "SHG Meeting", "VO Meeting", "Training", "Farmer Visit", "Livelihood Demo", "Bank Linkage", "Monitoring Visit", "Record Verification", "Community Mobilization", "Enterprise Promotion", "Other"];
function StatCard({
  title,
  value,
  color
}) {
  const styles = {
    blue: "border-blue-100 bg-blue-50/20 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50/20 text-emerald-700",
    amber: "border-amber-100 bg-amber-50/20 text-amber-700",
    rose: "border-rose-100 bg-rose-50/20 text-rose-700",
    purple: "border-purple-100 bg-purple-50/20 text-purple-700",
    teal: "border-teal-100 bg-teal-50/20 text-teal-700"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("rounded-2xl border p-4.5 shadow-sm flex flex-col justify-between min-h-[90px]", styles[color]), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-black uppercase tracking-wider text-slate-400", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-black text-slate-800 mt-2", children: value })
  ] });
}
function HistoryPage() {
  const {
    t,
    lang
  } = useT();
  const {
    data: profile
  } = useProfile();
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [filterStartDate, setFilterStartDate] = reactExports.useState("");
  const [filterEndDate, setFilterEndDate] = reactExports.useState("");
  const [filterStatus, setFilterStatus] = reactExports.useState("All");
  const [filterType, setFilterType] = reactExports.useState("All");
  const [filterVillage, setFilterVillage] = reactExports.useState("All");
  const [showFilters, setShowFilters] = reactExports.useState(false);
  const {
    data = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["my-activities", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const {
        data: data2,
        error
      } = await supabase.from("activities").select("*, blocks(name), approver:profiles!approved_by(full_name)").eq("cadre_id", profile.id).order("activity_date", {
        ascending: false
      }).order("submitted_at", {
        ascending: false
      }).limit(200);
      if (error) throw error;
      return data2;
    }
  });
  const uniqueVillages = reactExports.useMemo(() => {
    const villages = data.map((a) => a.village_name).filter(Boolean);
    return Array.from(new Set(villages)).sort();
  }, [data]);
  const filteredActivities = reactExports.useMemo(() => {
    return data.filter((a) => {
      const matchesSearch = !searchQuery.trim() || a.village_name.toLowerCase().includes(searchQuery.toLowerCase()) || a.panchayat?.toLowerCase().includes(searchQuery.toLowerCase()) || a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "All" || (a.status ?? "").toLowerCase() === filterStatus.toLowerCase();
      const matchesType = filterType === "All" || a.activity_type.toLowerCase() === filterType.toLowerCase() || a.activity_type === "Training_Session" && filterType.toLowerCase() === "training" || a.activity_type === "Livelihood_Activity" && filterType.toLowerCase() === "livelihood demo" || a.activity_type === "Record_Verification" && filterType.toLowerCase() === "record verification" || a.activity_type === "Farmer_Visit" && filterType.toLowerCase() === "farmer visit" || a.activity_type === "Monitoring_Visit" && filterType.toLowerCase() === "monitoring visit";
      const matchesVillage = filterVillage === "All" || a.village_name === filterVillage;
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
  const stats = reactExports.useMemo(() => {
    const total = filteredActivities.length;
    const approved = filteredActivities.filter((a) => a.status === "Approved").length;
    const pending = filteredActivities.filter((a) => a.status === "Pending").length;
    const rejected = filteredActivities.filter((a) => a.status === "Rejected").length;
    const villages = new Set(filteredActivities.map((a) => a.village_name).filter(Boolean)).size;
    const beneficiaries = filteredActivities.reduce((acc, a) => acc + (a.beneficiaries || 0), 0);
    return {
      total,
      approved,
      pending,
      rejected,
      villages,
      beneficiaries
    };
  }, [filteredActivities]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 max-w-5xl mx-auto pb-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cadre", className: "inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
        t("back")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => refetch(), className: "h-8 rounded-lg text-xs font-bold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-1 h-3 w-3" }),
        t("refresh")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black text-slate-800 tracking-tight", children: t("history_title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: t("history_sub") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4.5 grid-cols-2 md:grid-cols-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: t("stat_total"), value: stats.total, color: "blue" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: t("stat_approved"), value: stats.approved, color: "emerald" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: t("stat_pending"), value: stats.pending, color: "amber" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: t("stat_rejected"), value: stats.rejected, color: "rose" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: t("stat_villages"), value: stats.villages, color: "purple" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: t("stat_beneficiaries"), value: stats.beneficiaries, color: "teal" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm space-y-4 text-xs font-bold text-slate-700", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-50 pb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setShowFilters((prev) => !prev), className: "flex items-center gap-1.5 text-slate-600 hover:text-slate-800 transition-colors md:cursor-default", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "h-4 w-4 text-slate-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "uppercase tracking-wider", children: t("filter_options") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 md:hidden text-[10px] text-slate-400", children: showFilters ? "▲" : "▼" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setSearchQuery("");
          setFilterStartDate("");
          setFilterEndDate("");
          setFilterStatus("All");
          setFilterType("All");
          setFilterVillage("All");
        }, className: "text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider", children: t("reset_filters_btn") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: showFilters ? "space-y-4" : "hidden md:block space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] text-slate-400 font-bold uppercase", children: t("search_label") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-slate-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "गाँव, विवरण...", className: "h-10 pl-9 text-xs rounded-lg border-slate-200" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] text-slate-400 font-bold uppercase", children: t("start_date") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: filterStartDate, onChange: (e) => setFilterStartDate(e.target.value), className: "h-10 text-xs rounded-lg border-slate-200 font-bold" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] text-slate-400 font-bold uppercase", children: t("end_date") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: filterEndDate, onChange: (e) => setFilterEndDate(e.target.value), className: "h-10 text-xs rounded-lg border-slate-200 font-bold" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] text-slate-400 font-bold uppercase", children: t("col_status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterStatus, onValueChange: setFilterStatus, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: t("all_statuses_opt") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Pending", children: "Pending / लंबित" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Approved", children: "Approved / स्वीकृत" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Rejected", children: "Rejected / अस्वीकृत" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] text-slate-400 font-bold uppercase", children: t("col_village") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterVillage, onValueChange: setFilterVillage, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: t("all_villages") }),
                uniqueVillages.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: v, children: v }, v))
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5 w-full sm:w-1/3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] text-slate-400 font-bold uppercase", children: t("col_type") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterType, onValueChange: setFilterType, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ACTIVITY_TYPES.map((actType) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: actType, children: actType === "All" ? t("all_types_opt") : actType }, actType)) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-12 text-slate-400 font-bold animate-pulse", children: t("loading") }),
      !isLoading && filteredActivities.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-400 font-semibold shadow-sm", children: t("no_activities_history") }),
      !isLoading && filteredActivities.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx(ActivityCard, { activity: {
        id: a.id,
        activity_date: a.activity_date,
        activity_type: a.activity_type,
        village_name: a.village_name,
        description: a.description,
        photo_url: a.photo_url,
        pdf_url: a.pdf_url,
        submitted_at: a.submitted_at,
        block_name: a.blocks?.name ?? null,
        status: a.status,
        beneficiaries: a.beneficiaries ?? void 0,
        gps: a.gps ?? void 0,
        comment: a.comment,
        cadre_id: a.cadre_id,
        block_id: a.block_id ?? void 0,
        approved_at: a.approved_at,
        approved_by_name: a.approver?.full_name ?? null
      }, onRefetchHistory: refetch }, a.id))
    ] })
  ] });
}
export {
  HistoryPage as component
};
