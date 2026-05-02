import type { Metadata } from "next";
import { getApps, getAppCategories, getSiteLinks } from "@/lib/data";
import AppsGallery from "./AppsGallery";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Apps for Sale",
  description: "Browse curated iOS and Android app acquisition opportunities listed by EHVM Apps Capital.",
  alternates: {
    canonical: "/apps",
  },
};

export default async function AllAppsPage() {
  const [apps, categories, siteLinks] = await Promise.all([
    getApps(),
    getAppCategories(),
    getSiteLinks(),
  ]);

  return <AppsGallery apps={apps} categories={categories} siteLinks={siteLinks} />;
}
