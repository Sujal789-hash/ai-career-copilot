import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OneDrive can retain a lock on the default .next trace file while dev is open.
  distDir: ".next-build",
  output: "standalone",
};

export default nextConfig;
