import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  ArrowLeft,
  Camera,
  FileText,
  Trash2,
  MapPin,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type ActivityType = Database["public"]["Enums"]["activity_type"];

type PhotoGpsTag = {
  latitude: number;
  longitude: number;
};

type PhotoGpsProof = PhotoGpsTag | { kind: "visual_stamp" };

const MAX_PHOTOS = 10;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];

const formatFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

const isAllowedImageFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return (
    ALLOWED_IMAGE_TYPES.includes(file.type) ||
    ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  );
};

const ACTIVITY_TYPES_11 = [
  "SHG Meeting",
  "VO Meeting",
  "Training",
  "Farmer Visit",
  "Livelihood Demo",
  "Bank Linkage",
  "Monitoring Visit",
  "Record Verification",
  "Community Mobilization",
  "Enterprise Promotion",
  "Other",
];

const ACTIVITY_MAP: Record<string, ActivityType> = {
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
  Other: "Other",
};

const readAscii = (view: DataView, offset: number, length: number) => {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    const code = view.getUint8(offset + i);
    if (code !== 0) value += String.fromCharCode(code);
  }
  return value;
};

const getTagValueOffset = (
  view: DataView,
  entryOffset: number,
  componentCount: number,
  typeSize: number,
  tiffOffset: number,
  littleEndian: boolean,
) => {
  const valueOffset = entryOffset + 8;
  if (componentCount * typeSize <= 4) return valueOffset;
  return tiffOffset + view.getUint32(valueOffset, littleEndian);
};

const readRational = (view: DataView, offset: number, littleEndian: boolean) => {
  const numerator = view.getUint32(offset, littleEndian);
  const denominator = view.getUint32(offset + 4, littleEndian);
  return denominator ? numerator / denominator : 0;
};

const parseExifGps = async (file: File): Promise<PhotoGpsTag | null> => {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;

    const marker = view.getUint8(offset + 1);
    const segmentLength = view.getUint16(offset + 2, false);
    const segmentStart = offset + 4;

    if (marker === 0xe1 && readAscii(view, segmentStart, 6) === "Exif") {
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
        if (tag === 0x8825) {
          gpsIfdOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
          break;
        }
      }

      if (!gpsIfdOffset) return null;

      const gpsEntries = view.getUint16(gpsIfdOffset, littleEndian);
      let latRef = "";
      let lngRef = "";
      let latValues: number[] | null = null;
      let lngValues: number[] | null = null;

      for (let i = 0; i < gpsEntries; i += 1) {
        const entryOffset = gpsIfdOffset + 2 + i * 12;
        const tag = view.getUint16(entryOffset, littleEndian);
        const type = view.getUint16(entryOffset + 2, littleEndian);
        const count = view.getUint32(entryOffset + 4, littleEndian);

        if ((tag === 1 || tag === 3) && type === 2) {
          const valueOffset = getTagValueOffset(
            view,
            entryOffset,
            count,
            1,
            tiffOffset,
            littleEndian,
          );
          const ref = readAscii(view, valueOffset, count).trim();
          if (tag === 1) latRef = ref;
          if (tag === 3) lngRef = ref;
        }

        if ((tag === 2 || tag === 4) && type === 5 && count >= 3) {
          const valueOffset = getTagValueOffset(
            view,
            entryOffset,
            count,
            8,
            tiffOffset,
            littleEndian,
          );
          const values = [0, 1, 2].map((idx) =>
            readRational(view, valueOffset + idx * 8, littleEndian),
          );
          if (tag === 2) latValues = values;
          if (tag === 4) lngValues = values;
        }
      }

      if (!latRef || !lngRef || !latValues || !lngValues) return null;

      const latitude =
        (latValues[0] + latValues[1] / 60 + latValues[2] / 3600) *
        (latRef.toUpperCase() === "S" ? -1 : 1);
      const longitude =
        (lngValues[0] + lngValues[1] / 60 + lngValues[2] / 3600) *
        (lngRef.toUpperCase() === "W" ? -1 : 1);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { latitude, longitude };
    }

    offset += 2 + segmentLength;
  }

  return null;
};

const hasGpsMapCameraStamp = async (file: File): Promise<boolean> => {
  if (
    !file.type.startsWith("image/") ||
    typeof document === "undefined" ||
    !("createImageBitmap" in window)
  ) {
    return false;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const sampleWidth = 480;
    const sampleHeight = Math.max(1, Math.round((bitmap.height / bitmap.width) * sampleWidth));
    const canvas = document.createElement("canvas");
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
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

export const Route = createFileRoute("/_authenticated/cadre/submit")({
  component: SubmitPage,
});

function SubmitPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const [actDate, setActDate] = useState(new Date().toISOString().slice(0, 10));
  const [district, setDistrict] = useState("Dantewada");
  const [blockId, setBlockId] = useState<string>(profile?.block_id ?? "");
  const [panchayat, setPanchayat] = useState("");
  const [village, setVillage] = useState("");
  const [actType, setActType] = useState("");
  const [desc, setDesc] = useState("");
  const [beneficiaryCount, setBeneficiaryCount] = useState(0);
  // null  → GPS not yet attempted or was denied (no fake fallback)
  // ""    → browser has no geolocation API
  // string → real coords captured from device
  const [gpsLocation, setGpsLocation] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"pending" | "granted" | "denied" | "unavailable">("pending");
  const [autoAttendance, setAutoAttendance] = useState(true);

  // Attachments
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoGpsTags, setPhotoGpsTags] = useState<(PhotoGpsProof | null)[]>([]);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const photoPreviewUrlsRef = useRef<string[]>([]);

  // Offline caching simulator
  const [isOffline, setIsOffline] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  // Fetch Blocks from DB
  const { data: blocks } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blocks").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  }); // Synchronize blockId state when profile data loaded asynchronously
  useEffect(() => {
    if (profile?.block_id) {
      setBlockId(profile.block_id);
    }
  }, [profile]);

  // If profile has no block assigned, default to the first available block
  // so the field is not silently empty and the validation doesn't block submission.
  useEffect(() => {
    if (!profile?.block_id && blocks && blocks.length > 0 && !blockId) {
      setBlockId(blocks[0].id);
    }
  }, [blocks, profile, blockId]);

  // Get real GPS location if browser supports it.
  // On denial, set status to "denied" and leave gpsLocation as null
  // so no fake coordinates are ever stored.
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation(
          `${pos.coords.latitude.toFixed(6)}° N, ${pos.coords.longitude.toFixed(6)}° E (Accuracy: ${pos.coords.accuracy.toFixed(1)}m)`,
        );
        setGpsStatus("granted");
      },
      (err) => {
        console.warn("GPS access denied or error:", err.message);
        setGpsLocation(null);
        setGpsStatus("denied");
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // Handle Offline Status local drafts storage loading
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedDrafts = localStorage.getItem("nrlm_activities_drafts");
      if (cachedDrafts) {
        setDrafts(JSON.parse(cachedDrafts));
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      photoPreviewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, []);

  const saveDraftsToLocalStorage = (newDrafts: any[]) => {
    setDrafts(newDrafts);
    if (typeof window !== "undefined") {
      localStorage.setItem("nrlm_activities_drafts", JSON.stringify(newDrafts));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      if (photos.length + filesArray.length > 10) {
        toast.error("अधिकतम 10 फोटो की अनुमति है / Maximum 10 photos allowed");
        e.target.value = "";
        return;
      }

      // Try to extract GPS EXIF or detect stamped photos — but don't block upload
      const checkedPhotos = await Promise.all(
        filesArray.map(async (file) => {
          const gps = await parseExifGps(file);
          const proof: PhotoGpsProof | null =
            gps ??
            ((await hasGpsMapCameraStamp(file)) ? ({ kind: "visual_stamp" } as const) : null);
          return { file, proof };
        }),
      );

      const validGpsTags = checkedPhotos.map(({ proof }) => proof as PhotoGpsProof);
      setPhotos((prev) => [...prev, ...filesArray]);
      setPhotoGpsTags((prev) => [...prev, ...validGpsTags]);

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);

      const gpsCount = checkedPhotos.filter(({ proof }) => proof).length;
      if (gpsCount === filesArray.length) {
        toast.success(`${filesArray.length} GPS-tagged photo(s) added.`);
      } else {
        toast.success(
          `${filesArray.length} photo(s) added (${gpsCount} with GPS tag).`,
        );
      }
      e.target.value = "";
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => {
      const removedPreview = prev[idx];
      if (removedPreview) {
        URL.revokeObjectURL(removedPreview);
        photoPreviewUrlsRef.current = photoPreviewUrlsRef.current.filter((url) => url !== removedPreview);
      }
      return prev.filter((_, i) => i !== idx);
    });
    setPhotoGpsTags((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePhotoSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    setPhotoUploadError(null);

    const invalidFiles = selectedFiles.filter((file) => !isAllowedImageFile(file));
    if (invalidFiles.length > 0) {
      const message = "Only JPG, JPEG, and PNG photos are allowed.";
      setPhotoUploadError(message);
      toast.error(message);
      e.target.value = "";
      return;
    }

    const oversizedFiles = selectedFiles.filter((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      const message = `Each photo must be ${formatFileSize(MAX_IMAGE_SIZE_BYTES)} or smaller.`;
      setPhotoUploadError(message);
      toast.error(message);
      e.target.value = "";
      return;
    }

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      const message = "Maximum 10 photos allowed.";
      setPhotoUploadError(message);
      toast.error(message);
      e.target.value = "";
      return;
    }

    const filesArray = selectedFiles.slice(0, remainingSlots);
    if (selectedFiles.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more photo(s) can be added. Maximum 10 photos allowed.`);
    }

    const checkedPhotos = await Promise.all(
      filesArray.map(async (file) => {
        const gps = await parseExifGps(file);
        const proof: PhotoGpsProof | null =
          gps ?? ((await hasGpsMapCameraStamp(file)) ? ({ kind: "visual_stamp" } as const) : null);
        return { file, proof };
      }),
    );

    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
    photoPreviewUrlsRef.current.push(...newPreviews);
    setPhotos((prev) => [...prev, ...filesArray]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    setPhotoGpsTags((prev) => [...prev, ...checkedPhotos.map(({ proof }) => proof)]);

    const gpsCount = checkedPhotos.filter(({ proof }) => proof).length;
    toast.success(`${filesArray.length} photo(s) added (${gpsCount} with GPS tag).`);
    e.target.value = "";
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const uploadFile = async (bucket: string, file: File, userId: string, activityId?: string) => {
    const fileExt = file.name.split(".").pop() ?? "jpg";
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || `photo.${fileExt}`;
    const filePath = `${userId}/${activityId ? `${activityId}/` : ""}${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeFileName}`;
    const { error } = await supabase.storage.from(bucket).upload(filePath, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { publicUrl, storagePath: filePath };
  };

  const uploadActivityPhotos = async (activityId: string, userId: string) => {
    const uploadedPhotos = [];

    for (const [idx, file] of photos.entries()) {
      const { publicUrl, storagePath } = await uploadFile("activity-photos", file, userId, activityId);
      const gpsProof = photoGpsTags[idx];
      const gps = gpsProof && "latitude" in gpsProof ? gpsProof : null;
      uploadedPhotos.push({ publicUrl, storagePath, file, gps });
    }

    if (uploadedPhotos.length > 0) {
      const { error } = await supabase.from("evidence_files").insert(
        uploadedPhotos.map(({ publicUrl, storagePath, file, gps }) => ({
          activity_id: activityId,
          cadre_id: userId,
          storage_path: storagePath,
          public_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || null,
          latitude: gps?.latitude ?? null,
          longitude: gps?.longitude ?? null,
        })),
      );
      if (error) throw error;
    }

    return uploadedPhotos.map((photo) => photo.publicUrl);
  };

  async function handleSubmitForm(status: "Pending" | "Draft") {
    console.log("Submit button clicked");
    if (!profile) {
      toast.error("प्रोफाइल लोड नहीं हुई, कृपया पुनः प्रयास करें / Profile not loaded, please try again.");
      return;
    }
    console.log("Profile loaded:", profile.id);
    if (!blockId || !village.trim() || !panchayat.trim() || !actType) {
      console.warn("Form validation failed — missing fields:", { blockId, village, panchayat, actType });
      toast.error("सभी आवश्यक फ़ील्ड भरें / Please fill all required fields");
      return;
    }
    if (beneficiaryCount < 0 || beneficiaryCount >= 1000) {
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
      status: status,
      submitted_at: new Date().toISOString(),
    };

    if (isOffline || status === "Draft") {
      const updated = [payload, ...drafts];
      saveDraftsToLocalStorage(updated);
      toast.warning("ड्राफ्ट के रूप में सहेजा गया / Saved as Draft locally");
      navigate({ to: "/cadre/history" });
      return;
    }

    setBusy(true);
    try {
      console.log("[Submit] Starting. profile.id =", profile.id, "blockId =", blockId);
      console.log("Starting photo upload");

      // 1. Upload photos — non-blocking: if bucket missing or policy fails,
      //    log the warning but continue with the activity insert.
      let photoUrl: string | null = null;
      if (false && photos.length > 0) {
        try {
          photoUrl = (await uploadFile("activity-photos", photos[0], profile.id)).publicUrl;
          console.log("[Submit] Photo uploaded:", photoUrl);
          console.log("Photo upload completed");
        } catch (uploadErr) {
          console.warn("[Submit] Photo upload failed (non-fatal):", uploadErr);
          toast.warning("फोटो अपलोड नहीं हुई, लेकिन गतिविधि सहेजी जाएगी / Photo upload failed, but activity will be saved.");
          photoUrl = null;
        }
      }

      // 2. Upload PDF — non-blocking
      let pdfUrl: string | null = null;
      if (pdfDoc) {
        try {
          pdfUrl = (await uploadFile("activity-photos", pdfDoc, profile.id)).publicUrl;
          console.log("[Submit] PDF uploaded:", pdfUrl);
        } catch (uploadErr) {
          console.warn("[Submit] PDF upload failed (non-fatal):", uploadErr);
          pdfUrl = null;
        }
      }

      // 3. Duplicate activity check
      console.log("Starting duplicate check");
      console.log("[Submit] Checking for duplicates...");
      const { data: duplicateAct, error: dupError } = await supabase
        .from("activities")
        .select("id")
        .eq("cadre_id", profile.id)
        .eq("activity_date", actDate)
        .eq("activity_type", ACTIVITY_MAP[actType] ?? "Other")
        .eq("village_name", village.trim())
        .maybeSingle();

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

      // 4. Insert into activities table
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
        status: "Pending",
      };
      console.log("[Submit] Inserting activity:", insertPayload);
      console.log("Starting activity insert");

      const { data: insertedActivity, error: insertError } = await supabase
        .from("activities")
        .insert(insertPayload)
        .select("id")
        .single();
      if (insertError) {
        console.error("[Submit] Insert error:", insertError);
        throw insertError;
      }
      console.log("[Submit] Activity inserted successfully.");
      console.log("Activity insert completed");

      if (photos.length > 0 && insertedActivity?.id) {
        try {
          const photoUrls = await uploadActivityPhotos(insertedActivity.id, profile.id);
          photoUrl = photoUrls[0] ?? null;
          if (photoUrl) {
            await supabase.from("activities").update({ photo_url: photoUrl }).eq("id", insertedActivity.id);
          }
          console.log("[Submit] Photos uploaded:", photoUrls.length);
        } catch (uploadErr) {
          console.warn("[Submit] Photo upload failed (non-fatal):", uploadErr);
          toast.warning("Photo upload failed, but activity was saved.");
        }
      }

      // 5. Auto-attendance marking (only when a photo was uploaded)
      if (autoAttendance && photoUrl) {
        try {
          const { data: existingAttendance } = await supabase
            .from("attendance")
            .select("id, status")
            .eq("cadre_id", profile.id)
            .eq("date", actDate)
            .maybeSingle();

          if (existingAttendance) {
            if (existingAttendance.status !== "present") {
              await supabase
                .from("attendance")
                .update({
                  status: "present" as const,
                  check_in_at: new Date().toISOString(),
                  recorded_by: profile.id,
                })
                .eq("id", existingAttendance.id);
            }
          } else {
            await supabase.from("attendance").insert({
              cadre_id: profile.id,
              block_id: blockId,
              date: actDate,
              status: "present" as const,
              check_in_at: new Date().toISOString(),
              recorded_by: profile.id,
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

      await qc.invalidateQueries({ queryKey: ["my-activities"] });
      toast.success(t("submission_success"));
      navigate({ to: "/cadre/history" });
    } catch (err: unknown) {
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
        // Skip drafts that were saved while GPS was denied — never persist fake/null coords.
        if (!draft.gps) {
          toast.warning(
            `ड्राफ्ट "${draft.activity_type_label || draft.activity_type}" के लिए GPS उपलब्ध नहीं था — छोड़ा गया। / Draft skipped: no GPS coordinates.`,
          );
          continue;
        }

        // 1. Insert activity
        const { error: actErr } = await supabase.from("activities").insert({
          cadre_id: draft.cadre_id,
          activity_date: draft.activity_date,
          block_id: draft.block_id,
          village_name: draft.village_name,
          panchayat: draft.panchayat,
          beneficiaries: draft.beneficiaries,
          gps: draft.gps,
          activity_type: draft.activity_type,
          description: draft.description,
          status: draft.status || "Pending",
        });
        if (actErr) throw actErr;

      // 2. Mark attendance — skip pending_verification (not a valid enum value)
      // Only mark present if there's photo evidence
      if (draft.photo_url) {
        const { data: existingAttendance } = await supabase
          .from("attendance")
          .select("id, status")
          .eq("cadre_id", draft.cadre_id)
          .eq("date", draft.activity_date)
          .maybeSingle();

        if (existingAttendance) {
          if (existingAttendance.status !== "present") {
            await supabase
              .from("attendance")
              .update({
                status: "present" as const,
                check_in_at: new Date().toISOString(),
                recorded_by: draft.cadre_id,
              })
              .eq("id", existingAttendance.id);
          }
        } else {
          await supabase.from("attendance").insert({
            cadre_id: draft.cadre_id,
            block_id: draft.block_id,
            date: draft.activity_date,
            status: "present" as const,
            check_in_at: new Date().toISOString(),
            recorded_by: draft.cadre_id,
          });
        }
      }
      }
      saveDraftsToLocalStorage([]);
      await qc.invalidateQueries({ queryKey: ["my-activities"] });
      toast.success("सभी ड्राफ्ट सिंक हो गए और उपस्थिति सत्यापन लंबित है / All offline drafts synced and attendance verification set to pending");
    } catch (e: any) {
      console.error(e);
      toast.error(`सिंक करने में विफल / Failed to sync offline cache: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        to="/cadre"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      {/* Page Title */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {t("submit_title")}
        </h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
          {t("submit_sub")}
        </p>
      </div>

      {/* Offline Alert Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              isOffline ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600",
            )}
          >
            {isOffline ? <WifiOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">
              {isOffline
                ? t("offline_active")
                : t("online_stable")}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none mt-1">
              Allows caching forms in remote locations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {drafts.length > 0 && (
            <Button
              onClick={handleSyncDrafts}
              variant="outline"
              className="h-9 rounded-xl text-xs font-black border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100/50 flex items-center gap-1.5 animate-pulse"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("sync_drafts")} ({drafts.length})
            </Button>
          )}

        </div>
      </div>

      {/* Submission Card Container */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3.5 mb-5 uppercase tracking-wide">
          {t("form_title")}
        </h2>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-5 text-xs font-bold text-slate-700"
        >
          {/* Row 1: Date & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">
                {t("date_label")}
              </Label>
              <Input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={actDate}
                onChange={(e) => setActDate(e.target.value)}
                className="h-10 text-xs rounded-lg border-slate-200 font-bold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">{t("activity_type_form")}</Label>
              <Select value={actType} onValueChange={setActType}>
                <SelectTrigger className="h-10 text-xs rounded-lg border-slate-200">
                  <SelectValue placeholder={t("select_activity_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES_11.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Location Hierarchy dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">{t("state_label")}</Label>
              <Input
                value="Chhattisgarh"
                disabled
                className="h-10 text-xs rounded-lg border-slate-200 bg-slate-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">{t("district_label")}</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="h-10 text-xs rounded-lg border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dantewada">Dantewada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">{t("block_form")}</Label>
              {blocks === undefined ? (
                <div className="h-10 rounded-lg border border-slate-200 bg-slate-50 animate-pulse flex items-center px-3">
                  <span className="text-[10px] text-slate-400 font-semibold">Loading blocks...</span>
                </div>
              ) : (
                <Select value={blockId} onValueChange={setBlockId}>
                  <SelectTrigger className="h-10 text-xs rounded-lg border-slate-200">
                    <SelectValue placeholder={t("select_block")} />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">{t("panchayat_form")}</Label>
              <Input
                value={panchayat}
                onChange={(e) => setPanchayat(e.target.value)}
                placeholder="e.g. Kalnar"
                className="h-10 text-xs rounded-lg border-slate-200"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">{t("village_form")}</Label>
              <Input
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Reslapur"
                className="h-10 text-xs rounded-lg border-slate-200"
                required
              />
            </div>
          </div>

          {/* Row 3: Beneficiary Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">
                महिला लाभार्थी संख्या / Women benefited (Max 1000)
              </Label>
              <Input
                type="number"
                min={0}
                max={1000}
                value={beneficiaryCount}
                onChange={(e) => setBeneficiaryCount(Number(e.target.value))}
                className="h-10 text-xs rounded-lg border-slate-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">GPS Geotag coords (Auto-capture)</Label>
              <div className="relative flex items-center">
                <Input
                  value={
                    gpsStatus === "pending"
                      ? "GPS लोकेशन प्राप्त की जा रही है... / Acquiring GPS…"
                      : gpsStatus === "denied"
                        ? "GPS अनुमति अस्वीकृत — सबमिशन जारी रह सकता है / GPS denied — submission will proceed"
                        : gpsStatus === "unavailable"
                          ? "GPS उपलब्ध नहीं — सबमिशन जारी रह सकता है / GPS unavailable"
                          : (gpsLocation ?? "")
                  }
                  disabled
                  className={cn(
                    "h-10 text-xs rounded-lg border-slate-200 bg-slate-50 pl-8.5 font-mono text-[10px]",
                    (gpsStatus === "denied" || gpsStatus === "unavailable") &&
                      "border-amber-300 bg-amber-50 text-amber-700",
                    gpsStatus === "pending" && "animate-pulse",
                  )}
                />
                <MapPin
                  className={cn(
                    "absolute left-2.5 h-4 w-4",
                    gpsStatus === "granted" ? "text-emerald-500" : "text-slate-400",
                    (gpsStatus === "denied" || gpsStatus === "unavailable") && "text-amber-500",
                  )}
                />
              </div>
              {(gpsStatus === "denied" || gpsStatus === "unavailable") && (
                <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                  ⚠️ GPS उपलब्ध नहीं — आप बिना GPS के भी सबमिट कर सकते हैं। / GPS not available — you can still submit without it.
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-slate-500 font-bold">
              विवरण नोट्स / Description Notes (Max 500 characters)
            </Label>
            <Textarea
              maxLength={500}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Meeting outcomes, agenda points discussed, recovery stats..."
              rows={3}
              className="text-xs rounded-lg border-slate-200"
            />
            <span className="text-[10px] text-slate-400 font-semibold text-right -mt-1">
              {500 - desc.length} characters remaining
            </span>
          </div>

          {/* Row 5: PDF Documents & Camera upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            {/* Image upload preview */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">साक्ष्य चित्र / Capture Photos</Label>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors"
              >
                <Camera className="h-6 w-6 text-slate-400" />
                <span className="text-[10px] text-slate-400 mt-1.5">Snaps (Max 10 pics)</span>
                <span className="text-[10px] text-emerald-600 mt-0.5">GPS geotag recommended</span>
              </button>
              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                onChange={handlePhotoSelection}
                className="sr-only"
              />
              {photoUploadError && (
                <p className="text-[10px] text-rose-500 font-semibold">{photoUploadError}</p>
              )}
              {photoPreviews.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {photoPreviews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative group flex h-10 w-10 shrink-0 border rounded overflow-hidden"
                    >
                      <img src={src} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="text-white cursor-pointer"
                          aria-label={`Remove photo ${idx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PDF Document */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-500 font-bold">
                दस्तावेज़ / PDF Attachment (Max 10MB)
              </Label>
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors">
                <FileText className="h-6 w-6 text-slate-400" />
                <span className="text-[10px] text-slate-400 mt-1.5">Upload PDF Minutes</span>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </label>
              {pdfDoc && (
                <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-2 py-1 text-[10px] mt-1.5">
                  <span className="truncate">{pdfDoc.name}</span>
                  <Trash2
                    onClick={() => setPdfDoc(null)}
                    className="h-3 w-3 text-rose-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 6: Attendance Link warning toggle */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3.5 shadow-sm">
            <div className="leading-tight">
              <p className="font-bold text-slate-700">उपस्थिति स्वतः दर्ज / Auto-Mark Attendance</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Toggle auto marking present status on activity report submit
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoAttendance}
              onChange={(e) => setAutoAttendance(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4 mt-6">
            <Button
              type="button"
              variant="ghost"
              disabled={busy || profileLoading}
              onClick={() => handleSubmitForm("Draft")}
              className="h-10 rounded-lg text-xs"
            >
              ड्राफ्ट सहेजें / Save Draft
            </Button>
            <Button
              type="button"
              disabled={busy || profileLoading}
              onClick={() => handleSubmitForm("Pending")}
              className="h-10 px-6 rounded-lg text-xs font-black shadow-md"
            >
              {profileLoading
                ? "प्रोफाइल लोड हो रही है... / Loading profile..."
                : busy
                  ? "सहेज रहा है... / Submitting..."
                  : "सबमिट करें / Submit Report"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
