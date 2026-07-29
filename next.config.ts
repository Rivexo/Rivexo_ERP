import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/projects/:id/finances",
        destination: "/erp/projects/:id",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
