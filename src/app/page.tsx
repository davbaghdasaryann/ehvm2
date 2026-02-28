import Image from "next/image";
import Link from "next/link";
import FloatingIcons from "@/components/FloatingIcons";
import EhvmLogo from "@/components/EhvmLogo";
import DarkModeToggle from "@/components/DarkModeToggle";
import { getFeaturedApps } from "@/lib/data";

// Depth values for parallax intensity on each floating icon.
// Positions are randomized by FloatingIcons; depth controls how much each icon responds to mouse movement.
const depths = [0.3, 0.7, 0.5, 0.8, 0.4, 0.6, 0.9];

export default async function Home() {
  const featuredApps = await getFeaturedApps();

  // First 6 depths → featured apps, last depth → dark mode toggle
  const appItems = featuredApps.slice(0, depths.length - 1).map((app, i) => ({
    id: app.slug,
    depth: depths[i],
    children: (
      <Link
        href={`/apps/${app.slug}`}
        className="relative block size-[80px] md:size-[100px] rounded-icon shadow-icon transition-transform hover:scale-110 [backface-visibility:hidden]"
      >
        <div className="relative size-full rounded-icon overflow-hidden [backface-visibility:hidden]">
          <Image src={app.icon} alt={app.name} fill className="object-cover scale-110" />
        </div>
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
      <FloatingIcons items={items} />

      <div className="flex-1" />

      <div className="flex flex-col items-center">
        <div className="flex items-start">
          <EhvmLogo width={109} height={44} />
          <span className="text-[17.5px] -mt-1 -ml-1 ehvm-fade-in" style={{ animationDelay: "1.1s" }}>™</span>
        </div>
        <p className="text-[12px] text-center max-w-[189px] mt-[10px] ehvm-fade-in" style={{ animationDelay: "1.3s" }}>
          EHVM Apps Capital<br />$438M in total asking value across our portfolio.
        </p>
      </div>

      <div className="flex-1 flex items-end justify-center pb-[42px]">
        <Link
          href="/apps"
          className="relative z-20 bg-glass backdrop-blur-[12px] flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] text-foreground no-underline leading-normal"
        >
          See more Apps
        </Link>
      </div>
    </main>
  );
}
