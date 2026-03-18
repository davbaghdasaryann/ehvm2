import Image from "next/image";
import Link from "next/link";
import FloatingIcons from "@/components/FloatingIcons";
import EhvmLogo from "@/components/EhvmLogo";
import { getPublishedStories, getSiteLinks } from "@/lib/data";

const PEOPLE_META: Record<string, { src: string; depth: number }> = {
  evelin: { src: "/images/evelin.png", depth: 0.7 },
  sam:    { src: "/images/sam.png",    depth: 0.4 },
};

const FALLBACK_PEOPLE = [
  { id: "evelin", src: "/images/evelin.png", name: "Evelin", href: "/story/evelin", depth: 0.7 },
  { id: "sam",    src: "/images/sam.png",    name: "Sam",    href: "#contact",       depth: 0.4 },
];

export const revalidate = 60;

export default async function Contact() {
  const [stories, siteLinks] = await Promise.all([getPublishedStories(), getSiteLinks()]);

  // Build floating people from published stories; fall back to hardcoded list
  const floatingPeople = stories.length > 0
    ? stories.map((s, i) => {
        const meta = PEOPLE_META[s.slug] ?? { src: `/images/${s.slug}.png`, depth: 0.5 - i * 0.1 };
        return {
          id: s.id,
          src: s.heroImage || meta.src,
          name: s.name,
          href: `/story/${s.slug}`,
          depth: meta.depth,
        };
      })
    : FALLBACK_PEOPLE;

  const items = floatingPeople.map((person) => ({
    id: person.id,
    depth: person.depth,
    children: (
      <Link
        href={person.href}
        className="relative block size-[80px] md:size-[100px] rounded-icon shadow-icon transition-transform hover:scale-110"
      >
        <div className="relative size-full rounded-icon overflow-hidden">
          <Image src={person.src} alt={person.name} fill className="object-cover" />
        </div>
      </Link>
    ),
  }));

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
          Connecting app builders and buyers. Reach out to get started.
        </p>
      </div>

      <div className="relative z-20 flex gap-[15px] items-center mt-[30px]">
        <a
          href={siteLinks.wantToBuyUrl}
          className="bg-primary flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] text-primary-text no-underline leading-normal"
        >
          Want to Buy?
        </a>
        <a
          href={siteLinks.wantToSellUrl}
          className="bg-primary flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] text-primary-text no-underline leading-normal"
        >
          Want to Sell?
        </a>
      </div>

      <div className="flex-1 flex items-end justify-center pb-[42px]">
        <Link
          href="/story"
          className="relative z-20 bg-glass backdrop-blur-[12px] flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] text-foreground no-underline leading-normal"
        >
          Our Story
        </Link>
      </div>
    </main>
  );
}
