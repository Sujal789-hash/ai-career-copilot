import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // On Vercel, distDir must be standard (.next) and output must not be standalone.
  // Locally (OneDrive), use .next-build to avoid trace file locks.
  distDir: process.env.VERCEL ? undefined : ".next-build",
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
