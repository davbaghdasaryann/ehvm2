import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import FloatingIcons from "@/components/FloatingIcons";
import EhvmLogo from "@/components/EhvmLogo";
import DarkModeToggle from "@/components/DarkModeToggle";
import { getFeaturedApps, getPageSubtitles } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://ehvmcapital.com";

// Depth values for parallax intensity on each floating icon.
// Positions are randomized by FloatingIcons; depth controls how much each icon responds to mouse movement.
const depths = [0.3, 0.7, 0.5, 0.8, 0.4, 0.6, 0.9];

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Buy and Sell Mobile Apps",
  description: "Explore curated mobile app acquisition opportunities and connect with EHVM Apps Capital to buy or sell profitable apps.",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const [featuredApps, pageSubtitles] = await Promise.all([getFeaturedApps(), getPageSubtitles()]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "EHVM Apps Capital",
        url: SITE_URL,
        description: "EHVM Apps Capital connects mobile app founders, buyers, and operators through curated acquisition opportunities.",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "EHVM Apps Capital",
        creator: {
          "@type": "Organization",
          name: "Luphar",
          url: "https://luphar.org",
        },
        designer: {
          "@type": "Organization",
          name: "Luphar",
          url: "https://luphar.org",
        },
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
      },
    ],
  };

  // First 6 depths → featured apps, last depth → dark mode toggle
  const appItems = featuredApps.slice(0, depths.length - 1).map((app, i) => ({
    id: app.slug,
    depth: depths[i],
    children: (
      <Link
        href={`/apps/${app.slug}`}
        className="relative block size-[80px] md:size-[100px] rounded-icon shadow-icon transition-transform hover:scale-110 [backface-visibility:hidden]"
      >
        {app.icon ? (
          <div className="relative size-full rounded-icon overflow-hidden [backface-visibility:hidden]">
            <Image src={app.icon} alt={app.name} fill unoptimized className="object-cover scale-110" />
          </div>
        ) : (
          <div className="size-full rounded-icon bg-tag flex items-center justify-center text-[28px] [backface-visibility:hidden]">
            📱
          </div>
        )}
      </Link>
    ),
  }));

  const items = [
    ...appItems,
    {
      id: "dark-mode-toggle",
      depth: depths[depths.length - 1],
      children: <DarkModeToggle />,
    },
  ];

  return (
    <main className="relative w-full flex-1 flex flex-col items-center h-[calc(100dvh-97px)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FloatingIcons items={items} />

      <div className="flex-1" />

      <div className="flex flex-col items-center">
        <div className="flex items-start">
          <EhvmLogo width={109} height={44} />
          <span className="text-[17.5px] -mt-1 -ml-1 ehvm-fade-in" style={{ animationDelay: "1.1s" }}>™</span>
        </div>
        {pageSubtitles.home ? (
          <p className="text-[12px] text-center max-w-[189px] mt-[10px] ehvm-fade-in" style={{ animationDelay: "1.3s" }}>
            {pageSubtitles.home}
          </p>
        ) : (
          <p className="text-[12px] text-center max-w-[189px] mt-[10px] ehvm-fade-in" style={{ animationDelay: "1.3s" }}>
            EHVM Apps Capital<br />$438M in total asking value across our portfolio.
          </p>
        )}
      </div>

      <div className="flex-1 flex items-end justify-center pb-[42px]">
        <Link
          href="/apps"
          className="relative z-20 bg-tag flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] text-foreground no-underline leading-normal"
        >
          See more Apps
        </Link>
      </div>
    </main>
  );
}
