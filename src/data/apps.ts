import type { AppfiguresConfig } from "@/lib/appfigures-types";
import type { SeoFields } from "@/admin/types";

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
  screenshots?: { url: string; caption: string }[];
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
  opportunities: {
    icon: string;
    title: string;
    description: string;
    impactLabel?: string;
    impactValue?: string;
    impactSubtext?: string;
    impactColor?: string;
  }[];
  developerCountry: string;
  developerFlag: string;
  faqs: { question: string; answer?: string }[];
  contact: {
    name: string;
    image: string;
    email: string;
    phone: string;
    title?: string;
    calendarUrl?: string;
    ndaUrl?: string;
    processSteps?: {
      title: string;
      note: string;
      description: string;
    }[];
  };
  featured?: boolean;
  ndaRequired?: boolean;
  lockedFields?: string[];
  kpis?: {
    label: string;
    value: string;
    trend: string;
    sub: string;
    icon: string;
  }[];
  financials?: {
    mrr: string;
    arr: string;
    ltvCac: string;
    netMargin: string;
    yoyGrowth: string;
    askingMultiple: string;
    plRows: {
      label: string;
      amount: string;
      trend: string;
      notes: string;
      highlight: boolean;
      icon?: string;
    }[];
  };
  charts?: {
    type: string;
    title: string;
    subtitle: string;
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color: string;
    }[];
  }[];
  funnel?: {
    label: string;
    value: string;
    pct: string;
  }[];
  product?: {
    vision: string;
    roadmap: {
      status: "done" | "progress" | "planned";
      icon?: string;
      title: string;
      description: string;
    }[];
  };
  market?: {
    tam: string;
    sam: string;
    som: string;
    tamLabel: string;
    samLabel: string;
    year: string;
    competitors: {
      icon: string;
      logoUrl?: string;
      name: string;
      description: string;
      metricValue?: string;
      metricLabel?: string;
      appStoreRating: string;
      appStoreIcon?: string;
      googleStoreRating: string;
      googleStoreIcon?: string;
      link: string;
      isThisApp: boolean;
    }[];
    keywords: {
      keyword: string;
      store: string;
      country: string;
      rank: string;
    }[];
  };
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
  appfigures?: AppfiguresConfig;
  dataSources?: {
    kpis?: 'auto' | 'manual' | 'live';
    charts?: 'auto' | 'manual' | 'live';
    financials?: 'auto' | 'manual' | 'live';
    storeIntelligence?: 'auto' | 'manual' | 'off';
    reviews?: 'auto' | 'manual' | 'off';
    appfiguresSection?: boolean;
  };
  storeSignals?: { label: string; value: string; sub?: string }[];
  manualReviews?: { title: string; author: string; productName?: string; stars: number; store: string; review: string; date: string; version?: string }[];
  seo?: SeoFields;
};
