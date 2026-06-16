import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useT } from "./router-D5xsBJge.mjs";
import { a as useProfile, h as highestRole } from "./use-auth-CD1GunTm.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { ag as ArrowLeft, p as Award, ah as CircleAlert, ai as Lock } from "../_libs/lucide-react.mjs";
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
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
function Row({
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-50 py-3 text-xs last:border-0 gap-1 sm:gap-4 font-bold text-slate-700", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 shrink-0 uppercase tracking-wide", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-extrabold text-slate-800 sm:text-right break-all", children: value })
  ] });
}
function ProfilePage() {
  const {
    t,
    lang
  } = useT();
  const {
    data: profile,
    refetch: refetchProfile
  } = useProfile();
  const role = highestRole(profile?.roles ?? []);
  const [activeTab, setActiveTab] = reactExports.useState("general");
  const [fullName, setFullName] = reactExports.useState(profile?.full_name || "");
  const [phone, setPhone] = reactExports.useState(profile?.phone || "");
  const [updatingProfile, setUpdatingProfile] = reactExports.useState(false);
  const [photoUploading, setPhotoUploading] = reactExports.useState(false);
  const [emergencyName, setEmergencyName] = reactExports.useState(profile?.emergency_contact_name || "");
  const [emergencyPhone, setEmergencyPhone] = reactExports.useState(profile?.emergency_contact_phone || "");
  const [updatingEmergency, setUpdatingEmergency] = reactExports.useState(false);
  const [newPin, setNewPin] = reactExports.useState("");
  const [confirmPin, setConfirmPin] = reactExports.useState("");
  const [updatingPin, setUpdatingPin] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setEmergencyName(profile.emergency_contact_name || "");
      setEmergencyPhone(profile.emergency_contact_phone || "");
    }
  }, [profile]);
  const {
    data: block
  } = useQuery({
    queryKey: ["block", profile?.block_id],
    enabled: !!profile?.block_id,
    queryFn: async () => {
      const {
        data
      } = await supabase.from("blocks").select("name").eq("id", profile.block_id).maybeSingle();
      return data;
    }
  });
  if (!profile) return null;
  const handleSaveProfileInfo = async () => {
    if (!fullName.trim()) {
      toast.error(lang === "hi" ? "पूरा नाम खाली नहीं हो सकता" : "Full name cannot be empty");
      return;
    }
    setUpdatingProfile(true);
    try {
      const {
        error
      } = await supabase.from("profiles").update({
        full_name: fullName.trim(),
        phone: phone.trim()
      }).eq("id", profile.id);
      if (error) throw error;
      toast.success(lang === "hi" ? "निजी जानकारी सहेजी गई" : "Profile details saved successfully!");
      refetchProfile();
    } catch (err) {
      toast.error(`Error saving: ${err.message}`);
    } finally {
      setUpdatingProfile(false);
    }
  };
  const handlePhotoUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setPhotoUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${profile.id}_${Date.now()}.${fileExt}`;
      const {
        data: uploadData,
        error: uploadErr
      } = await supabase.storage.from("profile-photos").upload(filePath, file);
      if (uploadErr) throw uploadErr;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
      const {
        error: profileErr
      } = await supabase.from("profiles").update({
        profile_photo_url: publicUrl
      }).eq("id", profile.id);
      if (profileErr) throw profileErr;
      toast.success(lang === "hi" ? "प्रोफ़ाइल फ़ोटो अपडेट की गई" : "Profile photo updated!");
      refetchProfile();
    } catch (err) {
      toast.error(lang === "hi" ? `अपलोड विफल: ${err.message || err}` : `Upload failed: ${err.message || err}`);
    } finally {
      setPhotoUploading(false);
    }
  };
  const handleSaveEmergencyInfo = async () => {
    if (!emergencyName.trim() || !emergencyPhone.trim()) {
      toast.error(lang === "hi" ? "सभी आपातकालीन फ़ील्ड भरें" : "Please fill all emergency fields");
      return;
    }
    setUpdatingEmergency(true);
    try {
      const {
        error
      } = await supabase.from("profiles").update({
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_phone: emergencyPhone.trim()
      }).eq("id", profile.id);
      if (error) throw error;
      toast.success(lang === "hi" ? "आपातकालीन संपर्क जानकारी सहेजी गई" : "Emergency contact details saved!");
      refetchProfile();
    } catch (err) {
      toast.error(`Error saving: ${err.message}`);
    } finally {
      setUpdatingEmergency(false);
    }
  };
  const handleChangePin = async () => {
    if (!/^[0-9]{4}$/.test(newPin)) {
      toast.error(lang === "hi" ? "पिन 4 अंकों का होना चाहिए" : "PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error(lang === "hi" ? "पिन मेल नहीं खाते" : "PINs do not match");
      return;
    }
    setUpdatingPin(true);
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password: `NRLM-${newPin}`
      });
      if (error) throw error;
      toast.success(lang === "hi" ? "लॉगिन पिन सफलतापूर्वक बदला गया" : "Login PIN changed successfully!");
      setNewPin("");
      setConfirmPin("");
    } catch (err) {
      toast.error(`Error updating PIN: ${err.message}`);
    } finally {
      setUpdatingPin(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 max-w-3xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cadre", className: "inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
      t("back")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black text-slate-800 tracking-tight", children: t("profile_title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: "Manage your personal details, emergency contact, and login PIN" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto -mx-1 px-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm gap-1 text-xs min-w-max", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActiveTab("general"), className: `rounded-lg px-3 py-2 font-bold transition-all whitespace-nowrap ${activeTab === "general" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50/50"}`, children: t("tab_general") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActiveTab("emergency"), className: `rounded-lg px-3 py-2 font-bold transition-all whitespace-nowrap ${activeTab === "emergency" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50/50"}`, children: t("tab_emergency") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActiveTab("security"), className: `rounded-lg px-3 py-2 font-bold transition-all whitespace-nowrap ${activeTab === "security" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50/50"}`, children: t("tab_security") })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm", children: [
      activeTab === "general" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3 pb-5 border-b border-slate-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative group flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-2xl shadow-md overflow-hidden", children: profile.profile_photo_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: profile.profile_photo_url, alt: "Avatar", className: "h-full w-full object-cover" }) : profile.full_name[0].toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-black text-blue-600 hover:text-blue-700 cursor-pointer select-none transition-colors border border-blue-100 hover:bg-blue-50/50 px-3.5 py-1.5 rounded-lg", children: [
            photoUploading ? t("uploading_photo") : t("change_photo"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: handlePhotoUpload, disabled: photoUploading })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black text-slate-800 border-b border-slate-50 pb-2", children: t("personal_details") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5 text-xs font-bold text-slate-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 uppercase text-[10px]", children: t("full_name_label") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: fullName, onChange: (e) => setFullName(e.target.value), className: "h-10 text-xs rounded-lg border-slate-200" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5 text-xs font-bold text-slate-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 uppercase text-[10px]", children: t("mobile_number") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: phone, onChange: (e) => setPhone(e.target.value), className: "h-10 text-xs rounded-lg border-slate-200" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end pt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSaveProfileInfo, disabled: updatingProfile, className: "h-10 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold", children: updatingProfile ? t("saving") : t("save_profile") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 mt-6 pt-4 border-t border-slate-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black text-slate-400 uppercase tracking-wider mb-2", children: t("official_details") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: t("user_id"), value: profile.user_id }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: t("role"), value: role ? t(`role.${role}`) : "—" }),
            profile.cadre_type && /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: t("cadre_type"), value: t(`ct.${profile.cadre_type}`) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: t("block"), value: block?.name ?? "—" })
          ] })
        ] })
      ] }),
      activeTab === "emergency" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 text-xs font-bold text-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "h-5.5 w-5.5 text-blue-600 shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-blue-900 font-extrabold uppercase text-[10px] tracking-wider", children: t("training_status_label") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-600 leading-normal", children: [
              t("current_status"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-900 font-black", children: profile.training_status || "Not Started" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold uppercase leading-none mt-1", children: "Updates automatically from Block Admin records" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-black text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4.5 w-4.5 text-slate-400" }),
            t("emergency_contact")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 uppercase text-[10px]", children: t("contact_name") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: emergencyName, onChange: (e) => setEmergencyName(e.target.value), placeholder: "e.g. Ramesh Kumar", className: "h-10 text-xs rounded-lg border-slate-200" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 uppercase text-[10px]", children: t("contact_phone") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: emergencyPhone, onChange: (e) => setEmergencyPhone(e.target.value), placeholder: "e.g. 9876543210", className: "h-10 text-xs rounded-lg border-slate-200" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSaveEmergencyInfo, disabled: updatingEmergency, className: "h-10 rounded-lg bg-slate-900 text-white hover:bg-slate-800", children: updatingEmergency ? t("saving") : t("save_emergency") }) })
        ] })
      ] }),
      activeTab === "security" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 text-xs font-bold text-slate-700 max-w-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-black text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-4.5 w-4.5 text-slate-400" }),
          t("change_pin_title")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 leading-normal", children: "For secure, fast login in rural setups, you can change your 4-digit PIN password." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 uppercase text-[10px]", children: t("new_pin") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", maxLength: 4, value: newPin, onChange: (e) => setNewPin(e.target.value.replace(/\D/g, "")), placeholder: "4 Digits Only", className: "h-10 text-xs rounded-lg border-slate-200" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-400 uppercase text-[10px]", children: t("confirm_pin") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", maxLength: 4, value: confirmPin, onChange: (e) => setConfirmPin(e.target.value.replace(/\D/g, "")), placeholder: "Confirm 4 Digits", className: "h-10 text-xs rounded-lg border-slate-200" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleChangePin, disabled: updatingPin, className: "h-10 rounded-lg bg-slate-900 text-white hover:bg-slate-800", children: updatingPin ? t("updating") : t("update_pin") }) })
      ] })
    ] })
  ] });
}
export {
  ProfilePage as component
};
