import { getArticles } from "@/lib/data";
import NewsListView from "./NewsListView";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function NewsAllPage() {
  const articles = await getArticles();

  return <NewsListView articles={articles} />;
}
