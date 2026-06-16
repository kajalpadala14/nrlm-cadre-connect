import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-9txPz7Ln.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { u as useT } from "./router-D5xsBJge.mjs";
import { a as useProfile, h as highestRole } from "./use-auth-CD1GunTm.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { d as deleteUser, r as resetUserPin, c as createUser } from "./admin.functions-Cx9q8gJ0.mjs";
import "../_libs/seroval.mjs";
import { P as Plus, b as Users, s as Shield, Y as Pen, Z as Trash2, t as CircleCheckBig, u as CircleX } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
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
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
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
import "../_libs/tailwind-merge.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
import "./server-BC8vK-Dj.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-D0tORCTv.mjs";
import "../_libs/zod.mjs";
const EMPTY_FORM = {
  id: "",
  name: "",
  role: "PRP",
  gender: "Female",
  block_id: "",
  panchayat: "",
  village: "",
  phone: "",
  join_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  status: "Active",
  pin: ""
};
const EMPTY_STAFF_FORM = {
  id: "",
  name: "",
  role: "block_officer",
  block_id: "",
  phone: "",
  pin: ""
};
function UsersPage() {
  const {
    t
  } = useT();
  const {
    data: me
  } = useProfile();
  const isAdmin = highestRole(me?.roles ?? []) === "admin";
  const [activeTab, setActiveTab] = reactExports.useState("cadres");
  const [open, setOpen] = reactExports.useState(false);
  const [editingCadre, setEditingCadre] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState(EMPTY_FORM);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [staffOpen, setStaffOpen] = reactExports.useState(false);
  const [editingStaff, setEditingStaff] = reactExports.useState(null);
  const [staffForm, setStaffForm] = reactExports.useState(EMPTY_STAFF_FORM);
  const {
    data: blocks
  } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("blocks").select("id,name").order("name");
      return data ?? [];
    }
  });
  const {
    data: staffList = [],
    isLoading: staffLoading,
    refetch: refetchStaff
  } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const {
        data: userRoles,
        error: rolesError
      } = await supabase.from("user_roles").select("user_id, role").in("role", ["admin", "block_officer"]);
      if (rolesError) {
        console.error("[staff-list] user_roles fetch error:", rolesError);
        throw rolesError;
      }
      console.log("[staff-list] user_roles rows:", userRoles);
      if (!userRoles || userRoles.length === 0) return [];
      const staffUserIds = userRoles.map((r) => r.user_id);
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from("profiles").select("id, full_name, phone, block_id").in("id", staffUserIds);
      if (profilesError) {
        console.error("[staff-list] profiles fetch error:", profilesError);
        throw profilesError;
      }
      console.log("[staff-list] profiles rows:", profiles);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return userRoles.map((r) => {
        const profile = profileMap.get(r.user_id);
        if (!profile) return null;
        return {
          id: profile.id,
          name: profile.full_name,
          role: r.role,
          block_id: profile.block_id ?? "",
          phone: profile.phone ?? "",
          pin: "••••"
        };
      }).filter(Boolean);
    }
  });
  const {
    data: cadres = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["cadres-list"],
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
      } = await supabase.from("profiles").select("id, user_id, full_name, cadre_type, block_id, phone, village, gender, panchayat, join_date, status").in("id", cadreIds);
      if (pError) throw pError;
      return (profiles ?? []).map((p) => ({
        id: p.id,
        name: p.full_name,
        role: p.cadre_type || "PRP",
        gender: p.gender || "Female",
        block_id: p.block_id || "",
        panchayat: p.panchayat || "",
        village: p.village || "",
        phone: p.phone || "",
        join_date: p.join_date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        status: p.status || "Active",
        pin: "••••"
      }));
    }
  });
  const blockMap = new Map((blocks ?? []).map((b) => [b.id, b.name]));
  const handleOpenAdd = () => {
    setEditingCadre(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };
  const handleOpenEdit = (cadre) => {
    setEditingCadre(cadre);
    setForm(cadre);
    setOpen(true);
  };
  const handleDelete = async (id, name) => {
    if (confirm(`${t("confirm_delete_msg")} ${name}?`)) {
      try {
        await deleteUser({
          data: {
            id
          }
        });
        toast.success(t("toast_deleted"));
        refetch();
      } catch (err) {
        toast.error(`Error deleting user: ${err.message}`);
      }
    }
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("toast_name_required"));
      return;
    }
    if (!editingCadre && !/^[0-9]{4}$/.test(form.pin)) {
      toast.error(t("toast_pin_digits"));
      return;
    }
    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) {
      toast.error(t("toast_phone_digits"));
      return;
    }
    try {
      if (editingCadre) {
        const {
          error
        } = await supabase.from("profiles").update({
          full_name: form.name,
          phone: form.phone || null,
          cadre_type: form.role,
          block_id: form.block_id || null,
          village: form.village || null,
          panchayat: form.panchayat || null,
          gender: form.gender || null,
          join_date: form.join_date || null,
          status: form.status || null
        }).eq("id", editingCadre.id);
        if (error) throw error;
        if (form.pin && form.pin !== "••••") {
          if (!/^[0-9]{4}$/.test(form.pin)) {
            toast.error(t("toast_pin_digits"));
            return;
          }
          await resetUserPin({
            data: {
              id: editingCadre.id,
              pin: form.pin
            }
          });
        }
        toast.success(t("toast_details_updated"));
      } else {
        const derivedUserId = form.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Math.floor(100 + Math.random() * 900);
        await createUser({
          data: {
            user_id: derivedUserId,
            pin: form.pin,
            full_name: form.name,
            phone: form.phone || null,
            role: "cadre",
            cadre_type: form.role,
            block_id: form.block_id || null,
            village: form.village || null,
            panchayat: form.panchayat || null,
            gender: form.gender || null,
            join_date: form.join_date || null,
            status: form.status || null
          }
        });
        toast.success(t("toast_cadre_created"));
      }
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };
  const filteredCadres = cadres.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.role.toLowerCase().includes(searchTerm.toLowerCase()) || c.block_id && blockMap.get(c.block_id)?.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleStaffOpenAdd = () => {
    setEditingStaff(null);
    setStaffForm(EMPTY_STAFF_FORM);
    setStaffOpen(true);
  };
  const handleStaffOpenEdit = (s) => {
    setEditingStaff(s);
    setStaffForm(s);
    setStaffOpen(true);
  };
  const handleStaffDelete = async (id, name) => {
    if (confirm(`Delete staff user "${name}"? This cannot be undone.`)) {
      try {
        await deleteUser({
          data: {
            id
          }
        });
        toast.success("Staff user deleted.");
        refetchStaff();
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      }
    }
  };
  const handleStaffSave = async (e) => {
    e.preventDefault();
    if (!staffForm.name.trim()) {
      toast.error("Full name is required.");
      return;
    }
    if (!editingStaff && !/^[0-9]{4}$/.test(staffForm.pin)) {
      toast.error("PIN must be exactly 4 digits.");
      return;
    }
    if (staffForm.phone && !/^[0-9]{10}$/.test(staffForm.phone)) {
      toast.error("Mobile number must be 10 digits.");
      return;
    }
    if (staffForm.role === "block_officer" && !staffForm.block_id) {
      toast.error("Block Officers must be assigned to a block.");
      return;
    }
    try {
      if (editingStaff) {
        const {
          error
        } = await supabase.from("profiles").update({
          full_name: staffForm.name,
          phone: staffForm.phone || null,
          block_id: staffForm.role === "block_officer" ? staffForm.block_id || null : null
        }).eq("id", editingStaff.id);
        if (error) throw error;
        if (staffForm.pin && staffForm.pin !== "••••") {
          if (!/^[0-9]{4}$/.test(staffForm.pin)) {
            toast.error("PIN must be exactly 4 digits.");
            return;
          }
          await resetUserPin({
            data: {
              id: editingStaff.id,
              pin: staffForm.pin
            }
          });
        }
        toast.success("Staff details updated.");
      } else {
        const derivedUserId = staffForm.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Math.floor(100 + Math.random() * 900);
        await createUser({
          data: {
            user_id: derivedUserId,
            pin: staffForm.pin,
            full_name: staffForm.name,
            phone: staffForm.phone || null,
            role: staffForm.role,
            cadre_type: null,
            block_id: staffForm.role === "block_officer" ? staffForm.block_id || null : null
          }
        });
        toast.success(staffForm.role === "block_officer" ? "Block Officer created." : "District Admin created.");
      }
      setStaffOpen(false);
      refetchStaff();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black text-slate-800 tracking-tight", children: t("cadre_mgmt_page_title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: "Create, update, and manage NRLM Field Cadres" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full sm:w-auto items-center gap-3", children: [
        activeTab === "cadres" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: "Search by name, role, block...", className: "h-10 flex-1 sm:w-64 rounded-xl border-slate-200 bg-white text-xs shadow-sm focus:ring-1 min-w-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleOpenAdd, className: "h-10 rounded-xl px-4 font-bold shadow-md shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
            t("add_cadre_btn")
          ] })
        ] }),
        activeTab === "staff" && isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleStaffOpenAdd, className: "h-10 rounded-xl px-4 font-bold shadow-md shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
          "Add Staff"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 p-1 bg-slate-100 rounded-xl w-fit text-xs font-bold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveTab("cadres"), className: cn("flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all", activeTab === "cadres" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-3.5 w-3.5" }),
        "Field Cadres"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveTab("staff"), className: cn("flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all", activeTab === "staff" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-3.5 w-3.5" }),
        "Staff (Block Officers & Admins)"
      ] })
    ] }),
    activeTab === "cadres" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", children: [
      "        ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "block md:hidden space-y-4", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-slate-400 font-medium animate-pulse", children: t("loading_msg") }) : filteredCadres.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-slate-400 font-medium", children: t("no_cadres_msg") }) : filteredCadres.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 p-4 shadow-sm bg-slate-50/30 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-extrabold text-sm text-slate-800", children: c.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700", children: c.role })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[10px]", c.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"), children: c.status === "Active" ? "Active" : "Inactive" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Gender" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: c.gender })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Block" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: blockMap.get(c.block_id) ?? c.block_id ?? "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Panchayat" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: c.panchayat || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Village" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: c.village })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1 col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Phone / Mobile" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-slate-700", children: c.phone })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-[10px] uppercase", children: "Join Date" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-700", children: c.join_date })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleOpenEdit(c), className: "h-8 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "h-3.5 w-3.5 mr-1" }),
            " Edit"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleDelete(c.id, c.name), className: "h-8 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 mr-1" }),
            " Delete"
          ] })
        ] })
      ] }, c.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_role") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_gender") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_block") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_panchayat") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_village") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_phone") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_join_date") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: t("col_status") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-center", children: t("col_actions") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 10, className: "py-8 text-center text-slate-400 font-medium animate-pulse", children: t("loading_msg") }) }) : filteredCadres.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 10, className: "py-8 text-center text-slate-400 font-medium", children: t("no_cadres_msg") }) }) : filteredCadres.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/50 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 font-bold text-slate-700", children: c.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-md bg-blue-50 px-2 py-0.5 font-bold text-blue-700", children: c.role }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-500 font-semibold", children: c.gender }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-600 font-semibold", children: blockMap.get(c.block_id) ?? c.block_id ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-500 font-semibold", children: c.panchayat || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-500 font-semibold", children: c.village }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 font-mono text-slate-600 font-medium", children: c.phone }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-500 font-semibold", children: c.join_date }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[10px]", c.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"), children: c.status === "Active" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3 w-3" }),
            t("active_status")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3 w-3" }),
            t("inactive_status")
          ] }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleOpenEdit(c), className: "h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDelete(c.id, c.name), className: "h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] }) })
        ] }, c.id)) })
      ] }) })
    ] }),
    " ",
    activeTab === "staff" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: "System Role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: "Assigned Block" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-3", children: "Phone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-center", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: staffLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "py-8 text-center text-slate-400 animate-pulse", children: "Loading staff..." }) }) : staffList.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "py-8 text-center text-slate-400", children: "No Block Officers or Admins found. Add one using the button above." }) }) : staffList.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/50 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 font-bold text-slate-700", children: s.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded-md px-2 py-0.5 font-bold text-[10px]", s.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"), children: s.role === "admin" ? "District Admin" : "Block Officer" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 text-slate-600 font-semibold", children: s.role === "admin" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 italic", children: "District-wide" }) : blockMap.get(s.block_id) ?? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-amber-600 font-bold", children: "⚠ No block assigned" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 pr-3 font-mono text-slate-600", children: s.phone || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3.5 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center gap-1.5", children: isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleStaffOpenEdit(s), className: "h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleStaffDelete(s.id, s.name), className: "h-8 w-8 text-rose-600 hover:bg-rose-50 rounded-lg p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] }) }) })
        ] }, s.id)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "block md:hidden space-y-4", children: staffLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-slate-400 animate-pulse", children: "Loading..." }) : staffList.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-slate-400", children: "No staff users found." }) : staffList.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 p-4 shadow-sm bg-slate-50/30 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-extrabold text-sm text-slate-800", children: s.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded-md px-2 py-0.5 font-bold text-[10px]", s.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"), children: s.role === "admin" ? "District Admin" : "Block Officer" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-slate-600 font-semibold", children: [
          "Block: ",
          s.role === "admin" ? "District-wide" : blockMap.get(s.block_id) ?? "⚠ Unassigned"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-mono text-slate-500", children: s.phone || "No phone" }),
        isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleStaffOpenEdit(s), className: "h-8 text-xs text-blue-600 border-blue-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "h-3.5 w-3.5 mr-1" }),
            " Edit"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleStaffDelete(s.id, s.name), className: "h-8 text-xs text-rose-600 border-rose-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 mr-1" }),
            " Delete"
          ] })
        ] })
      ] }, s.id)) })
    ] }),
    " ",
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: staffOpen, onOpenChange: setStaffOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md rounded-2xl p-6 shadow-xl border border-slate-100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { className: "border-b border-slate-100 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-lg font-black text-slate-800", children: editingStaff ? "Edit Staff User" : "Add Staff User" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleStaffSave, className: "space-y-4 pt-3 text-xs font-bold text-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: "Full Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: staffForm.name, onChange: (e) => setStaffForm({
            ...staffForm,
            name: e.target.value
          }), placeholder: "e.g. Ramesh Sharma", className: "h-10 rounded-lg border-slate-200 text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: "Mobile Number" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { maxLength: 10, inputMode: "numeric", value: staffForm.phone, onChange: (e) => setStaffForm({
            ...staffForm,
            phone: e.target.value.replace(/\D/g, "")
          }), placeholder: "e.g. 9876543210", className: "h-10 rounded-lg border-slate-200 text-xs" })
        ] }),
        !editingStaff && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: "System Role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: staffForm.role, onValueChange: (v) => setStaffForm({
            ...staffForm,
            role: v
          }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-lg border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "block_officer", children: "Block Officer (Block Coordinator)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "admin", children: "Admin (District Admin)" })
            ] })
          ] })
        ] }),
        staffForm.role === "block_officer" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs font-bold text-slate-500", children: [
            "Assigned Block ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-rose-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: staffForm.block_id, onValueChange: (v) => setStaffForm({
            ...staffForm,
            block_id: v
          }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-lg border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select Block" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: (blocks ?? []).map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: b.id, children: b.name }, b.id)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-medium", children: "Cadres in this block will see this person as their Block Coordinator on the Help page." })
        ] }),
        staffForm.role === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-medium bg-purple-50 rounded-lg p-2.5 border border-purple-100", children: "Admins are District-level. All cadres will see this person as their District Admin on the Help page." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: editingStaff ? "New PIN (leave blank to keep current)" : "Login PIN" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { maxLength: 4, inputMode: "numeric", value: staffForm.pin, onChange: (e) => setStaffForm({
            ...staffForm,
            pin: e.target.value.replace(/\D/g, "")
          }), placeholder: "••••", className: "h-10 rounded-lg border-slate-200 text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "border-t border-slate-100 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: () => setStaffOpen(false), className: "rounded-lg h-10", children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "rounded-lg h-10 px-5 font-bold shadow-md", children: "Save" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-xl rounded-2xl p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { className: "border-b border-slate-100 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-lg font-black text-slate-800", children: editingCadre ? t("edit_cadre_title") : t("add_new_cadre_title") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSave, className: "space-y-4 pt-3 text-xs font-bold text-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("full_name_field") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.name, onChange: (e) => setForm({
              ...form,
              name: e.target.value
            }), placeholder: "e.g. Ashok Kumar", className: "h-10 rounded-lg border-slate-200 text-xs" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("mobile_number_field") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { maxLength: 10, inputMode: "numeric", value: form.phone, onChange: (e) => setForm({
              ...form,
              phone: e.target.value.replace(/\D/g, "")
            }), placeholder: "e.g. 9876543210", className: "h-10 rounded-lg border-slate-200 text-xs" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("cadre_role_field") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.role, onValueChange: (v) => setForm({
              ...form,
              role: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-lg border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select Role" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "PRP", children: "PRP" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "FLCRP", children: "FLCRP" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "RBK", children: "RBK" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "IFC_Anchor", children: "IFC Anchor" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "SR_CRP", children: "SR.CRP" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("gender_field") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.gender, onValueChange: (v) => setForm({
              ...form,
              gender: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-lg border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select Gender" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Male", children: t("male_option") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Female", children: t("female_option") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Other", children: t("other_option") })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("block_field") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.block_id, onValueChange: (v) => setForm({
              ...form,
              block_id: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-lg border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select Block" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                (blocks ?? []).map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: b.id, children: b.name }, b.id)),
                (blocks ?? []).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", disabled: true, children: "No blocks available" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("panchayat_field") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.panchayat, onChange: (e) => setForm({
              ...form,
              panchayat: e.target.value
            }), placeholder: "e.g. Kalnar", className: "h-10 rounded-lg border-slate-200 text-xs" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("village_field") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.village, onChange: (e) => setForm({
              ...form,
              village: e.target.value
            }), placeholder: "e.g. Reslapur", className: "h-10 rounded-lg border-slate-200 text-xs" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("joining_date_field") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: form.join_date, onChange: (e) => setForm({
              ...form,
              join_date: e.target.value
            }), className: "h-10 rounded-lg border-slate-200 text-xs" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("pin_field") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { maxLength: 4, inputMode: "numeric", value: form.pin, onChange: (e) => setForm({
              ...form,
              pin: e.target.value.replace(/\D/g, "")
            }), placeholder: "••••", className: "h-10 rounded-lg border-slate-200 text-xs" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold text-slate-500", children: t("status_field") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.status, onValueChange: (v) => setForm({
              ...form,
              status: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-lg border-slate-200 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Active", children: t("active_status") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Inactive", children: t("inactive_status") })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "border-t border-slate-100 pt-4 mt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: () => setOpen(false), className: "rounded-lg h-10", children: t("cancel_btn") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "rounded-lg h-10 px-5 font-bold shadow-md", children: t("save_btn") })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  UsersPage as component
};
