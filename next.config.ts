import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Designed-By",
            value: "Luphar; https://luphar.org",
          },
          {
            key: "X-Created-By",
            value: "Luphar; https://luphar.org",
          },
          {
            key: "Link",
            value: '<https://luphar.org>; rel="author"',
          },
        ],
      },
    ];
  },
  images: {
    // Allow Notion-hosted images when CMS is connected.
    // Notion serves file uploads from S3 and inline images from notion.so.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3-us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "public.notion-static.com",
      },
      {
        protocol: "https",
        hostname: "www.notion.so",
      },
    ],
  },
};

export default nextConfig;
