import { NextResponse } from "next/server";
import { isDriveFileId } from "@/core/catalog/rules";
import { fetchDriveImage } from "@/services/catalog/fetch-drive-image";

export const dynamic = "force-dynamic";

/**
 * Proxies a Google Drive file's bytes through this app's own server using
 * the official Drive API (`fetchDriveImage`, authenticated with this app's
 * existing Firebase Admin service account) — rather than the browser
 * hitting `lh3.googleusercontent.com` directly, which this app has
 * confirmed can return a 403 for a specific product photo despite fully
 * correct "anyone with the link" sharing, for reasons outside this app's
 * control (see `core/catalog/rules.ts#toDriveProxyUrl`'s doc comment).
 *
 * Always falls back to a redirect to the direct hotlink — never a hard
 * error — when no service-account credential is configured (local dev) or
 * the Drive API call itself fails for any reason, so a misconfigured or
 * unusual environment degrades to this app's original, always-worked
 * behavior instead of breaking every product image.
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

  const directHotlinkUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  const result = await fetchDriveImage(fileId);
  if (!result.ok || !result.body) {
    return NextResponse.redirect(directHotlinkUrl);
  }

  return new NextResponse(result.body, {
    headers: {
      "Content-Type": result.contentType ?? "application/octet-stream",
      // Drive file ids are effectively immutable content (replacing a
      // product photo uploads a new file/id rather than overwriting bytes
      // in place), so a long, cacheable lifetime is safe — this also
      // directly addresses the recurring "image loading is slow" feedback,
      // since a repeat view never re-hits Drive at all.
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
