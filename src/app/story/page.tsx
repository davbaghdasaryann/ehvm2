"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

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

export default function OurStory() {
  const { theme } = useTheme();

  useEffect(() => {
    // Load Twitter widget script for inline tweet embeds
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
          The story behind EHVM Apps Capital
        </h1>

        {/* Hero Image */}
        <div className="relative w-full aspect-[16/9] rounded-icon overflow-hidden mb-[30px]">
          <Image src="/images/evelin.png" alt="Evelin Herrera" fill className="object-cover" />
        </div>

        {/* Content with inline embeds */}
        <div className="flex flex-col gap-[20px] w-full px-[5px]">
          <p className="text-[16px] leading-[1.7] text-body" style={{ fontFamily: "var(--font-serif)" }}>
            EHVM Apps Capital was founded by Evelin Herrera with a simple idea: create a space where app builders and buyers can connect directly, without the noise. A marketplace built by someone who understands both sides of the table.
          </p>

          {/* YouTube - intro/pitch video */}
          <YouTubeEmbed videoId="dQw4w9WgXcQ" title="EHVM Apps Capital — Introduction" />

          <p className="text-[16px] leading-[1.7] text-body" style={{ fontFamily: "var(--font-serif)" }}>
            Before starting EHVM, Evelin spent years building and scaling mobile apps across industries — from wellness to fintech. She saw firsthand how difficult it was for independent developers to find the right exit, and how hard it was for buyers to discover quality apps with real traction.
          </p>

          {/* Tweet */}
          <TweetEmbed theme={theme} tweetUrl="https://x.com/ehvm/status/1234567890" />

          <blockquote className="border-l-[3px] border-primary pl-[20px] py-[4px] my-[6px]">
            <p className="text-[18px] leading-[1.6] italic text-body" style={{ fontFamily: "var(--font-serif)" }}>
              &ldquo;I kept meeting incredible builders who had no idea what their app was worth, and buyers who couldn&apos;t find what they were looking for. EHVM is the bridge.&rdquo;
            </p>
            <cite className="text-[13px] text-caption not-italic mt-[8px] block">— Evelin Herrera, Founder</cite>
          </blockquote>

          <p className="text-[16px] leading-[1.7] text-body" style={{ fontFamily: "var(--font-serif)" }}>
            Today, EHVM curates a portfolio of high-quality apps with verified metrics — monthly recurring revenue, user acquisition data, platform details, and growth potential. Every listing is vetted. Every transaction is supported.
          </p>

          {/* YouTube - behind the scenes */}
          <YouTubeEmbed videoId="jNQXAC9IVRw" title="Behind the scenes at EHVM" />

          <p className="text-[16px] leading-[1.7] text-body" style={{ fontFamily: "var(--font-serif)" }}>
            Whether you&apos;re a developer ready to move on to your next project, or an entrepreneur looking to acquire a proven product — EHVM is where it happens.
          </p>

          {/* Tweet */}
          <TweetEmbed theme={theme} tweetUrl="https://x.com/ehvm/status/9876543210" />
        </div>

        {/* Social Links */}
        <div className="w-full mt-[30px] pt-[20px] border-t border-divider">
          <p className="text-[13px] text-caption mb-[12px]">Follow Evelin</p>
          <div className="flex gap-[8px] flex-wrap">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary flex h-[35px] items-center justify-center px-[15px] rounded-pill no-underline"
            >
              <span className="text-[13px] text-primary-text">Instagram</span>
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary flex h-[35px] items-center justify-center px-[15px] rounded-pill no-underline"
            >
              <span className="text-[13px] text-primary-text">X / Twitter</span>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary flex h-[35px] items-center justify-center px-[15px] rounded-pill no-underline"
            >
              <span className="text-[13px] text-primary-text">LinkedIn</span>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary flex h-[35px] items-center justify-center px-[15px] rounded-pill no-underline"
            >
              <span className="text-[13px] text-primary-text">TikTok</span>
            </a>
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
