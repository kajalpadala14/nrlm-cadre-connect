/**
 * NRLM Evidence Upload API — Server Functions
 * File: src/lib/api/evidence.functions.ts
 *
 * Evidence = photos, documents, GPS screenshots attached to an activity.
 *
 * Storage layout (in Supabase Storage bucket "activity-photos"):
 *   {cadre_uuid}/{activity_uuid}/{timestamp}_{filename}
 *
 * HOW UPLOAD WORKS (client-side, not here):
 *   1. Call getUploadUrl() to get a pre-signed upload path
 *   2. Browser uploads directly to Supabase Storage (not through your server)
 *   3. Call registerEvidenceFile() to save the metadata to the DB
 *
 * This keeps large files out of your server memory.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
  "video/mp4",
  "video/webm",
];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ─── GET UPLOAD PATH ─────────────────────────────────────────
/**
 * Returns the storage path where the client should upload the file.
 * The path follows the RLS policy:
 *   activity-photos/{cadre_uuid}/{activity_uuid}/{timestamp}_{filename}
 *
 * Client then calls:
 *   supabase.storage.from('activity-photos').upload(path, file)
 */
export const getUploadPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        activity_id: z.string().uuid(),
        file_name: z.string().min(1).max(255),
        mime_type: z.string().refine((m) => ALLOWED_MIME_TYPES.includes(m), {
          message: `File type not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
        }),
        file_size: z
          .number()
          .int()
          .max(MAX_FILE_SIZE_BYTES, {
            message: `File too large. Max ${MAX_FILE_SIZE_MB}MB.`,
          }),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify the activity belongs to this cadre
    const { data: activity } = await supabase
      .from("activities")
      .select("cadre_id, status")
      .eq("id", data.activity_id)
      .single();

    if (!activity) throw new Error("Activity not found");
    if (activity.cadre_id !== userId) throw new Error("Forbidden");
    if (activity.status === "Approved") {
      throw new Error("Cannot add evidence to an approved activity");
    }

    // Sanitize filename: remove spaces and special chars
    const safeFileName = data.file_name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);

    const timestamp = Date.now();
    const storagePath = `${userId}/${data.activity_id}/${timestamp}_${safeFileName}`;

    return {
      storage_path: storagePath,
      bucket: "activity-photos",
      // Instructions for the client:
      instructions: "Upload the file to supabase.storage.from(bucket).upload(storage_path, file)",
    };
  });

// ─── REGISTER EVIDENCE FILE ──────────────────────────────────
/**
 * After the client uploads a file to storage, call this to
 * save the file metadata to the evidence_files table.
 */
export const registerEvidenceFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        activity_id: z.string().uuid(),
        storage_path: z.string().min(1),
        file_name: z.string().min(1).max(255),
        file_size: z.number().int().optional().nullable(),
        mime_type: z.string().optional().nullable(),
        latitude: z.number().min(-90).max(90).optional().nullable(),
        longitude: z.number().min(-180).max(180).optional().nullable(),
        captured_at: z.string().datetime().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify the file actually exists in storage before registering
    const { data: storageData, error: storageErr } = await supabase.storage
      .from("activity-photos")
      .list(`${userId}/${data.activity_id}/`);

    if (storageErr) throw new Error(`Storage check failed: ${storageErr.message}`);

    const fileName = data.storage_path.split("/").pop();
    const fileExists = (storageData ?? []).some((f) => f.name === fileName);
    if (!fileExists) {
      throw new Error("File not found in storage. Please upload the file before registering.");
    }

    // Generate the public URL for display
    const { data: urlData } = supabase.storage
      .from("activity-photos")
      .getPublicUrl(data.storage_path);

    const { data: evidence, error } = await supabase
      .from("evidence_files")
      .insert({
        activity_id: data.activity_id,
        cadre_id: userId,
        storage_path: data.storage_path,
        public_url: urlData?.publicUrl ?? null,
        file_name: data.file_name,
        file_size: data.file_size ?? null,
        mime_type: data.mime_type ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        captured_at: data.captured_at ?? null,
      })
      .select("id, public_url, file_name, mime_type")
      .single();

    if (error) throw new Error(`Register error: ${error.message}`);

    // Also update the legacy photo_url on the activity (first image)
    // so existing dashboard code that reads photo_url still works
    if (data.mime_type?.startsWith("image/")) {
      const { data: existingAct } = await supabase
        .from("activities")
        .select("photo_url")
        .eq("id", data.activity_id)
        .single();

      if (!existingAct?.photo_url) {
        await supabase
          .from("activities")
          .update({ photo_url: urlData?.publicUrl })
          .eq("id", data.activity_id);
      }
    }

    return { ok: true, evidence };
  });

// ─── GET EVIDENCE FILES ──────────────────────────────────────
/**
 * List all evidence files for a given activity.
 * Cadres can only see their own activity's files.
 */
export const getEvidenceFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ activity_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: activity } = await supabase
      .from("activities")
      .select("cadre_id")
      .eq("id", data.activity_id)
      .single();

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);

    const isStaff = (roles ?? []).some((r) => r.role === "admin" || r.role === "block_officer");

    if (!isStaff && activity?.cadre_id !== userId) {
      throw new Error("Forbidden");
    }

    const { data: files, error } = await supabase
      .from("evidence_files")
      .select(
        "id, file_name, public_url, mime_type, file_size, latitude, longitude, captured_at, created_at",
      )
      .eq("activity_id", data.activity_id)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Fetch error: ${error.message}`);
    return files ?? [];
  });

// ─── DELETE EVIDENCE FILE ────────────────────────────────────
export const deleteEvidenceFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ evidence_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: file } = await supabase
      .from("evidence_files")
      .select("cadre_id, storage_path, activity_id")
      .eq("id", data.evidence_id)
      .single();

    if (!file) throw new Error("File not found");
    if (file.cadre_id !== userId) throw new Error("Forbidden");

    // Delete from storage
    const { error: storageErr } = await supabase.storage
      .from("activity-photos")
      .remove([file.storage_path]);

    if (storageErr) {
      console.error("Storage delete error:", storageErr.message);
      // Continue even if storage delete fails — DB record must be removed
    }

    // Delete from DB
    const { error } = await supabase.rpc(
      "delete_evidence_with_consistency",
      { p_evidence_id: data.evidence_id },
    );

    if (error) throw new Error(`Delete error: ${error.message}`);

    // If this was the only file, clear photo_url on activity
    const { count } = await supabase
      .from("evidence_files")
      .select("id", { count: "exact", head: true })
      .eq("activity_id", file.activity_id);

    if ((count ?? 0) === 0) {
      await supabase.from("activities").update({ photo_url: null }).eq("id", file.activity_id);
    }

    return { ok: true };
  });
