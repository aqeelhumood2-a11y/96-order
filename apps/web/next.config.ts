import type { NextConfig } from "next";

const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const usingEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
const storageEmulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

if (storageBucket) {
  // Only this project's own Firebase Storage bucket may be used as an
  // image source — no wildcard hosts. Firebase Storage download URLs are
  // always served from firebasestorage.googleapis.com under
  // /v0/b/<bucket>/o/..., so the pathname is pinned to that bucket too.
  remotePatterns.push({
    protocol: "https",
    hostname: "firebasestorage.googleapis.com",
    pathname: `/v0/b/${storageBucket}/o/**`,
  });
}

// Local/CI runs against the Storage emulator get their product-image
// download-token URLs from the emulator's own host (plain HTTP, a
// different hostname/port than production) — see
// infrastructure/firebase/product-image-storage.ts's `getDownloadUrl()`.
// Without this, `next/image` would reject every emulator-served image as
// an unconfigured remote host, breaking local dev and Playwright runs.
// This entry only exists when explicitly running against emulators, and
// is still pinned to this project's own bucket path, not a wildcard host.
if (usingEmulators && storageEmulatorHost && storageBucket) {
  const [hostname, port] = storageEmulatorHost.split(":");
  remotePatterns.push({
    protocol: "http",
    hostname: hostname!,
    ...(port ? { port } : {}),
    pathname: `/v0/b/${storageBucket}/o/**`,
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  reactStrictMode: true,
};

export default nextConfig;
