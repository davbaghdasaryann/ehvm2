import { getApps, getAppCategories } from "@/lib/data";
import AppsGallery from "./AppsGallery";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export default async function AllAppsPage() {
  const apps = await getApps();
  const categories = await getAppCategories();

  return <AppsGallery apps={apps} categories={categories} />;
}
