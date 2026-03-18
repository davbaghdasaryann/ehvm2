import { notFound } from "next/navigation";
import { getStoryBySlug, getPublishedStories } from "@/lib/data";
import StoryClient from "../StoryClient";

export const revalidate = 60;

export async function generateStaticParams() {
  const stories = await getPublishedStories();
  return stories.map((s) => ({ slug: s.slug }));
}

export default async function PersonStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story || !story.published) notFound();
  return <StoryClient story={story} />;
}
