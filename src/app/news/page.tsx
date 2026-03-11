import Image from "next/image";
import Link from "next/link";
import FloatingIcons from "@/components/FloatingIcons";
import EhvmLogo from "@/components/EhvmLogo";
import { getArticles } from "@/lib/data";

const depths = [0.5, 0.3, 0.8, 0.6, 0.4];

export const revalidate = 60;

export default async function Newsroom() {
  const articles = await getArticles();
  const top = articles.filter((article) => Boolean(article.thumbnail)).slice(0, depths.length);

  const items = top.map((article, idx) => {
    const src = article.thumbnail ?? "";
    const fit = article.thumbnailFit;

    return {
      id: article.slug,
      depth: depths[idx] || 0.5,
      children: (
        <Link
          href={`/news/${article.slug}`}
          className="relative block size-[80px] md:size-[100px] rounded-icon shadow-icon transition-transform hover:scale-110 [backface-visibility:hidden]"
        >
          <div className={`relative size-full rounded-icon overflow-hidden [backface-visibility:hidden] ${fit === "contain" ? "bg-thumbnail" : ""}`}>
            <Image
              src={src}
              alt=""
              fill
              className={fit === "contain" ? "object-contain p-[4px]" : "object-cover scale-110"}
            />
          </div>
        </Link>
      ),
    };
  });

  return (
    <main className="relative w-full flex-1 flex flex-col items-center h-[calc(100dvh-97px)]">
      <FloatingIcons items={items} />

      <div className="flex-1" />

      <div className="flex flex-col items-center">
        <div className="flex items-start">
          <EhvmLogo width={94} height={38} />
          <span className="text-[15px] -mt-1 -ml-1 ehvm-fade-in" style={{ animationDelay: "1.1s" }}>™</span>
          <span className="text-[44px] tracking-[-1.5px] ml-1 -mt-4 ehvm-fade-in" style={{ fontFamily: "var(--font-serif)", animationDelay: "1.2s" }}>News</span>
        </div>
        <p className="text-[12px] text-center max-w-[189px] mt-[10px] ehvm-fade-in" style={{ animationDelay: "1.4s" }}>
          News, Stories, Events
        </p>
      </div>

      <div className="flex-1 flex items-end justify-center pb-[42px]">
        <Link
          href="/news/all"
          className="relative z-20 bg-glass backdrop-blur-[12px] flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] text-foreground no-underline leading-normal"
        >
          See more News
        </Link>
      </div>
    </main>
  );
}
