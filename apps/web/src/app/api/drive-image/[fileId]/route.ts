import { NextResponse } from "next/server";
import { isDriveFileId } from "@/core/catalog/rules";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Proxies a Google Drive file's bytes through this app's own server using
 * the official Drive API (`files.get?alt=media`), rather than the browser
 * hitting `lh3.googleusercontent.com` directly — see
 * `core/catalog/rules.ts#toDriveProxyUrl`'s doc comment. This is an optional
 * upgrade path (only reached when `GOOGLE_DRIVE_API_KEY` is configured),
 * not the default: this app's default hotlink behavior (matching this
 * project's other Google-Drive-backed site byte-for-byte) already works,
 * and this route exists for whoever wants Drive images to also be
 * server-cached and never dependent on Google's own hotlink serving at all.
 *
 * Unauthenticated by design, same as the file it serves: anyone who already
 * has the Drive file id (baked into the storefront's own HTML) could fetch
 * the same bytes directly from Drive anyway, so this route adds no new
 * exposure — it only changes which server does the fetching.
 */
export async function GET(_request: Request, context: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await context.params;
  if (!isDriveFileId(fileId)) {
    return NextResponse.json({ error: "Invalid Google Drive file id" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    logger.error("GOOGLE_DRIVE_API_KEY is not set — /api/drive-image cannot proxy Drive files without it");
    return NextResponse.json({ error: "Google Drive image proxy is not configured" }, { status: 503 });
  }

  let driveResponse: Response;
  try {
    driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`);
  } catch (error) {
    logger.error("Failed to reach the Google Drive API", { fileId, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Could not reach Google Drive" }, { status: 502 });
  }

  if (!driveResponse.ok || !driveResponse.body) {
    logger.error("Google Drive API returned an error for a product image", { fileId, status: driveResponse.status });
    return NextResponse.json({ error: "Google Drive did not return this file" }, { status: 502 });
  }

  return new NextResponse(driveResponse.body, {
    headers: {
      "Content-Type": driveResponse.headers.get("content-type") ?? "application/octet-stream",
      // Drive file ids are effectively immutable content (replacing a
      // product photo uploads a new file/id rather than overwriting bytes
      // in place), so a long, cacheable lifetime is safe — this also
      // directly addresses the recurring "image loading is slow" feedback,
      // since a repeat view never re-hits Drive at all.
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
