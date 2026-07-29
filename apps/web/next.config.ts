import type { NextConfig } from "next";

const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

const nextConfig: NextConfig = {
  images: {
    // Only this project's own Firebase Storage bucket may be used as an
    // image source — no wildcard hosts. Firebase Storage download URLs are
    // always served from firebasestorage.googleapis.com under
    // /v0/b/<bucket>/o/..., so the pathname is pinned to that bucket too.
    remotePatterns: storageBucket
      ? [
          {
            protocol: "https",
            hostname: "firebasestorage.googleapis.com",
            pathname: `/v0/b/${storageBucket}/o/**`,
          },
        ]
      : [],
  },
  reactStrictMode: true,
};

export default nextConfig;
