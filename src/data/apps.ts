export type NotionPageBlock = {
  type:
    | "paragraph"
    | "heading_1"
    | "heading_2"
    | "heading_3"
    | "quote"
    | "divider"
    | "image"
    | "embed"
    | "bookmark"
    | "bulleted_list_item"
    | "numbered_list_item"
    | "toggle"
    | "callout"
    | "column_list"
    | "column";
  value?: string;
  src?: string;
  url?: string;
  links?: string[];
  children?: NotionPageBlock[];
};

export type App = {
  notionPageId?: string;
  slug: string;
  name: string;
  subtitle: string;
  icon: string;
  mrr: string;
  platform: string;
  platformEmoji: string;
  monetizationType?: string;
  hearingOffersStatus?: string;
  rating: number;
  followers?: string;
  category: string;
  about: string;
  highlights: {
    mrr: string;
    rating: string;
    ratingLabel: string;
    followers: string;
    followersLabel: string;
  };
  screenshotsImage: string;
  appStoreLink?: string;
  playStoreLink?: string;
  userAcquisition: {
    paid: {
      name: string;
      subtitle: string;
      icon: string;
      metric: string;
      metricStyle: "dark" | "light";
      link?: string;
    }[];
    organic: {
      name: string;
      subtitle: string;
      icon: string;
      metric: string;
      link?: string;
    }[];
  };
  opportunities: string[];
  developerCountry: string;
  developerFlag: string;
  faqs: { question: string; answer?: string }[];
  contact: {
    name: string;
    image: string;
    email: string;
    phone: string;
  };
  featured?: boolean;
  notionDbFields?: {
    label: string;
    value: string;
    url?: string;
  }[];
  notionDetailBlocks?: {
    type: "heading" | "text" | "quote" | "image" | "divider";
    value?: string;
    src?: string;
  }[];
  notionPageBlocks?: NotionPageBlock[];
};
