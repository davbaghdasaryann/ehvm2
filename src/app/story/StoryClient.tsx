"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import type { StoryRecord } from "@/admin/types";

function YouTubeEmbed({ videoId, title }: { videoId: string; title?: string }) {
  return (
    <div className="w-full my-[4px]">
      <div className="relative w-full aspect-video rounded-icon overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title || "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
      {title && (
        <p className="text-[12px] text-caption text-center mt-[8px] italic">{title}</p>
      )}
    </div>
  );
}

function TweetEmbed({ tweetUrl, theme }: { tweetUrl: string; theme: string }) {
  return (
    <div className="w-full my-[4px] flex justify-center">
      <blockquote className="twitter-tweet" data-theme={theme} data-conversation="none">
        <a href={tweetUrl}> </a>
      </blockquote>
    </div>
  );
}

export default function StoryClient({ story }: { story: StoryRecord }) {
  const { theme } = useTheme();

  useEffect(() => {
    if (!(window as unknown as Record<string, unknown>).twttr) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      document.body.appendChild(script);
    } else {
      (window as unknown as Record<string, { widgets: { load: () => void } }>).twttr.widgets.load();
    }
  }, []);

  return (
    <main className="flex justify-center w-full px-[10px] pb-[40px]">
      <div className="bg-card flex flex-col items-start p-[15px] rounded-card w-full max-w-[500px]">
        {/* Meta bar */}
        <div className="flex items-center justify-between w-full mb-[20px]">
          <div className="flex gap-[5px] items-center">
            <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0">
              <span className="text-[12px] leading-[1.2]">Story</span>
            </div>
          </div>
          <Link href="/contact" className="bg-primary flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0 no-underline">
            <span className="text-[12px] leading-[1.2] text-primary-text">Close</span>
          </Link>
        </div>

        {/* Headline */}
        <h1
          className="text-[28px] leading-[1.15] tracking-[-0.5px] mb-[24px]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {story.headline}
        </h1>

        {/* Hero Image */}
        {story.heroImage && (
          <div className="relative w-full aspect-[16/9] rounded-icon overflow-hidden mb-[30px]">
            <Image src={story.heroImage} alt="Story hero" fill className="object-cover" />
          </div>
        )}

        {/* Content blocks */}
        <div className="flex flex-col gap-[20px] w-full px-[5px]">
          {story.blocks.map((block) => {
            if (block.type === 'text' && block.content) {
              return (
                <p key={block.id} className="text-[16px] leading-[1.7] text-body" style={{ fontFamily: "var(--font-serif)" }}>
                  {block.content}
                </p>
              );
            }
            if (block.type === 'youtube' && block.videoId) {
              return <YouTubeEmbed key={block.id} videoId={block.videoId} title={block.videoTitle} />;
            }
            if (block.type === 'tweet' && block.tweetUrl) {
              return <TweetEmbed key={block.id} tweetUrl={block.tweetUrl} theme={theme} />;
            }
            if (block.type === 'quote' && block.quoteText) {
              return (
                <blockquote key={block.id} className="border-l-[3px] border-primary pl-[20px] py-[4px] my-[6px]">
                  <p className="text-[18px] leading-[1.6] italic text-body" style={{ fontFamily: "var(--font-serif)" }}>
                    &ldquo;{block.quoteText}&rdquo;
                  </p>
                  {block.quoteCite && (
                    <cite className="text-[13px] text-caption not-italic mt-[8px] block">{block.quoteCite}</cite>
                  )}
                </blockquote>
              );
            }
            return null;
          })}
        </div>

        {/* Social Links */}
        <div className="w-full mt-[30px] pt-[20px] border-t border-divider">
          <p className="text-[13px] text-caption mb-[12px]">Follow Evelin</p>
          <div className="flex gap-[8px] flex-wrap">
            {story.social.instagram && (
              <a href={story.social.instagram} target="_blank" rel="noopener noreferrer" className="bg-primary flex h-[35px] items-center justify-center px-[15px] rounded-pill no-underline">
                <span className="text-[13px] text-primary-text">Instagram</span>
              </a>
            )}
            {story.social.twitter && (
              <a href={story.social.twitter} target="_blank" rel="noopener noreferrer" className="bg-primary flex h-[35px] items-center justify-center px-[15px] rounded-pill no-underline">
                <span className="text-[13px] text-primary-text">X / Twitter</span>
              </a>
            )}
            {story.social.linkedin && (
              <a href={story.social.linkedin} target="_blank" rel="noopener noreferrer" className="bg-primary flex h-[35px] items-center justify-center px-[15px] rounded-pill no-underline">
                <span className="text-[13px] text-primary-text">LinkedIn</span>
              </a>
            )}
            {story.social.tiktok && (
              <a href={story.social.tiktok} target="_blank" rel="noopener noreferrer" className="bg-primary flex h-[35px] items-center justify-center px-[15px] rounded-pill no-underline">
                <span className="text-[13px] text-primary-text">TikTok</span>
              </a>
            )}
          </div>
        </div>

        {/* Back */}
        <div className="w-full mt-[20px] pt-[20px] border-t border-divider">
          <Link href="/contact" className="bg-primary flex w-fit gap-[10px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[14px] text-primary-text no-underline leading-normal">
            ← Back to Contact
          </Link>
        </div>
      </div>
    </main>
  );
}
