export interface KpiItem {
  id: number
  label: string
  value: string
  trend: string
  sub: string
  icon: string
}

export interface FinRow {
  id: number
  label: string
  amount: string
  trend: string
  notes: string
  highlight: boolean
}

export interface ChartDataset {
  label: string
  data: string
  color: string
}

export interface ChartItem {
  id: number
  type: string
  title: string
  subtitle: string
  labels: string
  datasets: ChartDataset[]
}

export interface FunnelStep {
  id: number
  label: string
  value: string
  pct: string
}

export interface RoadmapItem {
  id: number
  status: 'done' | 'progress' | 'planned'
  title: string
  description: string
}

export interface Competitor {
  id: number
  icon: string
  name: string
  description: string
  rating: string
  isThisApp: boolean
}

export interface Keyword {
  id: number
  keyword: string
  volume: string
  rank: string
}

export interface Opportunity {
  id: number
  icon: string
  title: string
  description: string
}

export interface ProcessStep {
  id: number
  title: string
  note: string
  description: string
}

export interface Screenshot {
  id: number
  url: string
  caption: string
}

export interface AppRecord {
  id: string
  updatedAt: string
  status: 'draft' | 'published'
  featured: boolean
  ndaRequired: boolean
  meta: {
    name: string
    tagline: string
    description: string
    category: string
    platforms: string
    model: string
    badge: string
    askingPrice: string
    tags: string[]
    appStoreUrl?: string
    playStoreUrl?: string
    websiteUrl?: string
    developerCountry?: string
    developerFlag?: string
  }
  kpis: Omit<KpiItem, 'id'>[]
  financials: {
    mrr: string
    arr: string
    ltvCac: string
    netMargin: string
    yoyGrowth: string
    askingMultiple: string
    plRows: Omit<FinRow, 'id'>[]
  }
  charts: (Omit<ChartItem, 'id' | 'datasets' | 'labels'> & { labels: string[]; datasets: { label: string; data: number[]; color: string }[] })[]
  funnel: Omit<FunnelStep, 'id'>[]
  product: {
    vision: string
    roadmap: Omit<RoadmapItem, 'id'>[]
  }
  market: {
    tam: string
    sam: string
    som: string
    tamLabel: string
    samLabel: string
    year: string
    competitors: Omit<Competitor, 'id'>[]
    keywords: Omit<Keyword, 'id'>[]
  }
  opportunities: Omit<Opportunity, 'id'>[]
  contact: {
    name: string
    title: string
    email: string
    phone: string
    calendarUrl: string
    ndaUrl: string
    image?: string
    processSteps: Omit<ProcessStep, 'id'>[]
  }
  media: {
    icon: string
    cover: string
    screenshots: Omit<Screenshot, 'id'>[]
  }
}

export interface AdminNewsRecord {
  id: string
  slug: string
  title: string
  subtitle: string
  quote: string
  image: string
  buttonLabel: string
  buttonUrl: string
  category: 'Event' | 'Story'
  featured: boolean
  published: boolean
  updatedAt: string
}

export interface AdminDatabase {
  apps: AppRecord[]
  news: AdminNewsRecord[]
}

export type PanelName =
  | 'guide'
  | 'apps'
  | 'news'
  | 'meta'
  | 'kpis'
  | 'financials'
  | 'charts'
  | 'funnel'
  | 'product'
  | 'market'
  | 'opportunities'
  | 'contact'
  | 'images'
  | 'preview'
