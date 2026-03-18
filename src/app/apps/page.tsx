import { getApps, getAppCategories, getSiteLinks } from "@/lib/data";
import AppsGallery from "./AppsGallery";

export const revalidate = 300;

export default async function AllAppsPage() {
  const [apps, categories, siteLinks] = await Promise.all([
    getApps(),
    getAppCategories(),
    getSiteLinks(),
  ]);

  return <AppsGallery apps={apps} categories={categories} siteLinks={siteLinks} />;
}
