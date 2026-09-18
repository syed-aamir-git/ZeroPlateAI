import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/signin",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/sign-in",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/auth/login",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/auth/register",
        destination: "/register",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
