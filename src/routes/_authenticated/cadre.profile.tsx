import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User, Phone, MapPin, Calendar, Lock, AlertCircle, Award } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useProfile, highestRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cadre/profile")({
  component: ProfilePage,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-50 py-3 text-xs last:border-0 gap-1 sm:gap-4 font-bold text-slate-700">
      <span className="text-slate-400 shrink-0 uppercase tracking-wide">{label}</span>
      <span className="font-extrabold text-slate-800 sm:text-right break-all">{value}</span>
    </div>
  );
}

function ProfilePage() {
  const { t, lang } = useT();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const role = highestRole(profile?.roles ?? []);

  const [activeTab, setActiveTab] = useState<"general" | "emergency" | "security">("general");

  // Profile Info States
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Profile Photo State
  const [photoUploading, setPhotoUploading] = useState(false);

  // Emergency Contact Info States
  const [emergencyName, setEmergencyName] = useState(profile?.emergency_contact_name || "");
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergency_contact_phone || "");
  const [updatingEmergency, setUpdatingEmergency] = useState(false);

  // Security pin states
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [updatingPin, setUpdatingPin] = useState(false);

  // Sync profile state when loaded
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setEmergencyName(profile.emergency_contact_name || "");
      setEmergencyPhone(profile.emergency_contact_phone || "");
    }
  }, [profile]);

  const { data: block } = useQuery({
    queryKey: ["block", profile?.block_id],
    enabled: !!profile?.block_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("blocks")
        .select("name")
        .eq("id", profile!.block_id!)
        .maybeSingle();
      return data;
    },
  });

  if (!profile) return null;

  const handleSaveProfileInfo = async () => {
    if (!fullName.trim()) {
      toast.error(lang === "hi" ? "पूरा नाम खाली नहीं हो सकता" : "Full name cannot be empty");
      return;
    }
    setUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
        })
        .eq("id", profile.id);
      if (error) throw error;
      toast.success(lang === "hi" ? "निजी जानकारी सहेजी गई" : "Profile details saved successfully!");
      refetchProfile();
    } catch (err: any) {
      toast.error(`Error saving: ${err.message}`);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setPhotoUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${profile.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file);
      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-photos").getPublicUrl(filePath);

      // Save to profile
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ profile_photo_url: publicUrl })
        .eq("id", profile.id);
      if (profileErr) throw profileErr;

      toast.success(lang === "hi" ? "प्रोफ़ाइल फ़ोटो अपडेट की गई" : "Profile photo updated!");
      refetchProfile();
    } catch (err: any) {
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
      const { error } = await supabase
        .from("profiles")
        .update({
          emergency_contact_name: emergencyName.trim(),
          emergency_contact_phone: emergencyPhone.trim(),
        })
        .eq("id", profile.id);
      if (error) throw error;
      toast.success(lang === "hi" ? "आपातकालीन संपर्क जानकारी सहेजी गई" : "Emergency contact details saved!");
      refetchProfile();
    } catch (err: any) {
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
      const { error } = await supabase.auth.updateUser({
        password: `NRLM-${newPin}`,
      });
      if (error) throw error;
      toast.success(lang === "hi" ? "लॉगिन पिन सफलतापूर्वक बदला गया" : "Login PIN changed successfully!");
      setNewPin("");
      setConfirmPin("");
    } catch (err: any) {
      toast.error(`Error updating PIN: ${err.message}`);
    } finally {
      setUpdatingPin(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back button */}
      <Link
        to="/cadre"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {t("profile_title")}
        </h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
          Manage your personal details, emergency contact, and login PIN
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm gap-1 text-xs min-w-max">
          <button
            onClick={() => setActiveTab("general")}
            className={`rounded-lg px-3 py-2 font-bold transition-all whitespace-nowrap ${
              activeTab === "general"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            {t("tab_general")}
          </button>
          <button
            onClick={() => setActiveTab("emergency")}
            className={`rounded-lg px-3 py-2 font-bold transition-all whitespace-nowrap ${
              activeTab === "emergency"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            {t("tab_emergency")}
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`rounded-lg px-3 py-2 font-bold transition-all whitespace-nowrap ${
              activeTab === "security"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            {t("tab_security")}
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        {activeTab === "general" && (
          <div className="space-y-6">
            {/* Avatar Upload Container */}
            <div className="flex flex-col items-center gap-3 pb-5 border-b border-slate-50">
              <div className="relative group flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-2xl shadow-md overflow-hidden">
                {profile.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  profile.full_name[0].toUpperCase()
                )}
              </div>
              <label className="text-xs font-black text-blue-600 hover:text-blue-700 cursor-pointer select-none transition-colors border border-blue-100 hover:bg-blue-50/50 px-3.5 py-1.5 rounded-lg">
                {photoUploading ? t("uploading_photo") : t("change_photo")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={photoUploading}
                />
              </label>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-black text-slate-800 border-b border-slate-50 pb-2">
                {t("personal_details")}
              </h3>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
                  <Label className="text-slate-400 uppercase text-[10px]">{t("full_name_label")}</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 text-xs rounded-lg border-slate-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
                  <Label className="text-slate-400 uppercase text-[10px]">{t("mobile_number")}</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 text-xs rounded-lg border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  onClick={handleSaveProfileInfo}
                  disabled={updatingProfile}
                  className="h-10 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold"
                >
                  {updatingProfile ? t("saving") : t("save_profile")}
                </Button>
              </div>

              <div className="space-y-1 mt-6 pt-4 border-t border-slate-50">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">{t("official_details")}</h3>
                <Row label={t("user_id")} value={profile.user_id} />
                <Row label={t("role")} value={role ? t(`role.${role}`) : "—"} />
                {profile.cadre_type && (
                  <Row label={t("cadre_type")} value={t(`ct.${profile.cadre_type}`)} />
                )}
                <Row label={t("block")} value={block?.name ?? "—"} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "emergency" && (
          <div className="space-y-6 text-xs font-bold text-slate-700">
            {/* Training block */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
              <Award className="h-5.5 w-5.5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-blue-900 font-extrabold uppercase text-[10px] tracking-wider">
                  {t("training_status_label")}
                </h4>
                <p className="text-slate-600 leading-normal">
                  {t("current_status")} <span className="text-slate-900 font-black">{profile.training_status || "Not Started"}</span>
                </p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none mt-1">
                  Updates automatically from Block Admin records
                </p>
              </div>
            </div>

            {/* Emergency Contact Block */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-black text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                <AlertCircle className="h-4.5 w-4.5 text-slate-400" />
                {t("emergency_contact")}
              </h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-slate-400 uppercase text-[10px]">{t("contact_name")}</Label>
                  <Input
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="h-10 text-xs rounded-lg border-slate-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-slate-400 uppercase text-[10px]">{t("contact_phone")}</Label>
                  <Input
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="h-10 text-xs rounded-lg border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveEmergencyInfo}
                  disabled={updatingEmergency}
                  className="h-10 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                >
                  {updatingEmergency ? t("saving") : t("save_emergency")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-5 text-xs font-bold text-slate-700 max-w-md">
            <h3 className="text-sm font-black text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-1.5">
              <Lock className="h-4.5 w-4.5 text-slate-400" />
              {t("change_pin_title")}
            </h3>
            <p className="text-slate-400 leading-normal">
              For secure, fast login in rural setups, you can change your 4-digit PIN password.
            </p>

            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-400 uppercase text-[10px]">{t("new_pin")}</Label>
              <Input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="4 Digits Only"
                className="h-10 text-xs rounded-lg border-slate-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-400 uppercase text-[10px]">{t("confirm_pin")}</Label>
              <Input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Confirm 4 Digits"
                className="h-10 text-xs rounded-lg border-slate-200"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleChangePin}
                disabled={updatingPin}
                className="h-10 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                {updatingPin ? t("updating") : t("update_pin")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
