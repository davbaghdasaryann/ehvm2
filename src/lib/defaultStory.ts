import type { PersonStory } from "@/admin/types";

export const DEFAULT_EVELIN_STORY: PersonStory = {
  id: "evelin",
  slug: "evelin",
  name: "Evelin",
  published: true,
  headline: "The story behind EHVM Apps Capital",
  heroImage: "/images/evelin.png",
  blocks: [
    { id: "s1", type: "text", content: "EHVM Apps Capital was founded by Evelin Herrera with a simple idea: create a space where app builders and buyers can connect directly, without the noise. A marketplace built by someone who understands both sides of the table." },
    { id: "s2", type: "youtube", videoId: "dQw4w9WgXcQ", videoTitle: "EHVM Apps Capital — Introduction" },
    { id: "s3", type: "text", content: "Before starting EHVM, Evelin spent years building and scaling mobile apps across industries — from wellness to fintech. She saw firsthand how difficult it was for independent developers to find the right exit, and how hard it was for buyers to discover quality apps with real traction." },
    { id: "s4", type: "tweet", tweetUrl: "https://x.com/ehvm/status/1234567890" },
    { id: "s5", type: "quote", quoteText: "I kept meeting incredible builders who had no idea what their app was worth, and buyers who couldn't find what they were looking for. EHVM is the bridge.", quoteCite: "— Evelin Herrera, Founder" },
    { id: "s6", type: "text", content: "Today, EHVM curates a portfolio of high-quality apps with verified metrics — monthly recurring revenue, user acquisition data, platform details, and growth potential. Every listing is vetted. Every transaction is supported." },
    { id: "s7", type: "youtube", videoId: "jNQXAC9IVRw", videoTitle: "Behind the scenes at EHVM" },
    { id: "s8", type: "text", content: "Whether you're a developer ready to move on to your next project, or an entrepreneur looking to acquire a proven product — EHVM is where it happens." },
    { id: "s9", type: "tweet", tweetUrl: "https://x.com/ehvm/status/9876543210" },
  ],
  social: {
    instagram: "https://instagram.com",
    twitter: "https://x.com",
    linkedin: "https://linkedin.com",
    tiktok: "https://tiktok.com",
  },
  updatedAt: new Date().toISOString(),
};

/** @deprecated use DEFAULT_EVELIN_STORY */
export const DEFAULT_STORY = DEFAULT_EVELIN_STORY;
