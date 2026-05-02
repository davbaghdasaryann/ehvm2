import type { Metadata } from "next";
import { getArticles } from "@/lib/data";
import NewsListView from "./NewsListView";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export const metadata: Metadata = {
  title: "All News",
  description: "Browse every EHVM Apps Capital article, event, and founder story.",
  alternates: {
    canonical: "/news/all",
  },
};

export default async function NewsAllPage() {
  const articles = await getArticles();

  return <NewsListView articles={articles} />;
}
