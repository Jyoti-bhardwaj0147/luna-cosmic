import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["192.168.1.11", "192.168.1.21", "localhost", "**.localhost"],
};

export default nextConfig;
