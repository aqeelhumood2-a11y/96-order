import "server-only";
import { getDriveAccessToken } from "@/infrastructure/google/drive-auth";
import { logger } from "@/lib/logger";

export interface DriveImageFetchResult {
  ok: boolean;
  body?: ReadableStream<Uint8Array>;
  contentType?: string;
}

/**
 * Fetches a Drive file's bytes through the official Drive API
 * (`files.get?alt=media`), authenticated via `getDriveAccessToken` — see
 * that function's doc comment for why this reuses the Firebase Admin
 * service account rather than a separate credential. Returns `{ ok: false }`
 * (never throws) for every failure mode — no credential configured, a
 * network error, or Drive itself returning an error — so the caller
 * (`app/api/drive-image/[fileId]/route.ts`) can uniformly fall back to the
 * direct hotlink URL instead of needing to distinguish failure reasons.
 */
export async function fetchDriveImage(fileId: string): Promise<DriveImageFetchResult> {
  const accessToken = await getDriveAccessToken();
  if (!accessToken) return { ok: false };

  let response: Response;
  try {
    response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    logger.error("Failed to reach the Google Drive API", { fileId, error: error instanceof Error ? error.message : String(error) });
    return { ok: false };
  }

  if (!response.ok || !response.body) {
    logger.error("Google Drive API returned an error for a product image", { fileId, status: response.status });
    return { ok: false };
  }

  return { ok: true, body: response.body, contentType: response.headers.get("content-type") ?? "application/octet-stream" };
}
