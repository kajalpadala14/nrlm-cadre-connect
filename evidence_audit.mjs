// Evidence Gallery Audit Script — READ ONLY
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://tsussrheickvpshvwihw.supabase.co",
  "sb_secret_irhzYBO0fFozdx0oOtoJXA_BknuA7fI"
);

const { data: acts } = await supabase
  .from("activities")
  .select("id, photo_url, pdf_url, status, submitted_at, cadre_id")
  .order("submitted_at", { ascending: false });

const total = acts?.length ?? 0;
const withPhoto = acts?.filter(a => !!a.photo_url) ?? [];
const withPdf   = acts?.filter(a => !!a.pdf_url)   ?? [];
const noPhoto   = acts?.filter(a => !a.photo_url)  ?? [];

console.log("=== EVIDENCE GALLERY AUDIT ===");
console.log("Total activities:", total);
console.log("With photo_url:", withPhoto.length);
console.log("With pdf_url:", withPdf.length);
console.log("Without photo_url:", noPhoto.length);

console.log("\n=== photo_url FORMAT ANALYSIS ===");
withPhoto.forEach(a => {
  const url = a.photo_url;
  const isFullHttps = url.startsWith("https://");
  const isPublicUrl = url.includes("/storage/v1/object/public/");
  const isSignedUrl = url.includes("/storage/v1/object/sign/");
  const isStoragePath = !isFullHttps;
  const urlType = isPublicUrl
    ? "PUBLIC_URL"
    : isSignedUrl
    ? "SIGNED_URL"
    : isStoragePath
    ? "STORAGE_PATH_ONLY (NOT a URL!)"
    : "FULL_URL_UNKNOWN_FORMAT";

  const projectMatch = url.includes("tsussrheickvpshvwihw");
  const bucketMatch  = url.includes("activity-photos");

  console.log(`  Activity ${a.id.slice(0,8)}`);
  console.log(`    URL type:    ${urlType}`);
  console.log(`    Correct project: ${projectMatch}`);
  console.log(`    Correct bucket:  ${bucketMatch}`);
  console.log(`    URL: ${url.slice(0,150)}`);
});

// Check bucket public status
console.log("\n=== STORAGE BUCKETS (public/private) ===");
const { data: buckets, error: be } = await supabase.storage.listBuckets();
if (be) {
  console.log("Error listing buckets:", be.message);
} else {
  buckets.forEach(b => {
    console.log(`  Bucket: "${b.name}" | public=${b.public} | id=${b.id}`);
  });
  const photoBucket = buckets.find(b => b.name === "activity-photos");
  if (!photoBucket) {
    console.log("\n  CRITICAL: activity-photos bucket does NOT exist in storage!");
  } else {
    console.log(`\n  activity-photos bucket: public=${photoBucket.public}`);
    if (!photoBucket.public) {
      console.log("  WARNING: Bucket is PRIVATE — public URLs will return 400/403 in browser");
    } else {
      console.log("  OK: Bucket is PUBLIC — public URLs should work");
    }
  }
}

// Try to list files in the bucket (service role can always list)
console.log("\n=== FILES IN activity-photos BUCKET ===");
const { data: files, error: fe } = await supabase.storage.from("activity-photos").list("", { limit: 20 });
if (fe) {
  console.log("Cannot list root:", fe.message);
} else {
  console.log("Top-level folders/files:", files?.map(f => f.name));
  console.log("Count:", files?.length);
}

// Try fetching one of the stored URLs to check HTTP status
if (withPhoto.length > 0) {
  const testUrl = withPhoto[0].photo_url;
  console.log("\n=== HTTP FETCH TEST ON FIRST photo_url ===");
  console.log("Testing URL:", testUrl);
  try {
    const res = await fetch(testUrl, { method: "HEAD" });
    console.log("HTTP Status:", res.status, res.statusText);
    console.log("Content-Type:", res.headers.get("content-type"));
  } catch (err) {
    console.log("Fetch error:", err.message);
  }
}

console.log("\n=== AUDIT COMPLETE ===");
