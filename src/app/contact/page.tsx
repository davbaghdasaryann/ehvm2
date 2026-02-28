import Image from "next/image";
import Link from "next/link";
import FloatingIcons from "@/components/FloatingIcons";
import EhvmLogo from "@/components/EhvmLogo";

const floatingPeople: { src: string; name: string; href: string; depth: number }[] = [
  { src: "/images/evelin.png", name: "Evelin", href: "/story", depth: 0.7 },
  { src: "/images/sam.png", name: "Sam", href: "#contact", depth: 0.4 },
];

export default function Contact() {
  const items = floatingPeople.map((person) => ({
    id: person.name,
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
          href="mailto:evelin@ehvm.com?subject=Interested%20in%20buying%20an%20app"
          className="bg-primary flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] text-primary-text no-underline leading-normal"
        >
          Want to Buy?
        </a>
        <a
          href="mailto:evelin@ehvm.com?subject=Interested%20in%20selling%20my%20app"
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
