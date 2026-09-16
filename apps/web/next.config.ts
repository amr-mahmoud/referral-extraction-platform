import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Self-contained server bundle for the production Docker image (docker/Dockerfile.prod).
  output: "standalone",
};

export default nextConfig;
