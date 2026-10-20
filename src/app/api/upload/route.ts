import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient, STORAGE_BUCKET } from "@/lib/supabase/admin";
import { assertRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const ADMIN_FOLDERS = ["brands", "models", "products", "videos", "settings"] as const;
const USER_FOLDERS = ["reviews", "avatars"] as const;
const folderSchema = z.enum([...ADMIN_FOLDERS, ...USER_FOLDERS]);

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

/**
 * Server-side upload to Supabase Storage (service role), so the browser never needs write
 * access to the bucket. Admins may upload anywhere; signed-in users only to reviews/ & avatars/.
 */
export async function POST(req: Request) {
  try {
    await assertRateLimit("upload", 60, 10 * 60_000);
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    const folderRaw = form.get("folder");
    const folder = folderSchema.safeParse(folderRaw);
    if (!folder.success) return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

    const isAdminFolder = (ADMIN_FOLDERS as readonly string[]).includes(folder.data);
    if (isAdminFolder && user.role !== "admin")
      return NextResponse.json({ error: "Admin only" }, { status: 403 });

    const isVideo = VIDEO_TYPES.includes(file.type);
    const isImage = IMAGE_TYPES.includes(file.type);
    if (!isVideo && !isImage) return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    if (isVideo && folder.data !== "videos" && folder.data !== "settings")
      return NextResponse.json({ error: "Videos go to the videos folder" }, { status: 400 });
    if (file.size > (isVideo ? MAX_VIDEO : MAX_IMAGE))
      return NextResponse.json({ error: `File too large (max ${isVideo ? 50 : 5} MB)` }, { status: 413 });

    const ext = (file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg"))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const path = `${folder.data}/${isAdminFolder ? "" : `${user.id}/`}${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const supabase = createAdminClient();
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buf, { contentType: file.type, upsert: false, cacheControl: "31536000" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
}
