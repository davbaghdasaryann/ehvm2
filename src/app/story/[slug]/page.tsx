import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoryBySlug, getPublishedStories } from "@/lib/data";
import StoryClient from "../StoryClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://ehvmcapital.com";

export const revalidate = 60;

export async function generateStaticParams() {
  const stories = await getPublishedStories();
  return stories.map((s) => ({ slug: s.slug }));
}

function absoluteUrl(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return undefined;
}

function storyDescription(story: NonNullable<Awaited<ReturnType<typeof getStoryBySlug>>>): string {
  const firstText = story.blocks.find((block) => block.type === "text" && block.content)?.content;
  const description = story.headline || firstText || `${story.name} at EHVM Apps Capital.`;
  return description.replace(/\s+/g, " ").trim().slice(0, 155);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story || !story.published) return {};

  const title = story.name;
  const description = storyDescription(story);
  const canonical = `${SITE_URL}/story/${story.slug}`;
  const image = absoluteUrl(story.heroImage);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "EHVM Apps Capital",
      type: "profile",
      images: image ? [{ url: image, alt: story.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PersonStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story || !story.published) notFound();
  const storyUrl = `${SITE_URL}/story/${story.slug}`;
  const storyJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: story.name,
    description: storyDescription(story),
    url: storyUrl,
    image: absoluteUrl(story.heroImage),
    worksFor: {
      "@type": "Organization",
      name: "EHVM Apps Capital",
      url: SITE_URL,
    },
    subjectOf: {
      "@type": "WebPage",
      url: storyUrl,
      creator: {
        "@type": "Organization",
        name: "Luphar",
        url: "https://luphar.org",
      },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storyJsonLd) }} />
      <StoryClient story={story} />
    </>
  );
}
