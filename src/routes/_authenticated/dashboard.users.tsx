import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, CheckCircle, XCircle, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useProfile, highestRole, type CadreType } from "@/hooks/use-auth";
import { getUserDataScope } from "@/lib/data-scope";
import { supabase } from "@/integrations/supabase/client";
import { createUser, deleteUser, resetUserPin, updateUserProfile } from "@/lib/admin.functions";
import { CADRE_LOCATION_MAX_LENGTH } from "@/lib/validation-limits";
import { isBlockScopedStaffRole, type BlockScopedStaffRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/dashboard/users")({
  component: UsersPage,
});

interface CadreForm {
  id: string;
  user_id: string;
  name: string;
  role: string;
  gender: string;
  block_id: string;
  panchayat: string;
  village: string;
  phone: string;
  join_date: string;
  status: "Active" | "Inactive";
  pin: string;
}

type StaffSystemRole = "admin" | BlockScopedStaffRole;
type StaffFormRole = StaffSystemRole | "BPM" | "DPM" | "AC";

interface StaffForm {
  id: string;
  user_id: string;
  name: string;
  role: StaffFormRole;
  block_id: string; // required for block-scoped staff, ignored for admin
  phone: string;
  pin: string;
}

const EMPTY_FORM: CadreForm = {
  id: "",
  user_id: "",
  name: "",
  role: "PRP",
  gender: "Female",
  block_id: "",
  panchayat: "",
  village: "",
  phone: "",
  join_date: new Date().toISOString().slice(0, 10),
  status: "Active",
  pin: "",
};

const EMPTY_STAFF_FORM: StaffForm = {
  id: "",
  user_id: "",
  name: "",
  role: "block_officer",
  block_id: "",
  phone: "",
  pin: "",
};

const USER_ID_PATTERN = /^[a-zA-Z0-9_.-]{2,40}$/;

const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

const getStaffSystemRole = (role: StaffFormRole): StaffSystemRole =>
  role === "DPM" ? "admin" : role === "BPM" || role === "AC" ? "block_officer" : role;

const getStaffRoleLabel = (role: StaffFormRole) =>
  role === "admin"
    ? "District Admin"
    : role === "DPM"
      ? "DPM (District Programme Manager)"
      : role === "BPM"
        ? "BPM (Block Programme Manager)"
        : role === "AC"
          ? "AC (Area Coordinator)"
          : role === "fnhw"
            ? "FNHW"
            : role === "si"
              ? "SI"
              : "Block Officer";

function UsersPage() {
  const { t } = useT();
  const { data: me } = useProfile();
  const scope = getUserDataScope(me);
  const isAdmin = highestRole(me?.roles ?? []) === "admin";

  // Tab state: "cadres" | "staff"
  const [activeTab, setActiveTab] = useState<"cadres" | "staff">("cadres");

  const [open, setOpen] = useState(false);
  const [editingCadre, setEditingCadre] = useState<CadreForm | null>(null);
  const [form, setForm] = useState<CadreForm>(EMPTY_FORM);
  const [isCadreSaving, setIsCadreSaving] = useState(false);
  const cadreSaveInFlightRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");

  // Staff tab state
  const [staffOpen, setStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffForm | null>(null);
  const [staffForm, setStaffForm] = useState<StaffForm>(EMPTY_STAFF_FORM);
  const [isStaffSaving, setIsStaffSaving] = useState(false);
  const staffSaveInFlightRef = useRef(false);

  const { data: blocks } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => {
      const { data } = await supabase.from("blocks").select("id,name").order("name");
      return data ?? [];
    },
  });

  // Fetch staff users for the Staff tab
  // NOTE: user_roles has no FK to profiles in the DB schema, so PostgREST
  // rejects the profiles!inner(...) join with a 400. We fetch both tables
  // separately and merge by user_id in JS — same pattern used by cadres-list.
  const {
    data: staffList = [],
    isLoading: staffLoading,
    refetch: refetchStaff,
  } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      if (!isAdmin) return [];
      // Step 1: fetch all staff rows from user_roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "block_officer"]);

      if (rolesError) {
        console.error("[staff-list] user_roles fetch error:", rolesError);
        throw rolesError;
      }
      console.log("[staff-list] user_roles rows:", userRoles);

      if (!userRoles || userRoles.length === 0) return [];

      const staffUserIds = userRoles.map((r) => r.user_id);

      // Step 2: fetch matching profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, phone, block_id")
        .in("id", staffUserIds);

      if (profilesError) {
        console.error("[staff-list] profiles fetch error:", profilesError);
        throw profilesError;
      }
      console.log("[staff-list] profiles rows:", profiles);

      // Step 3: merge by user_id === profile.id
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      return userRoles
        .map((r) => {
          const profile = profileMap.get(r.user_id);
          if (!profile) return null; // role row exists but no matching profile
          return {
            id: profile.id,
            user_id: profile.user_id || "",
            name: profile.full_name,
            role: r.role as StaffSystemRole,
            block_id: (profile.block_id ?? "") as string,
            phone: (profile.phone ?? "") as string,
            pin: "••••",
          };
        })
        .filter(Boolean) as Array<{
          id: string;
          user_id: string;
          name: string;
          role: StaffSystemRole;
          block_id: string;
          phone: string;
          pin: string;
        }>;
    },
  });

  const {
    data: cadres = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["cadres-list", scope.blockId],
    queryFn: async () => {
      const { data: userRoles, error: urError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["cadre", "fnhw", "si"]);
      if (urError) throw urError;

      const cadreIds = userRoles.map((ur) => ur.user_id);
      if (cadreIds.length === 0) return [];

      let profilesQuery = supabase
        .from("profiles")
        .select(
          "id, user_id, full_name, cadre_type, block_id, phone, village, gender, panchayat, join_date, status",
        )
        .in("id", cadreIds);
      if (scope.isScoped && scope.blockId) {
        profilesQuery = profilesQuery.eq("block_id", scope.blockId);
      }
      const { data: profiles, error: pError } = await profilesQuery;
      if (pError) throw pError;

      const roleMap = new Map(userRoles.map((ur) => [ur.user_id, ur.role]));

      return (profiles ?? []).map((p) => {
        const dbRole = roleMap.get(p.id);
        const displayRole = dbRole === "fnhw" ? "FNHW" : dbRole === "si" ? "SI" : p.cadre_type || "PRP";
        return {
          id: p.id,
          user_id: p.user_id || "",
          name: p.full_name,
          role: displayRole,
          gender: p.gender || "Female",
          block_id: p.block_id || "",
          panchayat: p.panchayat || "",
          village: p.village || "",
          phone: p.phone || "",
          join_date: p.join_date || new Date().toISOString().slice(0, 10),
          status: (p.status as "Active" | "Inactive") || "Active",
          pin: "••••",
        };
      });
    },
  });

  const blockMap = new Map((blocks ?? []).map((b) => [b.id, b.name]));

  const handleOpenAdd = () => {
    if (isCadreSaving) return;
    setEditingCadre(null);
    setForm({
      ...EMPTY_FORM,
      block_id:
        scope.isScoped && scope.blockId
          ? scope.blockId
          : blocks && blocks.length > 0
            ? blocks[0].id
            : "",
    });
    setOpen(true);
  };

  const handleOpenEdit = (cadre: CadreForm) => {
    if (isCadreSaving) return;
    setEditingCadre(cadre);
    setForm(cadre);
    setOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`${t("confirm_delete_msg")} ${name}?`)) {
      try {
        await deleteUser({ data: { id } });
        toast.success(t("toast_deleted"));
        refetch();
      } catch (err: unknown) {
        toast.error(`Error deleting user: ${getErrorMessage(err)}`);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Strict re-entrancy guard: ref is set synchronously before any await,
    // so even if React hasn't re-rendered yet (button still enabled), all
    // subsequent calls from rapid clicks are dropped immediately.
    if (cadreSaveInFlightRef.current) return;

    if (!form.name.trim()) {
      toast.error(t("toast_name_required"));
      return;
    }
    if (editingCadre && !USER_ID_PATTERN.test(form.user_id.trim())) {
      toast.error("User ID must be 2-40 characters: letters, digits, _ . - only.");
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
    const village = form.village.trim();
    const panchayat = form.panchayat.trim();
    if (village.length > CADRE_LOCATION_MAX_LENGTH) {
      toast.error(`Village must be ${CADRE_LOCATION_MAX_LENGTH} characters or fewer.`);
      return;
    }
    if (panchayat.length > CADRE_LOCATION_MAX_LENGTH) {
      toast.error(`Panchayat must be ${CADRE_LOCATION_MAX_LENGTH} characters or fewer.`);
      return;
    }

    // Derive user_id BEFORE setting the in-flight flag so that all rapid
    // clicks that slip through before the re-render get the same value,
    // which means they will all attempt the same email on the backend and
    // only the first one succeeds.
    const derivedUserId = editingCadre
      ? null
      : form.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20) +
      "_" +
      Math.floor(100 + Math.random() * 900);

    // Set BOTH the ref (synchronous, stops re-entrant calls instantly) and
    // the state (triggers button disabled re-render).
    cadreSaveInFlightRef.current = true;
    setIsCadreSaving(true);

    try {
      if (editingCadre) {
        if (!editingCadre.id) {
          throw new Error("Missing cadre record id. Please reopen the form and try again.");
        }
        await updateUserProfile({
          data: {
            id: editingCadre.id,
            user_id: form.user_id.trim(),
            full_name: form.name,
            phone: form.phone || null,
            role: (form.role === "FNHW" ? "fnhw" : form.role === "SI" ? "si" : "cadre"),
            cadre_type: form.role as CadreType,
            block_id: scope.isScoped && scope.blockId ? scope.blockId : form.block_id || null,
            village: village || null,
            panchayat: panchayat || null,
            gender: form.gender || null,
            join_date: form.join_date || null,
            status: form.status || null,
          },
        });

        // Check if PIN was changed
        if (form.pin && form.pin !== "••••") {
          if (!/^[0-9]{4}$/.test(form.pin)) {
            toast.error(t("toast_pin_digits"));
            return;
          }
          await resetUserPin({ data: { id: editingCadre.id, pin: form.pin } });
        }

        toast.success(t("toast_details_updated"));
      } else {
        // Add using server function — pass the pre-derived user_id so all
        // duplicate rapid-clicks attempt the exact same email address and
        // the server-side idempotency guard deduplicates them.
        await createUser({
          data: {
            user_id: derivedUserId!,
            pin: form.pin,
            full_name: form.name,
            phone: form.phone || null,
            role: (form.role === "FNHW" ? "fnhw" : form.role === "SI" ? "si" : "cadre"),
            cadre_type: form.role as CadreType,
            block_id: scope.isScoped && scope.blockId ? scope.blockId : form.block_id || null,
            village: village || null,
            panchayat: panchayat || null,
            gender: form.gender || null,
            join_date: form.join_date || null,
            status: form.status || null,
          },
        });

        toast.success(t("toast_cadre_created"));
      }
      setOpen(false);
      setForm(EMPTY_FORM);
      refetch();
    } catch (err: unknown) {
      toast.error(`Error: ${getErrorMessage(err)}`);
    } finally {
      cadreSaveInFlightRef.current = false;
      setIsCadreSaving(false);
    }
  };

  const filteredCadres = cadres.filter(
    (c) =>
      (statusFilter === "all" || c.status === statusFilter) &&
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.block_id && blockMap.get(c.block_id)?.toLowerCase().includes(searchTerm.toLowerCase()))),
  );

  const activeCount = cadres.filter((c) => c.status === "Active").length;
  const inactiveCount = cadres.filter((c) => c.status === "Inactive").length;

  const filteredStaff = staffList.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.user_id.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      (s.block_id && blockMap.get(s.block_id)?.toLowerCase().includes(q))
    );
  });

  // ── Staff tab handlers ───────────────────────────────────────────────────
  const handleStaffOpenAdd = () => {
    if (isStaffSaving) return;
    setEditingStaff(null);
    setStaffForm(EMPTY_STAFF_FORM);
    setStaffOpen(true);
  };

  const handleStaffOpenEdit = (s: StaffForm) => {
    if (isStaffSaving) return;
    setEditingStaff(s);
    setStaffForm(s);
    setStaffOpen(true);
  };

  const handleStaffDelete = async (id: string, name: string) => {
    if (confirm(`Delete staff user "${name}"? This cannot be undone.`)) {
      try {
        await deleteUser({ data: { id } });
        toast.success("Staff user deleted.");
        refetchStaff();
      } catch (err: unknown) {
        toast.error(`Error: ${getErrorMessage(err)}`);
      }
    }
  };

  const handleStaffSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Strict re-entrancy guard — same pattern as handleSave
    if (staffSaveInFlightRef.current) return;

    if (!staffForm.name.trim()) {
      toast.error("Full name is required.");
      return;
    }
    if (editingStaff && !USER_ID_PATTERN.test(staffForm.user_id.trim())) {
      toast.error("User ID must be 2-40 characters: letters, digits, _ . - only.");
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
    const staffSystemRole = getStaffSystemRole(staffForm.role);
    if (isBlockScopedStaffRole(staffSystemRole) && !staffForm.block_id) {
      toast.error("Block-level staff must be assigned to a block.");
      return;
    }

    // Derive user_id before locking so rapid clicks share the same value
    const derivedStaffUserId = editingStaff
      ? null
      : staffForm.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20) +
      "_" +
      Math.floor(100 + Math.random() * 900);

    staffSaveInFlightRef.current = true;
    setIsStaffSaving(true);
    try {
      if (editingStaff) {
        if (!editingStaff.id) {
          throw new Error("Missing staff record id. Please reopen the form and try again.");
        }
        await updateUserProfile({
          data: {
            id: editingStaff.id,
            user_id: staffForm.user_id.trim(),
            full_name: staffForm.name,
            phone: staffForm.phone || null,
            role: staffSystemRole,
            block_id: isBlockScopedStaffRole(staffSystemRole) ? staffForm.block_id || null : null,
          },
        });

        if (staffForm.pin && staffForm.pin !== "••••") {
          if (!/^[0-9]{4}$/.test(staffForm.pin)) {
            toast.error("PIN must be exactly 4 digits.");
            return;
          }
          await resetUserPin({ data: { id: editingStaff.id, pin: staffForm.pin } });
        }
        toast.success("Staff details updated.");
      } else {
        await createUser({
          data: {
            user_id: derivedStaffUserId!,
            pin: staffForm.pin,
            full_name: staffForm.name,
            phone: staffForm.phone || null,
            role: staffSystemRole,
            cadre_type: null,
            block_id: isBlockScopedStaffRole(staffSystemRole) ? staffForm.block_id || null : null,
          },
        });
        toast.success(`${getStaffRoleLabel(staffForm.role)} created.`);
      }
      setStaffOpen(false);
      setStaffForm(EMPTY_STAFF_FORM);
      refetchStaff();
    } catch (err: unknown) {
      toast.error(`Error: ${getErrorMessage(err)}`);
    } finally {
      staffSaveInFlightRef.current = false;
      setIsStaffSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {t("cadre_mgmt_page_title")}
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
            Create, update, and manage NRLM Field Cadres
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          {activeTab === "cadres" && (
            <>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, Cadre ID, role, block..."
                className="h-10 flex-1 sm:w-64 rounded-xl border-slate-200 bg-white text-xs shadow-sm focus:ring-1 min-w-0"
              />
              {/* Status filter */}
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as "all" | "Active" | "Inactive")}
              >
                <SelectTrigger className="h-10 w-36 shrink-0 rounded-xl border-slate-200 bg-white text-xs font-bold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({cadres.length})</SelectItem>
                  <SelectItem value="Active">✅ Active ({activeCount})</SelectItem>
                  <SelectItem value="Inactive">❌ Inactive ({inactiveCount})</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleOpenAdd}
                className="h-10 rounded-xl px-4 font-bold shadow-md shrink-0"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {t("add_cadre_btn")}
              </Button>
            </>
          )}
          {activeTab === "staff" && isAdmin && (
            <>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, User ID, role, block..."
                className="h-10 flex-1 sm:w-64 rounded-xl border-slate-200 bg-white text-xs shadow-sm focus:ring-1 min-w-0"
              />
              <Button
                onClick={handleStaffOpenAdd}
                className="h-10 rounded-xl px-4 font-bold shadow-md shrink-0"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Staff
              </Button>
            </>
          )}
        </div>
      </div>
      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab("cadres")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all",
            activeTab === "cadres"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          <Users className="h-3.5 w-3.5" />
          Field Cadres
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("staff")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all",
              activeTab === "staff"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            Staff (Block Staff &amp; Admins)
          </button>
        )}
      </div>
      {/* Cadre Table Grid — only shown when "cadres" tab is active */}
      {activeTab === "cadres" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          {" "}
          {/* Mobile Card Deck View */}
          <div className="block md:hidden space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-slate-400 font-medium animate-pulse">
                {t("loading_msg")}
              </div>
            ) : filteredCadres.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-medium">
                {t("no_cadres_msg")}
              </div>
            ) : (
              filteredCadres.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-100 p-4 shadow-sm bg-slate-50/30 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <span className="block truncate font-extrabold text-sm text-slate-800">
                          {c.name}
                        </span>
                        <span className="block truncate font-mono text-[10px] font-bold uppercase text-slate-400">
                          Cadre ID: {c.user_id || "—"}
                        </span>
                      </div>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {c.role}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[10px]",
                        c.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700",
                      )}
                    >
                      {c.status === "Active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] uppercase">Gender</span>
                      <span className="font-bold text-slate-700">{c.gender}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] uppercase">Block</span>
                      <span className="font-bold text-slate-700">
                        {blockMap.get(c.block_id) ?? c.block_id ?? "—"}
                      </span>
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="text-slate-400 text-[10px] uppercase">Panchayat</span>
                      <span className="font-bold text-slate-700">{c.panchayat || "—"}</span>
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="text-slate-400 text-[10px] uppercase">Village</span>
                      <span className="font-bold text-slate-700">{c.village}</span>
                    </div>
                    <div className="flex flex-col pt-1 col-span-2">
                      <span className="text-slate-400 text-[10px] uppercase">Phone / Mobile</span>
                      <span className="font-bold font-mono text-slate-700">{c.phone}</span>
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="text-slate-400 text-[10px] uppercase">Join Date</span>
                      <span className="font-bold text-slate-700">{c.join_date}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(c)}
                      className="h-8 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(c.id, c.name)}
                      className="h-8 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
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
                  <th className="py-3 pr-3">{t("col_cadre_id")}</th>
                  <th className="py-3 pr-3">{t("col_role")}</th>
                  <th className="py-3 pr-3">{t("col_gender")}</th>
                  <th className="py-3 pr-3">{t("col_block")}</th>
                  <th className="py-3 pr-3">{t("col_panchayat")}</th>
                  <th className="py-3 pr-3">{t("col_village")}</th>
                  <th className="py-3 pr-3">{t("col_phone")}</th>
                  <th className="py-3 pr-3">{t("col_join_date")}</th>
                  <th className="py-3 pr-3">{t("col_status")}</th>
                  <th className="py-3 text-center">{t("col_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-8 text-center text-slate-400 font-medium animate-pulse"
                    >
                      {t("loading_msg")}
                    </td>
                  </tr>
                ) : filteredCadres.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                      {t("no_cadres_msg")}
                    </td>
                  </tr>
                ) : (
                  filteredCadres.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pr-3 font-bold text-slate-700">{c.name}</td>
                      <td className="py-3.5 pr-3 font-mono text-slate-600 font-semibold">
                        {c.user_id || "—"}
                      </td>
                      <td className="py-3.5 pr-3">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                          {c.role}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-500 font-semibold">{c.gender}</td>
                      <td className="py-3.5 pr-3 text-slate-600 font-semibold">
                        {blockMap.get(c.block_id) ?? c.block_id ?? "—"}
                      </td>
                      <td className="py-3.5 pr-3 text-slate-500 font-semibold">
                        {c.panchayat || "—"}
                      </td>
                      <td className="py-3.5 pr-3 text-slate-500 font-semibold">{c.village}</td>
                      <td className="py-3.5 pr-3 font-mono text-slate-600 font-medium">
                        {c.phone}
                      </td>
                      <td className="py-3.5 pr-3 text-slate-500 font-semibold">{c.join_date}</td>
                      <td className="py-3.5 pr-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[10px]",
                            c.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700",
                          )}
                        >
                          {c.status === "Active" ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              {t("active_status")}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              {t("inactive_status")}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(c)}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg p-0"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(c.id, c.name)}
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      )}{" "}
      {/* end activeTab === "cadres" */}
      {/* ── Staff Panel ── */}
      {activeTab === "staff" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 pr-3">Name</th>
                  <th className="py-3 pr-3">User ID</th>
                  <th className="py-3 pr-3">System Role</th>
                  <th className="py-3 pr-3">Assigned Block</th>
                  <th className="py-3 pr-3">Phone</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staffLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 animate-pulse">
                      Loading staff...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No staff users found. Add one using the button above.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pr-3 font-bold text-slate-700">{s.name}</td>
                      <td className="py-3.5 pr-3 font-mono text-slate-600 font-semibold">
                        {s.user_id || "—"}
                      </td>
                      <td className="py-3.5 pr-3">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 font-bold text-[10px]",
                            s.role === "admin"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-emerald-50 text-emerald-700",
                          )}
                        >
                          {getStaffRoleLabel(s.role)}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600 font-semibold">
                        {s.role === "admin" ? (
                          <span className="text-slate-400 italic">District-wide</span>
                        ) : (
                          (blockMap.get(s.block_id) ?? (
                            <span className="text-amber-600 font-bold">⚠ No block assigned</span>
                          ))
                        )}
                      </td>
                      <td className="py-3.5 pr-3 font-mono text-slate-600">{s.phone || "—"}</td>
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStaffOpenEdit(s)}
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg p-0"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStaffDelete(s.id, s.name)}
                                className="h-8 w-8 text-rose-600 hover:bg-rose-50 rounded-lg p-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards for staff */}
          <div className="block md:hidden space-y-4">
            {staffLoading ? (
              <div className="text-center py-8 text-slate-400 animate-pulse">Loading...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No staff users found.</div>
            ) : (
              filteredStaff.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-100 p-4 shadow-sm bg-slate-50/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="block truncate font-extrabold text-sm text-slate-800">
                        {s.name}
                      </span>
                      <span className="block truncate font-mono text-[10px] font-bold uppercase text-slate-400">
                        User ID: {s.user_id || "—"}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-0.5 font-bold text-[10px]",
                        s.role === "admin"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {getStaffRoleLabel(s.role)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-semibold">
                    Block:{" "}
                    {s.role === "admin"
                      ? "District-wide"
                      : (blockMap.get(s.block_id) ?? "⚠ Unassigned")}
                  </div>
                  <div className="text-xs font-mono text-slate-500">{s.phone || "No phone"}</div>
                  {isAdmin && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStaffOpenEdit(s)}
                        className="h-8 text-xs text-blue-600 border-blue-200"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStaffDelete(s.id, s.name)}
                        className="h-8 text-xs text-rose-600 border-rose-200"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}{" "}
      {/* end activeTab === "staff" */}
      {/* ── Staff Add / Edit Dialog ── */}
      <Dialog
        open={staffOpen}
        onOpenChange={(nextOpen) => !isStaffSaving && setStaffOpen(nextOpen)}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 shadow-xl border border-slate-100">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-black text-slate-800">
              {editingStaff ? "Edit Staff User" : "Add Staff User"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleStaffSave}
            className="space-y-4 pt-3 text-xs font-bold text-slate-700"
          >
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-500">Full Name</Label>
              <Input
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                placeholder="e.g. Ramesh Sharma"
                className="h-10 rounded-lg border-slate-200 text-xs"
              />
            </div>
            {editingStaff && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">User ID</Label>
                <Input
                  value={staffForm.user_id}
                  onChange={(e) => setStaffForm({ ...staffForm, user_id: e.target.value.trim() })}
                  placeholder="e.g. saritakarma_292"
                  className="h-10 rounded-lg border-slate-200 font-mono text-xs"
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-500">Mobile Number</Label>
              <Input
                maxLength={10}
                inputMode="numeric"
                value={staffForm.phone}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, phone: e.target.value.replace(/\D/g, "") })
                }
                placeholder="e.g. 9876543210"
                className="h-10 rounded-lg border-slate-200 text-xs"
              />
            </div>
            {!editingStaff && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">System Role</Label>
                <Select
                  value={staffForm.role}
                  onValueChange={(v) => setStaffForm({ ...staffForm, role: v as StaffFormRole })}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block_officer">Block Officer (Block Coordinator)</SelectItem>
                    <SelectItem value="admin">Admin (District Admin)</SelectItem>
                    <SelectItem value="BPM">BPM (Block Programme Manager)</SelectItem>
                    <SelectItem value="DPM">DPM(District Programme Manager)</SelectItem>
                    <SelectItem value="AC">AC (Area Coordinator)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {isBlockScopedStaffRole(getStaffSystemRole(staffForm.role)) && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">
                  Assigned Block <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={staffForm.block_id}
                  onValueChange={(v) => setStaffForm({ ...staffForm, block_id: v })}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-200 text-xs">
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
                <p className="text-[10px] text-slate-400 font-medium">
                  Cadres in this block will see this person as their Block Coordinator on the Help
                  page.
                </p>
              </div>
            )}
            {getStaffSystemRole(staffForm.role) === "admin" && (
              <p className="text-[10px] text-slate-400 font-medium bg-purple-50 rounded-lg p-2.5 border border-purple-100">
                Admins are District-level. All cadres will see this person as their District Admin
                on the Help page.
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-500">
                {editingStaff ? "New PIN (leave blank to keep current)" : "Login PIN"}
              </Label>
              <Input
                maxLength={4}
                inputMode="numeric"
                value={staffForm.pin}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, pin: e.target.value.replace(/\D/g, "") })
                }
                placeholder="••••"
                className="h-10 rounded-lg border-slate-200 text-xs"
              />
            </div>
            <DialogFooter className="border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStaffOpen(false)}
                disabled={isStaffSaving}
                className="rounded-lg h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isStaffSaving}
                className="rounded-lg h-10 px-5 font-bold shadow-md"
              >
                {isStaffSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={open} onOpenChange={(nextOpen) => !isCadreSaving && setOpen(nextOpen)}>
        <DialogContent className="max-w-xl rounded-2xl p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-black text-slate-800">
              {editingCadre ? t("edit_cadre_title") : t("add_new_cadre_title")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-3 text-xs font-bold text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">{t("full_name_field")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ashok Kumar"
                  className="h-10 rounded-lg border-slate-200 text-xs"
                />
              </div>

              {editingCadre && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-500">{t("user_id")}</Label>
                  <Input
                    value={form.user_id}
                    onChange={(e) => setForm({ ...form, user_id: e.target.value.trim() })}
                    placeholder="e.g. saritakarma_292"
                    className="h-10 rounded-lg border-slate-200 font-mono text-xs"
                  />
                </div>
              )}

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">
                  {t("mobile_number_field")}
                </Label>
                <Input
                  maxLength={10}
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                  placeholder="e.g. 9876543210"
                  className="h-10 rounded-lg border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role Dropdown */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">{t("cadre_role_field")}</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="h-10 rounded-lg border-slate-200 text-xs">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRP">PRP</SelectItem>
                    <SelectItem value="FLCRP">FLCRP</SelectItem>
                    <SelectItem value="RBK">RBK</SelectItem>
                    <SelectItem value="IFC_Anchor">IFC Anchor</SelectItem>
                    <SelectItem value="SR_CRP">SR.CRP</SelectItem>
                    <SelectItem value="FPO_CEO">FPO CEO</SelectItem>
                    <SelectItem value="Gender">Gender</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">{t("gender_field")}</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger className="h-10 rounded-lg border-slate-200 text-xs">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">{t("male_option")}</SelectItem>
                    <SelectItem value="Female">{t("female_option")}</SelectItem>
                    <SelectItem value="Other">{t("other_option")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Block */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">{t("block_field")}</Label>
                <Select
                  value={form.block_id}
                  onValueChange={(v) => setForm({ ...form, block_id: v })}
                  disabled={scope.isScoped}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-200 text-xs">
                    <SelectValue placeholder="Select Block" />
                  </SelectTrigger>
                  <SelectContent>
                    {(blocks ?? [])
                      .filter((b) => !scope.isScoped || b.id === scope.blockId)
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    {(blocks ?? []).length === 0 && (
                      <SelectItem value="__none" disabled>
                        No blocks available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Panchayat */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">{t("panchayat_field")}</Label>
                <Input
                  maxLength={CADRE_LOCATION_MAX_LENGTH}
                  value={form.panchayat}
                  onChange={(e) => setForm({ ...form, panchayat: e.target.value })}
                  placeholder="e.g. Kalnar"
                  className="h-10 rounded-lg border-slate-200 text-xs"
                />
              </div>

              {/* Village */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">{t("village_field")}</Label>
                <Input
                  maxLength={CADRE_LOCATION_MAX_LENGTH}
                  value={form.village}
                  onChange={(e) => setForm({ ...form, village: e.target.value })}
                  placeholder="e.g. Reslapur"
                  className="h-10 rounded-lg border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Join Date */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">
                  {t("joining_date_field")}
                </Label>
                <Input
                  type="date"
                  value={form.join_date}
                  onChange={(e) => setForm({ ...form, join_date: e.target.value })}
                  className="h-10 rounded-lg border-slate-200 text-xs"
                />
              </div>

              {/* PIN */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">{t("pin_field")}</Label>
                <Input
                  maxLength={4}
                  inputMode="numeric"
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
                  placeholder="••••"
                  className="h-10 rounded-lg border-slate-200 text-xs"
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-500">{t("status_field")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as "Active" | "Inactive" })}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">{t("active_status")}</SelectItem>
                    <SelectItem value="Inactive">{t("inactive_status")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-4 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isCadreSaving}
                className="rounded-lg h-10"
              >
                {t("cancel_btn")}
              </Button>
              <Button
                type="submit"
                disabled={isCadreSaving}
                className="rounded-lg h-10 px-5 font-bold shadow-md"
              >
                {isCadreSaving ? "Saving..." : t("save_btn")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
