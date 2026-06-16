import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { T as Textarea } from "./textarea-DSyJ1nlY.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as useT } from "./router-D5xsBJge.mjs";
import { a as useProfile } from "./use-auth-CD1GunTm.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { ag as ArrowLeft, a2 as WifiOff, ab as Wifi, ac as RefreshCw, M as MapPin, K as Camera, Z as Trash2, a0 as FileText } from "../_libs/lucide-react.mjs";
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
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tailwind-merge.mjs";
const ACTIVITY_TYPES_11 = ["SHG Meeting", "VO Meeting", "Training", "Farmer Visit", "Livelihood Demo", "Bank Linkage", "Monitoring Visit", "Record Verification", "Community Mobilization", "Enterprise Promotion", "Other"];
const ACTIVITY_MAP = {
  "SHG Meeting": "SHG_Meeting",
  "VO Meeting": "Other",
  Training: "Training_Session",
  "Farmer Visit": "Farmer_Visit",
  "Livelihood Demo": "Livelihood_Activity",
  "Bank Linkage": "Other",
  "Monitoring Visit": "Monitoring_Visit",
  "Record Verification": "Record_Verification",
  "Community Mobilization": "Other",
  "Enterprise Promotion": "Livelihood_Activity",
  Other: "Other"
};
const readAscii = (view, offset, length) => {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    const code = view.getUint8(offset + i);
    if (code !== 0) value += String.fromCharCode(code);
  }
  return value;
};
const getTagValueOffset = (view, entryOffset, componentCount, typeSize, tiffOffset, littleEndian) => {
  const valueOffset = entryOffset + 8;
  if (componentCount * typeSize <= 4) return valueOffset;
  return tiffOffset + view.getUint32(valueOffset, littleEndian);
};
const readRational = (view, offset, littleEndian) => {
  const numerator = view.getUint32(offset, littleEndian);
  const denominator = view.getUint32(offset + 4, littleEndian);
  return denominator ? numerator / denominator : 0;
};
const parseExifGps = async (file) => {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 65496) return null;
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 255) break;
    const marker = view.getUint8(offset + 1);
    const segmentLength = view.getUint16(offset + 2, false);
    const segmentStart = offset + 4;
    if (marker === 225 && readAscii(view, segmentStart, 6) === "Exif") {
      const tiffOffset = segmentStart + 6;
      const endian = readAscii(view, tiffOffset, 2);
      const littleEndian = endian === "II";
      if (!littleEndian && endian !== "MM") return null;
      const firstIfdOffset = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
      const entries = view.getUint16(firstIfdOffset, littleEndian);
      let gpsIfdOffset = 0;
      for (let i = 0; i < entries; i += 1) {
        const entryOffset = firstIfdOffset + 2 + i * 12;
        const tag = view.getUint16(entryOffset, littleEndian);
        if (tag === 34853) {
          gpsIfdOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
          break;
        }
      }
      if (!gpsIfdOffset) return null;
      const gpsEntries = view.getUint16(gpsIfdOffset, littleEndian);
      let latRef = "";
      let lngRef = "";
      let latValues = null;
      let lngValues = null;
      for (let i = 0; i < gpsEntries; i += 1) {
        const entryOffset = gpsIfdOffset + 2 + i * 12;
        const tag = view.getUint16(entryOffset, littleEndian);
        const type = view.getUint16(entryOffset + 2, littleEndian);
        const count = view.getUint32(entryOffset + 4, littleEndian);
        if ((tag === 1 || tag === 3) && type === 2) {
          const valueOffset = getTagValueOffset(view, entryOffset, count, 1, tiffOffset, littleEndian);
          const ref = readAscii(view, valueOffset, count).trim();
          if (tag === 1) latRef = ref;
          if (tag === 3) lngRef = ref;
        }
        if ((tag === 2 || tag === 4) && type === 5 && count >= 3) {
          const valueOffset = getTagValueOffset(view, entryOffset, count, 8, tiffOffset, littleEndian);
          const values = [0, 1, 2].map((idx) => readRational(view, valueOffset + idx * 8, littleEndian));
          if (tag === 2) latValues = values;
          if (tag === 4) lngValues = values;
        }
      }
      if (!latRef || !lngRef || !latValues || !lngValues) return null;
      const latitude = (latValues[0] + latValues[1] / 60 + latValues[2] / 3600) * (latRef.toUpperCase() === "S" ? -1 : 1);
      const longitude = (lngValues[0] + lngValues[1] / 60 + lngValues[2] / 3600) * (lngRef.toUpperCase() === "W" ? -1 : 1);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return {
        latitude,
        longitude
      };
    }
    offset += 2 + segmentLength;
  }
  return null;
};
const hasGpsMapCameraStamp = async (file) => {
  if (!file.type.startsWith("image/") || typeof document === "undefined" || !("createImageBitmap" in window)) {
    return false;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const sampleWidth = 480;
    const sampleHeight = Math.max(1, Math.round(bitmap.height / bitmap.width * sampleWidth));
    const canvas = document.createElement("canvas");
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true
    });
    if (!ctx) return false;
    ctx.drawImage(bitmap, 0, 0, sampleWidth, sampleHeight);
    bitmap.close();
    const yStart = Math.floor(sampleHeight * 0.66);
    const imageData = ctx.getImageData(0, yStart, sampleWidth, sampleHeight - yStart).data;
    let darkPixels = 0;
    let brightPixels = 0;
    let highContrastEdges = 0;
    let previousLuma = 0;
    const totalPixels = imageData.length / 4;
    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (luma < 75) darkPixels += 1;
      if (luma > 185) brightPixels += 1;
      if (i > 0 && Math.abs(luma - previousLuma) > 95) highContrastEdges += 1;
      previousLuma = luma;
    }
    const darkRatio = darkPixels / totalPixels;
    const brightRatio = brightPixels / totalPixels;
    const edgeRatio = highContrastEdges / totalPixels;
    return darkRatio > 0.28 && brightRatio > 0.045 && edgeRatio > 0.025;
  } catch {
    return false;
  }
};
function SubmitPage() {
  const {
    t
  } = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const {
    data: profile,
    isLoading: profileLoading
  } = useProfile();
  const [actDate, setActDate] = reactExports.useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [district, setDistrict] = reactExports.useState("Dantewada");
  const [blockId, setBlockId] = reactExports.useState(profile?.block_id ?? "");
  const [panchayat, setPanchayat] = reactExports.useState("");
  const [village, setVillage] = reactExports.useState("");
  const [actType, setActType] = reactExports.useState("");
  const [desc, setDesc] = reactExports.useState("");
  const [beneficiaryCount, setBeneficiaryCount] = reactExports.useState(0);
  const [gpsLocation, setGpsLocation] = reactExports.useState(null);
  const [gpsStatus, setGpsStatus] = reactExports.useState("pending");
  const [autoAttendance, setAutoAttendance] = reactExports.useState(true);
  const [photos, setPhotos] = reactExports.useState([]);
  const [photoPreviews, setPhotoPreviews] = reactExports.useState([]);
  const [photoGpsTags, setPhotoGpsTags] = reactExports.useState([]);
  const [pdfDoc, setPdfDoc] = reactExports.useState(null);
  const [isOffline, setIsOffline] = reactExports.useState(false);
  const [drafts, setDrafts] = reactExports.useState([]);
  const [busy, setBusy] = reactExports.useState(false);
  const {
    data: blocks
  } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("blocks").select("id,name").order("name");
      if (error) throw error;
      return data;
    }
  });
  reactExports.useEffect(() => {
    if (profile?.block_id) {
      setBlockId(profile.block_id);
    }
  }, [profile]);
  reactExports.useEffect(() => {
    if (!profile?.block_id && blocks && blocks.length > 0 && !blockId) {
      setBlockId(blocks[0].id);
    }
  }, [blocks, profile, blockId]);
  reactExports.useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      setGpsLocation(`${pos.coords.latitude.toFixed(6)}° N, ${pos.coords.longitude.toFixed(6)}° E (Accuracy: ${pos.coords.accuracy.toFixed(1)}m)`);
      setGpsStatus("granted");
    }, (err) => {
      console.warn("GPS access denied or error:", err.message);
      setGpsLocation(null);
      setGpsStatus("denied");
    }, {
      timeout: 1e4,
      maximumAge: 6e4
    });
  }, []);
  reactExports.useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedDrafts = localStorage.getItem("nrlm_activities_drafts");
      if (cachedDrafts) {
        setDrafts(JSON.parse(cachedDrafts));
      }
    }
  }, []);
  const saveDraftsToLocalStorage = (newDrafts) => {
    setDrafts(newDrafts);
    if (typeof window !== "undefined") {
      localStorage.setItem("nrlm_activities_drafts", JSON.stringify(newDrafts));
    }
  };
  const handlePhotoUpload = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      if (photos.length + filesArray.length > 10) {
        toast.error("अधिकतम 10 फोटो की अनुमति है / Maximum 10 photos allowed");
        e.target.value = "";
        return;
      }
      const checkedPhotos = await Promise.all(filesArray.map(async (file) => {
        const gps = await parseExifGps(file);
        const proof = gps ?? (await hasGpsMapCameraStamp(file) ? {
          kind: "visual_stamp"
        } : null);
        return {
          file,
          proof
        };
      }));
      const validGpsTags = checkedPhotos.map(({
        proof
      }) => proof);
      setPhotos((prev) => [...prev, ...filesArray]);
      setPhotoGpsTags((prev) => [...prev, ...validGpsTags]);
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
      const gpsCount = checkedPhotos.filter(({
        proof
      }) => proof).length;
      if (gpsCount === filesArray.length) {
        toast.success(`${filesArray.length} GPS-tagged photo(s) added.`);
      } else {
        toast.success(`${filesArray.length} photo(s) added (${gpsCount} with GPS tag).`);
      }
      e.target.value = "";
    }
  };
  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
    setPhotoGpsTags((prev) => prev.filter((_, i) => i !== idx));
  };
  const handlePdfUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("दस्तावेज़ आकार 10MB से कम होना चाहिए / PDF size must be < 10MB");
        return;
      }
      setPdfDoc(file);
      toast.success("दस्तावेज़ संलग्न किया गया / PDF attached successfully");
    }
  };
  const uploadFile = async (bucket, file, userId) => {
    const fileExt = file.name.split(".").pop() ?? "jpg";
    const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const {
      error
    } = await supabase.storage.from(bucket).upload(filePath, file);
    if (error) throw error;
    const {
      data: {
        publicUrl
      }
    } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicUrl;
  };
  async function handleSubmitForm(status) {
    console.log("Submit button clicked");
    if (!profile) {
      toast.error("प्रोफाइल लोड नहीं हुई, कृपया पुनः प्रयास करें / Profile not loaded, please try again.");
      return;
    }
    console.log("Profile loaded:", profile.id);
    if (!blockId || !village.trim() || !panchayat.trim() || !actType) {
      console.warn("Form validation failed — missing fields:", {
        blockId,
        village,
        panchayat,
        actType
      });
      toast.error("सभी आवश्यक फ़ील्ड भरें / Please fill all required fields");
      return;
    }
    if (beneficiaryCount < 0 || beneficiaryCount >= 1e3) {
      console.warn("Form validation failed — beneficiary count:", beneficiaryCount);
      toast.error("लाभार्थी संख्या मान्य नहीं है / Beneficiary count must be positive and < 1000");
      return;
    }
    console.log("Form validation passed");
    const payload = {
      id: `draft-${Date.now()}`,
      cadre_id: profile.id,
      cadre_name: profile.full_name,
      role: profile.cadre_type ?? "PRP",
      activity_date: actDate,
      block_id: blockId,
      block_name: blocks?.find((b) => b.id === blockId)?.name ?? "",
      panchayat: panchayat.trim(),
      village_name: village.trim(),
      activity_type: ACTIVITY_MAP[actType] ?? "Other",
      activity_type_label: actType,
      description: desc.trim() || null,
      beneficiaries: beneficiaryCount,
      gps: gpsLocation,
      status,
      submitted_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (isOffline || status === "Draft") {
      const updated = [payload, ...drafts];
      saveDraftsToLocalStorage(updated);
      toast.warning("ड्राफ्ट के रूप में सहेजा गया / Saved as Draft locally");
      navigate({
        to: "/cadre/history"
      });
      return;
    }
    setBusy(true);
    try {
      console.log("[Submit] Starting. profile.id =", profile.id, "blockId =", blockId);
      console.log("Starting photo upload");
      let photoUrl = null;
      if (photos.length > 0) {
        try {
          photoUrl = await uploadFile("activity-photos", photos[0], profile.id);
          console.log("[Submit] Photo uploaded:", photoUrl);
          console.log("Photo upload completed");
        } catch (uploadErr) {
          console.warn("[Submit] Photo upload failed (non-fatal):", uploadErr);
          toast.warning("फोटो अपलोड नहीं हुई, लेकिन गतिविधि सहेजी जाएगी / Photo upload failed, but activity will be saved.");
          photoUrl = null;
        }
      }
      let pdfUrl = null;
      if (pdfDoc) {
        try {
          pdfUrl = await uploadFile("activity-photos", pdfDoc, profile.id);
          console.log("[Submit] PDF uploaded:", pdfUrl);
        } catch (uploadErr) {
          console.warn("[Submit] PDF upload failed (non-fatal):", uploadErr);
          pdfUrl = null;
        }
      }
      console.log("Starting duplicate check");
      console.log("[Submit] Checking for duplicates...");
      const {
        data: duplicateAct,
        error: dupError
      } = await supabase.from("activities").select("id").eq("cadre_id", profile.id).eq("activity_date", actDate).eq("activity_type", ACTIVITY_MAP[actType] ?? "Other").eq("village_name", village.trim()).maybeSingle();
      if (dupError) {
        console.error("[Submit] Duplicate check error:", dupError);
        throw dupError;
      }
      console.log("Duplicate check completed");
      if (duplicateAct) {
        toast.error("यह गतिविधि पहले से सबमिट की जा चुकी है! / This activity has already been submitted for this date!");
        setBusy(false);
        return;
      }
      const insertPayload = {
        cadre_id: profile.id,
        activity_date: actDate,
        block_id: blockId,
        village_name: village.trim(),
        panchayat: panchayat.trim(),
        beneficiaries: beneficiaryCount,
        gps: gpsLocation,
        activity_type: ACTIVITY_MAP[actType] ?? "Other",
        description: desc.trim() || null,
        photo_url: photoUrl,
        pdf_url: pdfUrl,
        status: "Pending"
      };
      console.log("[Submit] Inserting activity:", insertPayload);
      console.log("Starting activity insert");
      const {
        error: insertError
      } = await supabase.from("activities").insert(insertPayload);
      if (insertError) {
        console.error("[Submit] Insert error:", insertError);
        throw insertError;
      }
      console.log("[Submit] Activity inserted successfully.");
      console.log("Activity insert completed");
      if (autoAttendance && photoUrl) {
        try {
          const {
            data: existingAttendance
          } = await supabase.from("attendance").select("id, status").eq("cadre_id", profile.id).eq("date", actDate).maybeSingle();
          if (existingAttendance) {
            if (existingAttendance.status !== "present") {
              await supabase.from("attendance").update({
                status: "present",
                check_in_at: (/* @__PURE__ */ new Date()).toISOString(),
                recorded_by: profile.id
              }).eq("id", existingAttendance.id);
            }
          } else {
            await supabase.from("attendance").insert({
              cadre_id: profile.id,
              block_id: blockId,
              date: actDate,
              status: "present",
              check_in_at: (/* @__PURE__ */ new Date()).toISOString(),
              recorded_by: profile.id
            });
          }
          toast.success("उपस्थिति स्वतः दर्ज की गई (उपस्थित) / Attendance auto-marked Present");
          console.log("Attendance insert completed");
        } catch (attErr) {
          console.warn("[Submit] Attendance marking failed (non-fatal):", attErr);
        }
      } else if (autoAttendance && !photoUrl) {
        toast.info("फोटो के बिना सबमिट किया गया — उपस्थिति मार्क नहीं की गई / Submitted without photo — attendance not marked");
      }
      await qc.invalidateQueries({
        queryKey: ["my-activities"]
      });
      toast.success(t("submission_success"));
      navigate({
        to: "/cadre/history"
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("[Submit] Fatal error:", err);
      toast.error(`${t("submission_error")}: ${msg}`);
    } finally {
      setBusy(false);
    }
  }
  const handleSyncDrafts = async () => {
    if (drafts.length === 0) return;
    setBusy(true);
    try {
      for (const draft of drafts) {
        if (!draft.gps) {
          toast.warning(`ड्राफ्ट "${draft.activity_type_label || draft.activity_type}" के लिए GPS उपलब्ध नहीं था — छोड़ा गया। / Draft skipped: no GPS coordinates.`);
          continue;
        }
        const {
          error: actErr
        } = await supabase.from("activities").insert({
          cadre_id: draft.cadre_id,
          activity_date: draft.activity_date,
          block_id: draft.block_id,
          village_name: draft.village_name,
          panchayat: draft.panchayat,
          beneficiaries: draft.beneficiaries,
          gps: draft.gps,
          activity_type: draft.activity_type,
          description: draft.description,
          status: draft.status || "Pending"
        });
        if (actErr) throw actErr;
        if (draft.photo_url) {
          const {
            data: existingAttendance
          } = await supabase.from("attendance").select("id, status").eq("cadre_id", draft.cadre_id).eq("date", draft.activity_date).maybeSingle();
          if (existingAttendance) {
            if (existingAttendance.status !== "present") {
              await supabase.from("attendance").update({
                status: "present",
                check_in_at: (/* @__PURE__ */ new Date()).toISOString(),
                recorded_by: draft.cadre_id
              }).eq("id", existingAttendance.id);
            }
          } else {
            await supabase.from("attendance").insert({
              cadre_id: draft.cadre_id,
              block_id: draft.block_id,
              date: draft.activity_date,
              status: "present",
              check_in_at: (/* @__PURE__ */ new Date()).toISOString(),
              recorded_by: draft.cadre_id
            });
          }
        }
      }
      saveDraftsToLocalStorage([]);
      await qc.invalidateQueries({
        queryKey: ["my-activities"]
      });
      toast.success("सभी ड्राफ्ट सिंक हो गए और उपस्थिति सत्यापन लंबित है / All offline drafts synced and attendance verification set to pending");
    } catch (e) {
      console.error(e);
      toast.error(`सिंक करने में विफल / Failed to sync offline cache: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cadre", className: "inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
      t("back")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black text-slate-800 tracking-tight", children: t("submit_title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: t("submit_sub") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex h-9 w-9 items-center justify-center rounded-xl", isOffline ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"), children: isOffline ? /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold text-slate-800", children: isOffline ? t("offline_active") : t("online_stable") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold uppercase leading-none mt-1", children: "Allows caching forms in remote locations" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3", children: drafts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSyncDrafts, variant: "outline", className: "h-9 rounded-xl text-xs font-black border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100/50 flex items-center gap-1.5 animate-pulse", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
        t("sync_drafts"),
        " (",
        drafts.length,
        ")"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-black text-slate-800 border-b border-slate-100 pb-3.5 mb-5 uppercase tracking-wide", children: t("form_title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => e.preventDefault(), className: "space-y-5 text-xs font-bold text-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: t("date_label") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), value: actDate, onChange: (e) => setActDate(e.target.value), className: "h-10 text-xs rounded-lg border-slate-200 font-bold" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: t("activity_type_form") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: actType, onValueChange: setActType, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("select_activity_placeholder") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ACTIVITY_TYPES_11.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t2, children: t2 }, t2)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: t("state_label") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: "Chhattisgarh", disabled: true, className: "h-10 text-xs rounded-lg border-slate-200 bg-slate-50" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: t("district_label") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: district, onValueChange: setDistrict, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Dantewada", children: "Dantewada" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: t("block_form") }),
            blocks === void 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 rounded-lg border border-slate-200 bg-slate-50 animate-pulse flex items-center px-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400 font-semibold", children: "Loading blocks..." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: blockId, onValueChange: setBlockId, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 text-xs rounded-lg border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("select_block") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: blocks.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: b.id, children: b.name }, b.id)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: t("panchayat_form") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: panchayat, onChange: (e) => setPanchayat(e.target.value), placeholder: "e.g. Kalnar", className: "h-10 text-xs rounded-lg border-slate-200", required: true })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: t("village_form") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: village, onChange: (e) => setVillage(e.target.value), placeholder: "e.g. Reslapur", className: "h-10 text-xs rounded-lg border-slate-200", required: true })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "महिला लाभार्थी संख्या / Women benefited (Max 1000)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, max: 1e3, value: beneficiaryCount, onChange: (e) => setBeneficiaryCount(Number(e.target.value)), className: "h-10 text-xs rounded-lg border-slate-200" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "GPS Geotag coords (Auto-capture)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: gpsStatus === "pending" ? "GPS लोकेशन प्राप्त की जा रही है... / Acquiring GPS…" : gpsStatus === "denied" ? "GPS अनुमति अस्वीकृत — सबमिशन जारी रह सकता है / GPS denied — submission will proceed" : gpsStatus === "unavailable" ? "GPS उपलब्ध नहीं — सबमिशन जारी रह सकता है / GPS unavailable" : gpsLocation ?? "", disabled: true, className: cn("h-10 text-xs rounded-lg border-slate-200 bg-slate-50 pl-8.5 font-mono text-[10px]", (gpsStatus === "denied" || gpsStatus === "unavailable") && "border-amber-300 bg-amber-50 text-amber-700", gpsStatus === "pending" && "animate-pulse") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: cn("absolute left-2.5 h-4 w-4", gpsStatus === "granted" ? "text-emerald-500" : "text-slate-400", (gpsStatus === "denied" || gpsStatus === "unavailable") && "text-amber-500") })
            ] }),
            (gpsStatus === "denied" || gpsStatus === "unavailable") && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-amber-600 font-semibold mt-0.5", children: "⚠️ GPS उपलब्ध नहीं — आप बिना GPS के भी सबमिट कर सकते हैं। / GPS not available — you can still submit without it." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "विवरण नोट्स / Description Notes (Max 500 characters)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { maxLength: 500, value: desc, onChange: (e) => setDesc(e.target.value), placeholder: "Meeting outcomes, agenda points discussed, recovery stats...", rows: 3, className: "text-xs rounded-lg border-slate-200" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-slate-400 font-semibold text-right -mt-1", children: [
            500 - desc.length,
            " characters remaining"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "साक्ष्य चित्र / Capture Photos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-6 w-6 text-slate-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400 mt-1.5", children: "Snaps (Max 10 pics)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-emerald-600 mt-0.5", children: "GPS geotag recommended" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", multiple: true, accept: "image/*", capture: "environment", onChange: handlePhotoUpload, className: "hidden" })
            ] }),
            photoPreviews.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 mt-1.5", children: photoPreviews.map((src, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group flex h-10 w-10 shrink-0 border rounded overflow-hidden", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, className: "h-full w-full object-cover" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { onClick: () => removePhoto(idx), className: "h-3.5 w-3.5 text-white cursor-pointer" }) })
            ] }, idx)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-500 font-bold", children: "दस्तावेज़ / PDF Attachment (Max 10MB)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-6 w-6 text-slate-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-400 mt-1.5", children: "Upload PDF Minutes" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: ".pdf,.docx", onChange: handlePdfUpload, className: "hidden" })
            ] }),
            pdfDoc && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border bg-slate-50 px-2 py-1 text-[10px] mt-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: pdfDoc.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { onClick: () => setPdfDoc(null), className: "h-3 w-3 text-rose-500 cursor-pointer" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3.5 shadow-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-tight", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-slate-700", children: "उपस्थिति स्वतः दर्ज / Auto-Mark Attendance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-semibold mt-0.5", children: "Toggle auto marking present status on activity report submit" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: autoAttendance, onChange: (e) => setAutoAttendance(e.target.checked), className: "h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2.5 border-t border-slate-100 pt-4 mt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", disabled: busy || profileLoading, onClick: () => handleSubmitForm("Draft"), className: "h-10 rounded-lg text-xs", children: "ड्राफ्ट सहेजें / Save Draft" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", disabled: busy || profileLoading, onClick: () => handleSubmitForm("Pending"), className: "h-10 px-6 rounded-lg text-xs font-black shadow-md", children: profileLoading ? "प्रोफाइल लोड हो रही है... / Loading profile..." : busy ? "सहेज रहा है... / Submitting..." : "सबमिट करें / Submit Report" })
        ] })
      ] })
    ] })
  ] });
}
export {
  SubmitPage as component
};
