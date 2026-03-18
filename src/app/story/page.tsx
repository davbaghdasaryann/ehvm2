import { redirect } from "next/navigation";
import { getPublishedStories } from "@/lib/data";

export const revalidate = 60;

export default async function StoryIndex() {
  const stories = await getPublishedStories();
  const first = stories[0];
  if (first) {
    redirect(`/story/${first.slug}`);
  }
  // Fallback — no published stories
  redirect("/contact");
}
