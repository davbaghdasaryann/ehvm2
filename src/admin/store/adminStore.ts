'use client'
import { create, persist } from '@/admin/store/storeCore'
import type {
  AdminNewsRecord, AppRecord, PanelName, PersonStory, StoryBlock, SiteLinks, PageSubtitles,
  KpiItem, FinRow, ChartItem, FunnelStep,
  RoadmapItem, Competitor, Keyword, Opportunity, ProcessStep, Screenshot, DataSourceMode,
  StoreSignalItem, ManualReviewItem
} from '@/admin/types'
import type { NewsBlock } from '@/data/articles'
import type { AppfiguresConfig, AppfiguresProductConfig } from '@/lib/appfigures-types'

const uid = () => Date.now() + Math.random()
const ADMIN_APPS_API = '/api/admin/apps'
const ADMIN_STORY_API = '/api/admin/story'
const ADMIN_SITE_LINKS_API = '/api/admin/site-links'
const ADMIN_PAGE_SUBTITLES_API = '/api/admin/page-subtitles'
const SAMPLE_APP_ID = 'sample_coachify'
const NEWS_ID_PREFIX = 'news_'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function fetchServerData(): Promise<{ apps: AppRecord[]; news: AdminNewsRecord[] }> {
  const response = await fetch(ADMIN_APPS_API, { method: 'GET', cache: 'no-store' })
  if (response.status === 401) {
    throw new Error('unauthorized')
  }
  if (!response.ok) return { apps: [], news: [] }
  const payload = (await response.json()) as { apps?: AppRecord[]; news?: AdminNewsRecord[] }
  return {
    apps: Array.isArray(payload.apps) ? payload.apps : [],
    news: Array.isArray(payload.news) ? payload.news : [],
  }
}

async function pushServerData(apps: AppRecord[], news: AdminNewsRecord[]): Promise<boolean> {
  const response = await fetch(ADMIN_APPS_API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apps, news }),
  })
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login'
    }
    return false
  }
  return response.ok
}

export const REQUIRED_FIELDS = [
  { key: 'meta.name', label: 'App Name', panel: 'meta' as PanelName, check: (a: AppRecord) => !!a.meta?.name?.trim() },
  { key: 'meta.description', label: 'Hero Description', panel: 'meta' as PanelName, check: (a: AppRecord) => !!a.meta?.description?.trim() },
  { key: 'meta.category', label: 'Category', panel: 'meta' as PanelName, check: (a: AppRecord) => !!a.meta?.category },
  { key: 'meta.badge', label: 'App Badge', panel: 'meta' as PanelName, check: (a: AppRecord) => !!a.meta?.badge?.trim() },
  { key: 'financials.mrr', label: 'MRR value', panel: 'financials' as PanelName, check: (a: AppRecord) => !!a.financials?.mrr?.trim() },
  { key: 'contact.name', label: 'Contact name', panel: 'contact' as PanelName, check: (a: AppRecord) => !!a.contact?.name?.trim() },
  { key: 'contact.email', label: 'Contact email', panel: 'contact' as PanelName, check: (a: AppRecord) => !!a.contact?.email?.trim() },
]

interface FormState {
  // meta
  metaName: string; metaTagline: string; metaDescription: string
  metaCategory: string; metaPlatforms: string; metaModel: string
  metaBadge: string; metaAsking: string; tags: string[]
  metaAppStoreUrl: string; metaPlayStoreUrl: string; metaWebsiteUrl: string
  metaDeveloperCountry: string; metaDeveloperFlag: string
  featured: boolean; ndaRequired: boolean
  lockedFields: string[]
  appfiguresDefaultCountry: string
  appfiguresAppleProductId: string
  appfiguresAppleAppId: string
  appfiguresGoogleProductId: string
  appfiguresGooglePackageName: string
  seoTitle: string
  seoDescription: string
  seoImage: string
  seoNoIndex: boolean
  // data sources
  dataSourceKpis: DataSourceMode
  dataSourceCharts: DataSourceMode
  dataSourceFinancials: DataSourceMode
  dataSourceStoreIntelligence: 'auto' | 'manual' | 'off'
  dataSourceReviews: 'auto' | 'manual' | 'off'
  showAppfiguresSection: boolean
  // financials
  finMrr: string; finArr: string; finLtvCac: string
  finMargin: string; finYoy: string; finMultiple: string
  // product
  productVision: string
  // market
  marketTam: string; marketSam: string; marketSom: string
  marketTamLabel: string; marketSamLabel: string; marketYear: string
  // contact
  contactName: string; contactTitle: string; contactEmail: string
  contactPhone: string; contactCal: string; contactNda: string; contactImage: string
  // media
  imgIcon: string; imgCover: string
  // arrays
  kpiItems: KpiItem[]
  finRows: FinRow[]
  charts: ChartItem[]
  funnelSteps: FunnelStep[]
  roadmapItems: RoadmapItem[]
  competitors: Competitor[]
  keywords: Keyword[]
  opportunities: Opportunity[]
  processSteps: ProcessStep[]
  screenshots: Screenshot[]
  storeSignals: StoreSignalItem[]
  manualReviews: ManualReviewItem[]
}

interface AdminStore extends FormState {
  // db
  apps: AppRecord[]
  news: AdminNewsRecord[]
  personStories: PersonStory[]
  siteLinks: SiteLinks | null
  pageSubtitles: PageSubtitles | null
  currentAppId: string | null
  activePanel: PanelName
  isDirty: boolean
  toast: { msg: string; icon: string; visible: boolean }
  validationModal: { open: boolean; failures: typeof REQUIRED_FIELDS }

  // actions
  setPanel: (p: PanelName) => void
  setField: <K extends keyof FormState>(key: K, val: FormState[K]) => void
  toggleLockedField: (field: string) => void
  markDirty: () => void
  markClean: () => void
  showToast: (msg: string, icon?: string) => void
  hydrateFromServer: () => Promise<void>

  // app actions
  newApp: () => void
  deselectApp: () => void
  loadApp: (id: string) => void
  saveApp: (status: 'draft' | 'published') => void
  deleteApp: (id: string) => void
  duplicateApp: (id: string) => void
  exportJSON: () => void
  addNews: () => void
  updateNews: (id: string, key: keyof AdminNewsRecord, value: string | boolean | NewsBlock[]) => void
  deleteNews: (id: string) => void
  moveNewsBlock: (itemId: string, blockId: string, direction: 'up' | 'down') => void
  saveNews: () => Promise<void>

  // site links actions
  fetchSiteLinks: () => Promise<void>
  saveSiteLinks: () => Promise<void>
  updateSiteLink: <K extends keyof SiteLinks>(key: K, val: SiteLinks[K]) => void

  // page subtitles actions
  fetchPageSubtitles: () => Promise<void>
  savePageSubtitles: () => Promise<void>
  updatePageSubtitle: (page: 'home' | 'news' | 'contact', text: string) => void

  // person story actions
  fetchPersonStories: () => Promise<void>
  savePersonStories: () => Promise<void>
  addPersonStory: () => void
  deletePersonStory: (id: string) => void
  updatePersonStoryField: (id: string, key: keyof PersonStory, val: PersonStory[keyof PersonStory]) => void
  addPersonStoryBlock: (storyId: string, type: StoryBlock['type']) => void
  removePersonStoryBlock: (storyId: string, blockId: string) => void
  updatePersonStoryBlock: (storyId: string, blockId: string, key: keyof StoryBlock, val: string) => void
  movePersonStoryBlock: (storyId: string, blockId: string, direction: 'up' | 'down') => void

  // appfigures actions
  loadAppfiguresData: () => Promise<void>

  // array actions
  addKpi: (data?: Partial<KpiItem>) => void
  removeKpi: (id: number) => void
  updateKpi: (id: number, key: keyof KpiItem, val: string) => void

  addFinRow: (data?: Partial<FinRow>) => void
  removeFinRow: (id: number) => void
  updateFinRow: (id: number, key: keyof FinRow, val: string | boolean) => void

  addChart: (data?: Partial<ChartItem>) => void
  removeChart: (id: number) => void
  updateChart: (id: number, key: keyof ChartItem, val: string) => void
  addDataset: (chartId: number) => void
  removeDataset: (chartId: number, di: number) => void
  updateDataset: (chartId: number, di: number, key: string, val: string) => void

  addFunnelStep: (data?: Partial<FunnelStep>) => void
  removeFunnelStep: (id: number) => void
  updateFunnelStep: (id: number, key: keyof FunnelStep, val: string) => void

  addRoadmapItem: (data?: Partial<RoadmapItem>) => void
  removeRoadmapItem: (id: number) => void
  updateRoadmap: (id: number, key: keyof RoadmapItem, val: string) => void

  addCompetitor: (data?: Partial<Competitor>) => void
  removeCompetitor: (id: number) => void
  updateCompetitor: (id: number, key: keyof Competitor, val: string | boolean) => void

  addKeyword: (data?: Partial<Keyword>) => void
  removeKeyword: (id: number) => void
  updateKeyword: (id: number, key: keyof Keyword, val: string) => void

  addOpportunity: (data?: Partial<Opportunity>) => void
  removeOpportunity: (id: number) => void
  updateOpportunity: (id: number, key: keyof Opportunity, val: string) => void

  addProcessStep: (data?: Partial<ProcessStep>) => void
  removeProcessStep: (id: number) => void
  updateProcessStep: (id: number, key: keyof ProcessStep, val: string) => void

  addScreenshot: (data?: Partial<Screenshot>) => void
  removeScreenshot: (id: number) => void
  updateScreenshot: (id: number, key: keyof Screenshot, val: string) => void

  addStoreSignal: (data?: Partial<StoreSignalItem>) => void
  removeStoreSignal: (id: number) => void
  updateStoreSignal: (id: number, key: keyof StoreSignalItem, val: string) => void

  addManualReview: (data?: Partial<ManualReviewItem>) => void
  removeManualReview: (id: number) => void
  updateManualReview: (id: number, key: keyof ManualReviewItem, val: string | number) => void

  closeValidation: () => void
  openValidation: (failures: typeof REQUIRED_FIELDS) => void

  collectApp: () => AppRecord
  prefillSample: () => void
}

const emptyForm: FormState = {
  metaName: '', metaTagline: '', metaDescription: '',
  metaCategory: 'Health & Fitness', metaPlatforms: 'iOS + Android', metaModel: 'AI / Subscription',
  metaBadge: '', metaAsking: '', tags: [],
  metaAppStoreUrl: '', metaPlayStoreUrl: '', metaWebsiteUrl: '',
  metaDeveloperCountry: '', metaDeveloperFlag: '',
  featured: false, ndaRequired: true, lockedFields: [],
  appfiguresDefaultCountry: 'US',
  appfiguresAppleProductId: '', appfiguresAppleAppId: '',
  appfiguresGoogleProductId: '', appfiguresGooglePackageName: '',
  seoTitle: '', seoDescription: '', seoImage: '', seoNoIndex: false,
  dataSourceKpis: 'auto', dataSourceCharts: 'auto', dataSourceFinancials: 'auto',
  dataSourceStoreIntelligence: 'auto', dataSourceReviews: 'auto', showAppfiguresSection: true,
  finMrr: '', finArr: '', finLtvCac: '', finMargin: '', finYoy: '', finMultiple: '',
  productVision: '',
  marketTam: '', marketSam: '', marketSom: '', marketTamLabel: '', marketSamLabel: '', marketYear: '',
  contactName: '', contactTitle: '', contactEmail: '', contactPhone: '', contactCal: '', contactNda: '', contactImage: '',
  imgIcon: '', imgCover: '',
  kpiItems: [], finRows: [], charts: [], funnelSteps: [],
  roadmapItems: [], competitors: [], keywords: [], opportunities: [],
  processSteps: [], screenshots: [], storeSignals: [], manualReviews: [],
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      ...emptyForm,
      apps: [],
      news: [],
      personStories: [],
      siteLinks: null,
      pageSubtitles: null,
      currentAppId: null,
      activePanel: 'apps',
      isDirty: false,
      toast: { msg: '', icon: '✓', visible: false },
      validationModal: { open: false, failures: [] },

      setPanel: (p) => set({ activePanel: p }),
      setField: (key, val) => { set({ [key]: val } as Partial<AdminStore>); get().markDirty() },
      toggleLockedField: (field) => set(s => ({
        lockedFields: s.lockedFields.includes(field)
          ? s.lockedFields.filter((item) => item !== field)
          : [...s.lockedFields, field],
        isDirty: true,
      })),
      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false }),

      showToast: (msg, icon = '✓') => {
        set({ toast: { msg, icon, visible: true } })
        setTimeout(() => set(s => ({ toast: { ...s.toast, visible: false } })), 2800)
      },

      hydrateFromServer: async () => {
        try {
          const serverData = await fetchServerData()
          const serverApps = serverData.apps
          const serverNews = serverData.news
          const localApps = get().apps
          const localNews = get().news

          if (serverApps.length === 0 && serverNews.length === 0 && (localApps.length > 0 || localNews.length > 0)) {
            const synced = await pushServerData(localApps, localNews)
            if (!synced) {
              get().showToast('Could not sync local apps to server', '⚠️')
            }
          } else {
            set({
              apps: serverApps,
              news: serverNews,
              currentAppId: serverApps.some((item) => item.id === get().currentAppId) ? get().currentAppId : null,
            })
          }

          // Also fetch person stories, site links, and page subtitles
          await Promise.all([get().fetchPersonStories(), get().fetchSiteLinks(), get().fetchPageSubtitles()])
        } catch (error) {
          if (error instanceof Error && error.message === 'unauthorized' && typeof window !== 'undefined') {
            window.location.href = '/admin/login'
            return
          }
          get().showToast('Failed to load server data', '⚠️')
        }
      },

      collectApp: () => {
        const s = get()
        const existing = s.apps.find(a => a.id === s.currentAppId)
        const appfiguresProducts: AppfiguresProductConfig[] = []
        const defaultCountry = s.appfiguresDefaultCountry.trim().toUpperCase() || 'US'

        if (s.appfiguresAppleProductId.trim() || s.appfiguresAppleAppId.trim()) {
          appfiguresProducts.push({
            id: 'apple',
            label: 'iOS',
            store: 'apple',
            productId: s.appfiguresAppleProductId.trim() || undefined,
            storeProductId: s.appfiguresAppleAppId.trim() || undefined,
            country: defaultCountry,
          })
        }

        if (s.appfiguresGoogleProductId.trim() || s.appfiguresGooglePackageName.trim()) {
          appfiguresProducts.push({
            id: 'google_play',
            label: 'Android',
            store: 'google_play',
            productId: s.appfiguresGoogleProductId.trim() || undefined,
            storeProductId: s.appfiguresGooglePackageName.trim() || undefined,
            country: defaultCountry,
          })
        }

        const appfigures: AppfiguresConfig | undefined =
          appfiguresProducts.length > 0 || defaultCountry !== 'US'
            ? { defaultCountry, products: appfiguresProducts }
            : undefined
        const seo = s.seoTitle.trim() || s.seoDescription.trim() || s.seoImage.trim() || s.seoNoIndex
          ? {
              title: s.seoTitle.trim(),
              description: s.seoDescription.trim(),
              image: s.seoImage.trim() || undefined,
              noIndex: s.seoNoIndex,
            }
          : undefined

        return {
          id: s.currentAppId || ('app_' + Date.now()),
          updatedAt: new Date().toISOString(),
          status: existing?.status || 'draft',
          featured: s.featured,
          ndaRequired: s.ndaRequired,
          lockedFields: s.lockedFields,
          meta: {
            name: s.metaName, tagline: s.metaTagline, description: s.metaDescription,
            category: s.metaCategory, platforms: s.metaPlatforms, model: s.metaModel,
            badge: s.metaBadge, askingPrice: s.metaAsking, tags: [...s.tags],
            appStoreUrl: s.metaAppStoreUrl || undefined,
            playStoreUrl: s.metaPlayStoreUrl || undefined,
            websiteUrl: s.metaWebsiteUrl || undefined,
            developerCountry: s.metaDeveloperCountry || undefined,
            developerFlag: s.metaDeveloperFlag || undefined,
          },
          kpis: s.kpiItems.map(({ id: _id, ...rest }) => rest),
          financials: {
            mrr: s.finMrr, arr: s.finArr, ltvCac: s.finLtvCac,
            netMargin: s.finMargin, yoyGrowth: s.finYoy, askingMultiple: s.finMultiple,
            plRows: s.finRows.map(({ id: _id, ...rest }) => rest)
          },
          charts: s.charts.map(({ id: _id, ...c }) => ({
            ...c,
            labels: c.labels.split(',').map((l: string) => l.trim()).filter(Boolean),
            datasets: c.datasets.map(ds => ({
              ...ds,
              data: ds.data.split(',').map((d: string) => parseFloat(d.trim())).filter((n: number) => !isNaN(n))
            }))
          })),
          funnel: s.funnelSteps.map(({ id: _id, ...rest }) => rest),
          product: { vision: s.productVision, roadmap: s.roadmapItems.map(({ id: _id, ...rest }) => rest) },
          market: {
            tam: s.marketTam, sam: s.marketSam, som: s.marketSom,
            tamLabel: s.marketTamLabel, samLabel: s.marketSamLabel, year: s.marketYear,
            competitors: s.competitors.map(({ id: _id, ...rest }) => rest),
            keywords: s.keywords.map(({ id: _id, ...rest }) => rest)
          },
          opportunities: s.opportunities.map(({ id: _id, ...rest }) => rest),
          storeSignals: s.storeSignals.map(({ id: _id, ...rest }) => rest),
          manualReviews: s.manualReviews.map(({ id: _id, ...rest }) => rest),
          contact: {
            name: s.contactName, title: s.contactTitle, email: s.contactEmail,
            phone: s.contactPhone, calendarUrl: s.contactCal, ndaUrl: s.contactNda,
            image: s.contactImage || undefined,
            processSteps: s.processSteps.map(({ id: _id, ...rest }) => rest)
          },
          media: {
            icon: s.imgIcon, cover: s.imgCover,
            screenshots: s.screenshots.map(({ id: _id, ...rest }) => rest)
          },
          appfigures,
          seo,
          dataSources: {
            kpis: s.dataSourceKpis,
            charts: s.dataSourceCharts,
            financials: s.dataSourceFinancials,
            storeIntelligence: s.dataSourceStoreIntelligence,
            reviews: s.dataSourceReviews,
            appfiguresSection: s.showAppfiguresSection,
          },
        }
      },

      saveApp: (status) => {
        const s = get()
        const app = s.collectApp()

        if (status === 'published') {
          const failures = REQUIRED_FIELDS.filter(f => !f.check(app))
          if (failures.length > 0) { s.openValidation(failures); return }
        }

        app.status = status
        app.updatedAt = new Date().toISOString()
        const apps = [...s.apps]
        const idx = apps.findIndex(a => a.id === app.id)
        if (idx >= 0) apps[idx] = app
        else apps.push(app)
        set({ apps, currentAppId: app.id, isDirty: false })
        void pushServerData(apps, s.news)
        s.showToast(status === 'published' ? 'App published! 🎉' : `Draft saved (${REQUIRED_FIELDS.filter(f => f.check(app)).length}/${REQUIRED_FIELDS.length} fields done)`, status === 'published' ? '🚀' : '💾')
      },

      deleteApp: (id) => {
        const s = get()
        const apps = s.apps.filter(a => a.id !== id)
        set({ apps, ...(s.currentAppId === id ? { currentAppId: null } : {}) })
        void pushServerData(apps, s.news)
        s.showToast('App deleted', '🗑')
      },

      duplicateApp: (id) => {
        const s = get()
        const source = s.apps.find(a => a.id === id)
        if (!source) return
        const copy: AppRecord = JSON.parse(JSON.stringify(source))
        copy.id = 'app_' + Date.now()
        copy.status = 'draft'
        copy.updatedAt = new Date().toISOString()
        copy.meta = { ...copy.meta, name: copy.meta.name + ' (Copy)' }
        const apps = [...s.apps, copy]
        set({ apps })
        void pushServerData(apps, s.news)
        s.showToast('App duplicated as draft', '📋')
      },

      deselectApp: () => set({ currentAppId: null, activePanel: 'apps' }),

      newApp: () => {
        set({ ...emptyForm, currentAppId: null, activePanel: 'meta', isDirty: false })
        get().showToast('New app — fill in the details', '✨')
      },

      loadApp: (id) => {
        const app = get().apps.find(a => a.id === id)
        if (!app) return
        const appleProduct = app.appfigures?.products.find((product) => product.store === 'apple')
        const googleProduct = app.appfigures?.products.find((product) => product.store === 'google_play')
        set({
          currentAppId: id, activePanel: 'meta', isDirty: false,
          metaName: app.meta.name, metaTagline: app.meta.tagline,
          metaDescription: app.meta.description, metaCategory: app.meta.category,
          metaPlatforms: app.meta.platforms, metaModel: app.meta.model,
          metaBadge: app.meta.badge, metaAsking: app.meta.askingPrice,
          metaAppStoreUrl: app.meta.appStoreUrl || '',
          metaPlayStoreUrl: app.meta.playStoreUrl || '',
          metaWebsiteUrl: app.meta.websiteUrl || '',
          metaDeveloperCountry: app.meta.developerCountry || '',
          metaDeveloperFlag: app.meta.developerFlag || '',
          tags: [...app.meta.tags],
          featured: app.featured, ndaRequired: app.ndaRequired, lockedFields: app.lockedFields || [],
          appfiguresDefaultCountry: app.appfigures?.defaultCountry || 'US',
          appfiguresAppleProductId: appleProduct?.productId || '',
          appfiguresAppleAppId: appleProduct?.storeProductId || '',
          appfiguresGoogleProductId: googleProduct?.productId || '',
          appfiguresGooglePackageName: googleProduct?.storeProductId || '',
          seoTitle: app.seo?.title || '',
          seoDescription: app.seo?.description || '',
          seoImage: app.seo?.image || '',
          seoNoIndex: Boolean(app.seo?.noIndex),
          dataSourceKpis: app.dataSources?.kpis || 'auto',
          dataSourceCharts: app.dataSources?.charts || 'auto',
          dataSourceFinancials: app.dataSources?.financials || 'auto',
          dataSourceStoreIntelligence: app.dataSources?.storeIntelligence || 'auto',
          dataSourceReviews: app.dataSources?.reviews || 'auto',
          showAppfiguresSection: app.dataSources?.appfiguresSection ?? true,
          finMrr: app.financials.mrr, finArr: app.financials.arr,
          finLtvCac: app.financials.ltvCac, finMargin: app.financials.netMargin,
          finYoy: app.financials.yoyGrowth, finMultiple: app.financials.askingMultiple,
          finRows: app.financials.plRows.map(r => ({ id: uid(), ...r })),
          kpiItems: app.kpis.map(k => ({ id: uid(), ...k })),
          charts: app.charts.map(c => ({ id: uid(), ...c, labels: Array.isArray(c.labels) ? c.labels.join(',') : c.labels, datasets: c.datasets.map(ds => ({ ...ds, data: Array.isArray(ds.data) ? ds.data.join(',') : ds.data })) })),
          funnelSteps: app.funnel.map(s => ({ id: uid(), ...s })),
          productVision: app.product.vision,
          roadmapItems: app.product.roadmap.map(r => ({ id: uid(), ...r })),
          marketTam: app.market.tam, marketSam: app.market.sam, marketSom: app.market.som,
          marketTamLabel: app.market.tamLabel, marketSamLabel: app.market.samLabel, marketYear: app.market.year,
          competitors: app.market.competitors.map(c => ({ id: uid(), ...c })),
          keywords: app.market.keywords.map(k => ({ id: uid(), ...k })),
          opportunities: app.opportunities.map(o => ({ id: uid(), ...o })),
          contactName: app.contact.name, contactTitle: app.contact.title,
          contactEmail: app.contact.email, contactPhone: app.contact.phone,
          contactCal: app.contact.calendarUrl, contactNda: app.contact.ndaUrl,
          contactImage: app.contact.image || '',
          processSteps: app.contact.processSteps.map(s => ({ id: uid(), ...s })),
          imgIcon: app.media.icon, imgCover: app.media.cover,
          screenshots: app.media.screenshots.map(s => ({ id: uid(), ...s })),
          storeSignals: (app.storeSignals ?? []).map(s => ({ id: uid(), label: s.label, value: s.value, sub: s.sub ?? '' })),
          manualReviews: (app.manualReviews ?? []).map(r => ({ id: uid(), title: r.title, author: r.author, productName: r.productName ?? '', stars: r.stars, store: r.store, review: r.review, date: r.date, version: r.version ?? '' })),
        })
        get().showToast('App loaded: ' + (app.meta.name || id), '📂')
      },

      exportJSON: () => {
        const { apps, news } = get()
        const json = JSON.stringify({ apps, news }, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'db.json'
        a.click()
        get().showToast('db.json downloaded!', '⬇')
      },

      addNews: () => {
        const s = get()
        const id = `${NEWS_ID_PREFIX}${Date.now()}`
        const next: AdminNewsRecord = {
          id,
          slug: id,
          title: 'New article',
          category: 'Event',
          published: false,
          updatedAt: new Date().toISOString(),
          date: new Date().toISOString(),
          blocks: [],
        }
        const news = [next, ...s.news]
        set({ news, isDirty: true })
      },
      updateNews: (id, key, value) => {
        const s = get()
        const news = s.news.map((item) => {
          if (item.id !== id) return item
          const next = { ...item, [key]: value } as AdminNewsRecord
          if (key === 'title' && typeof value === 'string') {
            next.slug = slugify(value) || next.slug || id
          }
          if (key === 'slug' && typeof value === 'string') {
            next.slug = slugify(value)
          }
          next.updatedAt = new Date().toISOString()
          return next
        })
        set({ news, isDirty: true })
      },
      deleteNews: (id) => {
        const s = get()
        const news = s.news.filter((item) => item.id !== id)
        set({ news, isDirty: true })
      },
      moveNewsBlock: (itemId, blockId, direction) => {
        const s = get()
        const news = s.news.map((item) => {
          if (item.id !== itemId || !item.blocks) return item
          const blocks = [...item.blocks]
          const idx = blocks.findIndex(b => b.id === blockId)
          if (idx < 0) return item
          const newIdx = direction === 'up' ? idx - 1 : idx + 1
          if (newIdx < 0 || newIdx >= blocks.length) return item
          ;[blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]]
          return { ...item, blocks, updatedAt: new Date().toISOString() }
        })
        set({ news, isDirty: true })
      },
      saveNews: async () => {
        const news = get().news
        try {
          const res = await fetch(ADMIN_APPS_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apps: get().apps, news }),
          })
          if (res.status === 401) { window.location.href = '/admin/login'; return }
          if (res.ok) {
            get().showToast('Articles saved!', '📰')
            set({ isDirty: false })
          } else {
            get().showToast('Failed to save articles', '⚠️')
          }
        } catch {
          get().showToast('Failed to save articles', '⚠️')
        }
      },

      openValidation: (failures) => set({ validationModal: { open: true, failures } }),
      closeValidation: () => set({ validationModal: { open: false, failures: [] } }),

      fetchSiteLinks: async () => {
        try {
          const res = await fetch(ADMIN_SITE_LINKS_API, { method: 'GET', cache: 'no-store' })
          if (res.status === 401) { window.location.href = '/admin/login'; return }
          if (!res.ok) return
          const payload = await res.json() as { siteLinks?: SiteLinks }
          if (payload.siteLinks) set({ siteLinks: payload.siteLinks })
        } catch { /* silent */ }
      },
      saveSiteLinks: async () => {
        const siteLinks = get().siteLinks
        if (!siteLinks) return
        try {
          const res = await fetch(ADMIN_SITE_LINKS_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteLinks }),
          })
          if (res.status === 401) { window.location.href = '/admin/login'; return }
          if (res.ok) {
            get().showToast('Site links saved!', '🔗')
            set({ isDirty: false })
          } else {
            get().showToast('Failed to save site links', '⚠️')
          }
        } catch {
          get().showToast('Failed to save site links', '⚠️')
        }
      },
      updateSiteLink: (key, val) => {
        const links = get().siteLinks
        set({ siteLinks: { ...(links ?? {} as SiteLinks), [key]: val }, isDirty: true })
      },

      fetchPageSubtitles: async () => {
        try {
          const res = await fetch(ADMIN_PAGE_SUBTITLES_API, { method: 'GET', cache: 'no-store' })
          if (res.status === 401) { window.location.href = '/admin/login'; return }
          if (!res.ok) return
          const payload = await res.json() as { pageSubtitles?: { home: string; news: string; contact: string } }
          if (payload.pageSubtitles) set({ pageSubtitles: payload.pageSubtitles })
        } catch { /* silent */ }
      },
      savePageSubtitles: async () => {
        const pageSubtitles = get().pageSubtitles
        if (!pageSubtitles) return
        try {
          const res = await fetch(ADMIN_PAGE_SUBTITLES_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageSubtitles }),
          })
          if (res.status === 401) { window.location.href = '/admin/login'; return }
          if (res.ok) {
            get().showToast('Page subtitles saved!', '✓')
            set({ isDirty: false })
          } else {
            get().showToast('Failed to save page subtitles', '⚠️')
          }
        } catch {
          get().showToast('Failed to save page subtitles', '⚠️')
        }
      },
      updatePageSubtitle: (page, text) => {
        const subtitles = get().pageSubtitles ?? { home: '', news: '', contact: '' }
        set({ pageSubtitles: { ...subtitles, [page]: text }, isDirty: true })
      },

      fetchPersonStories: async () => {
        try {
          const res = await fetch(ADMIN_STORY_API, { method: 'GET', cache: 'no-store' })
          if (res.status === 401) { window.location.href = '/admin/login'; return }
          if (!res.ok) return
          const payload = await res.json() as { stories?: PersonStory[] }
          if (Array.isArray(payload.stories)) set({ personStories: payload.stories })
        } catch {
          // silent
        }
      },
      savePersonStories: async () => {
        const personStories = get().personStories
        try {
          const res = await fetch(ADMIN_STORY_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stories: personStories }),
          })
          if (res.status === 401) { window.location.href = '/admin/login'; return }
          if (res.ok) {
            get().showToast('Stories saved!', '📖')
            set({ isDirty: false })
          } else {
            get().showToast('Failed to save stories', '⚠️')
          }
        } catch {
          get().showToast('Failed to save stories', '⚠️')
        }
      },
      addPersonStory: () => {
        const id = `person_${Date.now()}`
        const next: PersonStory = {
          id,
          slug: id,
          name: 'New Person',
          published: false,
          headline: '',
          heroImage: '',
          blocks: [],
          social: { instagram: '', twitter: '', linkedin: '', tiktok: '' },
          updatedAt: new Date().toISOString(),
        }
        set(s => ({ personStories: [...s.personStories, next], isDirty: true }))
      },
      deletePersonStory: (id) => {
        set(s => ({ personStories: s.personStories.filter(p => p.id !== id), isDirty: true }))
      },
      updatePersonStoryField: (id, key, val) => {
        set(s => ({
          personStories: s.personStories.map(p => {
            if (p.id !== id) return p
            const next = { ...p, [key]: val, updatedAt: new Date().toISOString() } as PersonStory
            if (key === 'name' && typeof val === 'string') {
              next.slug = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || next.slug
            }
            return next
          }),
          isDirty: true,
        }))
      },
      addPersonStoryBlock: (storyId, type) => {
        const blockId = `sb_${Date.now()}`
        set(s => ({
          personStories: s.personStories.map(p =>
            p.id !== storyId ? p : { ...p, blocks: [...p.blocks, { id: blockId, type }] }
          ),
          isDirty: true,
        }))
      },
      removePersonStoryBlock: (storyId, blockId) => {
        set(s => ({
          personStories: s.personStories.map(p =>
            p.id !== storyId ? p : { ...p, blocks: p.blocks.filter(b => b.id !== blockId) }
          ),
          isDirty: true,
        }))
      },
      updatePersonStoryBlock: (storyId, blockId, key, val) => {
        set(s => ({
          personStories: s.personStories.map(p =>
            p.id !== storyId ? p : { ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, [key]: val } : b) }
          ),
          isDirty: true,
        }))
      },
      movePersonStoryBlock: (storyId, blockId, direction) => {
        set(s => ({
          personStories: s.personStories.map(p => {
            if (p.id !== storyId) return p
            const blocks = [...p.blocks]
            const idx = blocks.findIndex(b => b.id === blockId)
            if (idx < 0) return p
            const newIdx = direction === 'up' ? idx - 1 : idx + 1
            if (newIdx < 0 || newIdx >= blocks.length) return p
            ;[blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]]
            return { ...p, blocks }
          }),
          isDirty: true,
        }))
      },

      loadAppfiguresData: async () => {
        const s = get()
        const defaultCountry = s.appfiguresDefaultCountry.trim().toUpperCase() || 'US'
        const products: AppfiguresProductConfig[] = []

        if (s.appfiguresAppleProductId.trim() || s.appfiguresAppleAppId.trim()) {
          products.push({
            id: 'apple',
            label: 'iOS',
            store: 'apple',
            productId: s.appfiguresAppleProductId.trim() || undefined,
            storeProductId: s.appfiguresAppleAppId.trim() || undefined,
            country: defaultCountry,
          })
        }

        if (s.appfiguresGoogleProductId.trim() || s.appfiguresGooglePackageName.trim()) {
          products.push({
            id: 'google_play',
            label: 'Android',
            store: 'google_play',
            productId: s.appfiguresGoogleProductId.trim() || undefined,
            storeProductId: s.appfiguresGooglePackageName.trim() || undefined,
            country: defaultCountry,
          })
        }

        if (products.length === 0) {
          s.showToast('Configure Appfigures products first', '⚠️')
          return
        }

        try {
          const response = await fetch('/api/admin/appfigures/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: { defaultCountry, products } }),
          })

          if (response.status === 401) {
            window.location.href = '/admin/login'
            return
          }

          if (!response.ok) {
            const error = await response.json()
            s.showToast(error.error || 'Failed to load Appfigures data', '⚠️')
            return
          }

          const result = await response.json()
          const data = result.data

          // Populate KPIs
          if (data.kpis && data.kpis.length > 0) {
            const kpis = data.kpis.map((kpi: any) => ({
              id: uid(),
              label: kpi.label || '',
              value: kpi.value || '',
              trend: kpi.trend || '',
              sub: kpi.sub || '',
              icon: kpi.icon || '',
            }))
            set({ kpiItems: kpis, isDirty: true })
          }

          // Populate Financial Cards
          if (data.financialCards && data.financialCards.length > 0) {
            data.financialCards.forEach((card: any) => {
              const key = card.key.toLowerCase()
              if (key === 'mrr') set({ finMrr: card.value })
              else if (key === 'arr') set({ finArr: card.value })
              else if (key.includes('ltv')) set({ finLtvCac: card.value })
              else if (key.includes('margin')) set({ finMargin: card.value })
            })
            set({ isDirty: true })
          }

          // Populate Charts
          if (data.charts && data.charts.length > 0) {
            const charts = data.charts.map((chart: any) => ({
              id: uid(),
              type: chart.type || 'line',
              title: chart.title || '',
              subtitle: chart.subtitle || '',
              labels: Array.isArray(chart.labels) ? chart.labels.join(',') : '',
              datasets: (chart.datasets || []).map((ds: any) => ({
                label: ds.label || '',
                data: Array.isArray(ds.data) ? ds.data.join(',') : '',
                color: ds.color || '#1a1a1a',
              })),
            }))
            set({ charts, isDirty: true })
          }

          s.showToast('Loaded data from Appfigures!', '📊')
        } catch (error) {
          s.showToast('Failed to load Appfigures data', '⚠️')
          console.error('Appfigures load error:', error)
        }
      },

      // KPIs
      addKpi: (d = {}) => set(s => ({ kpiItems: [...s.kpiItems, { id: uid(), label: '', value: '', trend: '', sub: '', icon: '', ...d }], isDirty: true })),
      removeKpi: (id) => set(s => ({ kpiItems: s.kpiItems.filter(k => k.id !== id), isDirty: true })),
      updateKpi: (id, key, val) => set(s => ({ kpiItems: s.kpiItems.map(k => k.id === id ? { ...k, [key]: val } : k), isDirty: true })),

      // FinRows
      addFinRow: (d = {}) => set(s => ({ finRows: [...s.finRows, { id: uid(), label: '', amount: '', trend: '', notes: '', highlight: false, icon: '', ...d }], isDirty: true })),
      removeFinRow: (id) => set(s => ({ finRows: s.finRows.filter(r => r.id !== id), isDirty: true })),
      updateFinRow: (id, key, val) => set(s => ({ finRows: s.finRows.map(r => r.id === id ? { ...r, [key]: val } : r), isDirty: true })),

      // Charts
      addChart: (d = {}) => set(s => ({ charts: [...s.charts, { id: uid(), type: 'line', title: '', subtitle: '', labels: '', datasets: [{ label: '', data: '', color: '#1a1a1a' }], ...d }], isDirty: true })),
      removeChart: (id) => set(s => ({ charts: s.charts.filter(c => c.id !== id), isDirty: true })),
      updateChart: (id, key, val) => set(s => ({ charts: s.charts.map(c => c.id === id ? { ...c, [key]: val } : c), isDirty: true })),
      addDataset: (chartId) => set(s => ({ charts: s.charts.map(c => c.id === chartId ? { ...c, datasets: [...c.datasets, { label: '', data: '', color: '#888' }] } : c), isDirty: true })),
      removeDataset: (chartId, di) => set(s => ({ charts: s.charts.map(c => c.id === chartId && c.datasets.length > 1 ? { ...c, datasets: c.datasets.filter((_, i) => i !== di) } : c), isDirty: true })),
      updateDataset: (chartId, di, key, val) => set(s => ({ charts: s.charts.map(c => c.id === chartId ? { ...c, datasets: c.datasets.map((ds, i) => i === di ? { ...ds, [key]: val } : ds) } : c), isDirty: true })),

      // Funnel
      addFunnelStep: (d = {}) => set(s => ({ funnelSteps: [...s.funnelSteps, { id: uid(), label: '', value: '', pct: '', ...d }], isDirty: true })),
      removeFunnelStep: (id) => set(s => ({ funnelSteps: s.funnelSteps.filter(f => f.id !== id), isDirty: true })),
      updateFunnelStep: (id, key, val) => set(s => ({ funnelSteps: s.funnelSteps.map(f => f.id === id ? { ...f, [key]: val } : f), isDirty: true })),

      // Roadmap
      addRoadmapItem: (d = {}) => set(s => ({ roadmapItems: [...s.roadmapItems, { id: uid(), status: 'done', icon: '', title: '', description: '', ...d }], isDirty: true })),
      removeRoadmapItem: (id) => set(s => ({ roadmapItems: s.roadmapItems.filter(r => r.id !== id), isDirty: true })),
      updateRoadmap: (id, key, val) => set(s => ({ roadmapItems: s.roadmapItems.map(r => r.id === id ? { ...r, [key]: val } : r), isDirty: true })),

      // Competitors
      addCompetitor: (d = {}) => set(s => ({ competitors: [...s.competitors, { id: uid(), icon: '💪', logoUrl: '', name: '', description: '', metricValue: '', metricLabel: '', appStoreRating: '', googleStoreRating: '', link: '', isThisApp: false, ...d }], isDirty: true })),
      removeCompetitor: (id) => set(s => ({ competitors: s.competitors.filter(c => c.id !== id), isDirty: true })),
      updateCompetitor: (id, key, val) => set(s => ({ competitors: s.competitors.map(c => c.id === id ? { ...c, [key]: val } : c), isDirty: true })),

      // Keywords
      addKeyword: (d = {}) => set(s => ({ keywords: [...s.keywords, { id: uid(), keyword: '', store: '', country: '', rank: '', ...d }], isDirty: true })),
      removeKeyword: (id) => set(s => ({ keywords: s.keywords.filter(k => k.id !== id), isDirty: true })),
      updateKeyword: (id, key, val) => set(s => ({ keywords: s.keywords.map(k => k.id === id ? { ...k, [key]: val } : k), isDirty: true })),

      // Opportunities
      addOpportunity: (d = {}) => set(s => ({ opportunities: [...s.opportunities, { id: uid(), icon: '🚀', title: '', description: '', impactLabel: 'Impact', impactValue: '', impactSubtext: '', impactColor: '', ...d }], isDirty: true })),
      removeOpportunity: (id) => set(s => ({ opportunities: s.opportunities.filter(o => o.id !== id), isDirty: true })),
      updateOpportunity: (id, key, val) => set(s => ({ opportunities: s.opportunities.map(o => o.id === id ? { ...o, [key]: val } : o), isDirty: true })),

      // ProcessSteps
      addProcessStep: (d = {}) => set(s => ({ processSteps: [...s.processSteps, { id: uid(), title: '', note: '', description: '', ...d }], isDirty: true })),
      removeProcessStep: (id) => set(s => ({ processSteps: s.processSteps.filter(p => p.id !== id), isDirty: true })),
      updateProcessStep: (id, key, val) => set(s => ({ processSteps: s.processSteps.map(p => p.id === id ? { ...p, [key]: val } : p), isDirty: true })),

      // Screenshots
      addScreenshot: (d = {}) => set(s => ({ screenshots: [...s.screenshots, { id: uid(), url: '', caption: '', ...d }], isDirty: true })),
      removeScreenshot: (id) => set(s => ({ screenshots: s.screenshots.filter(sc => sc.id !== id), isDirty: true })),
      updateScreenshot: (id, key, val) => set(s => ({ screenshots: s.screenshots.map(sc => sc.id === id ? { ...sc, [key]: val } : sc), isDirty: true })),

      // Store Signals
      addStoreSignal: (d = {}) => set(s => ({ storeSignals: [...s.storeSignals, { id: uid(), label: '', value: '', sub: '', ...d }], isDirty: true })),
      removeStoreSignal: (id) => set(s => ({ storeSignals: s.storeSignals.filter(sg => sg.id !== id), isDirty: true })),
      updateStoreSignal: (id, key, val) => set(s => ({ storeSignals: s.storeSignals.map(sg => sg.id === id ? { ...sg, [key]: val } : sg), isDirty: true })),

      // Manual Reviews
      addManualReview: (d = {}) => set(s => ({ manualReviews: [...s.manualReviews, { id: uid(), title: '', author: '', productName: '', stars: 5, store: 'apple', review: '', date: new Date().toISOString().split('T')[0], version: '', ...d }], isDirty: true })),
      removeManualReview: (id) => set(s => ({ manualReviews: s.manualReviews.filter(r => r.id !== id), isDirty: true })),
      updateManualReview: (id, key, val) => set(s => ({ manualReviews: s.manualReviews.map(r => r.id === id ? { ...r, [key]: val } : r), isDirty: true })),

      prefillSample: () => {
        const existingSample = get().apps.find((app) =>
          app.id === SAMPLE_APP_ID || app.meta?.name?.trim().toLowerCase() === 'coachify',
        )

        if (existingSample) {
          const dedupedApps = get().apps.filter(
            (app) =>
              app.id === existingSample.id ||
              app.meta?.name?.trim().toLowerCase() !== 'coachify',
          )
          if (dedupedApps.length !== get().apps.length) {
            set({ apps: dedupedApps })
            void pushServerData(dedupedApps, get().news)
          }
          get().loadApp(existingSample.id)
          return
        }

        set({
          ...emptyForm,
          currentAppId: SAMPLE_APP_ID,
          metaName: 'Coachify', metaTagline: 'AI Workouts',
          metaDescription: 'A profitable, top-rated AI fitness coaching app with $70K MRR, 14 months of proven paid UA, and a loyal subscriber base — ready for a strategic acquirer to unlock its next phase of scale.',
          metaBadge: 'Acquisition Opportunity · Health & Fitness',
          metaAsking: 'Asking ~3.5× ARR',
          metaAppStoreUrl: 'https://apps.apple.com',
          metaPlayStoreUrl: 'https://play.google.com/store',
          metaWebsiteUrl: 'https://ehvm.com',
          metaDeveloperCountry: 'United States',
          metaDeveloperFlag: '🇺🇸',
          tags: ['iOS + Android', 'AI / Subscription', 'Profitable', 'Health & Fitness', 'Asking ~3.5× ARR'],
          ndaRequired: true, featured: false,
          seoTitle: 'Coachify - AI Workouts App Acquisition | EHVM',
          seoDescription: 'Profitable AI fitness coaching app with $70K MRR, top-rated store presence, proven paid acquisition, and clear growth upside for a strategic buyer.',
          seoImage: '',
          seoNoIndex: false,
          finMrr: '$70,000', finArr: '$840K', finLtvCac: '4.2×', finMargin: '~43%', finYoy: '22%', finMultiple: '3.5× ARR',
          finRows: [
            { id: 1, label: 'Gross Revenue', amount: '$756,000', trend: '↑ 22%', notes: 'App Store + Play Store gross', highlight: true },
            { id: 2, label: 'Store Fees (30%)', amount: '−$226,800', trend: '—', notes: 'Apple + Google platform fees', highlight: false },
            { id: 3, label: 'Paid UA Spend', amount: '−$168,000', trend: '—', notes: 'Meta ads (profitable)', highlight: false },
            { id: 4, label: 'Infrastructure & Tools', amount: '−$36,000', trend: '—', notes: 'OpenAI API, Firebase, hosting', highlight: false },
            { id: 5, label: 'Net Revenue / Profit', amount: '$325,200', trend: '↑ 18%', notes: '~43% net margin', highlight: true },
          ],
          kpiItems: [
            { id: 10, label: 'Monthly Recurring Revenue', value: '$70K', trend: '↑ 22% YoY', sub: '$840K ARR', icon: '📈' },
            { id: 11, label: 'iOS App Rating', value: '4.7 ⭐', trend: 'Top 5% category', sub: '1,249 ranked keywords', icon: '⭐' },
            { id: 12, label: 'Social Following', value: '110K', trend: '99.7K TikTok', sub: 'Combined channels', icon: '📱' },
          ],
          charts: [
            { id: 20, type: 'line', title: 'Monthly Revenue Growth', subtitle: 'MRR since launch · Feb 2024 – Mar 2025', labels: 'Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,Jan,Feb,Mar', datasets: [{ label: 'MRR ($)', data: '12000,16500,21000,26000,32000,38000,44000,50000,55000,59000,63000,66000,68000,70000', color: '#1a1a1a' }] },
            { id: 21, type: 'bar', title: 'Revenue by Platform', subtitle: 'iOS vs Android split', labels: 'iOS,Android', datasets: [{ label: 'Share %', data: '71,29', color: '#2d7a4f' }] },
            { id: 22, type: 'doughnut', title: 'Revenue by Geography', subtitle: 'Top markets by revenue share', labels: 'United States,United Kingdom,Canada,Australia,Germany,Other', datasets: [{ label: '% Revenue', data: '52,14,10,8,6,10', color: '#1a1a1a' }] },
          ],
          funnelSteps: [
            { id: 30, label: 'Impressions', value: '2.4M / mo', pct: '100%' },
            { id: 31, label: 'App Page Views', value: '912K', pct: '38%' },
            { id: 32, label: 'Installs', value: '528K', pct: '22%' },
            { id: 33, label: 'Trial Started', value: '336K', pct: '14%' },
            { id: 34, label: 'Paid Subscriber', value: '84K', pct: '6%' },
          ],
          productVision: 'Coachify is building the AI personal trainer for the 80% of gym-goers who train without a coach — delivering professional-grade programming, nutrition guidance, and real-time feedback at a fraction of the cost of a human trainer.',
          roadmapItems: [
            { id: 40, status: 'done', icon: '🧬', title: 'AI Personalized Workout Plans', description: 'Dynamic plan generator based on goals, experience, and available equipment.' },
            { id: 41, status: 'done', icon: '🍏', title: 'Calorie & Macro Tracking', description: 'Integrated diet monitoring with food database and AI-generated meal suggestions.' },
            { id: 42, status: 'progress', icon: '🧪', title: 'Paywall A/B Testing Framework', description: 'Systematic testing of pricing, trial lengths, and offer structures.' },
            { id: 43, status: 'planned', icon: '⌚', title: 'Apple Watch & Wearables Integration', description: 'Real-time heart rate, HRV, and recovery data feeding into adaptive programming engine.' },
          ],
          marketTam: '$15.3B', marketSam: '$2.1B', marketSom: '$210M',
          marketTamLabel: 'Global fitness apps', marketSamLabel: 'AI fitness apps', marketYear: '2025',
          competitors: [
            { id: 50, icon: '🏋️', name: 'Coachify', description: 'AI-personalized workouts + nutrition', metricValue: '$70K', metricLabel: 'Monthly Recurring Revenue', appStoreRating: '4.7', googleStoreRating: '', link: '', isThisApp: true },
            { id: 51, icon: '💪', name: 'Fitbod', description: 'Adaptive strength training', metricValue: '$30M+', metricLabel: 'Monthly Recurring Revenue', appStoreRating: '4.8', googleStoreRating: '', link: '', isThisApp: false },
            { id: 52, icon: '📊', name: 'MyFitnessPal', description: 'Nutrition tracking', metricValue: '200M+', metricLabel: 'Users', appStoreRating: '4.7', googleStoreRating: '', link: '', isThisApp: false },
          ],
          keywords: [
            { id: 60, keyword: 'ai workout planner', store: 'App Store', country: 'US', rank: '#2' },
            { id: 61, keyword: 'gym workout plan', store: 'App Store', country: 'US', rank: '#4' },
            { id: 62, keyword: 'ai personal trainer', store: 'App Store', country: 'US', rank: '#3' },
            { id: 63, keyword: 'workout tracker app', store: 'App Store', country: 'US', rank: '#9' },
          ],
          opportunities: [
            { id: 70, icon: '💳', title: 'Paywall A/B Testing', description: 'Test variations of pricing tiers, trial lengths, and offer structures. Estimated 30-60% improvement in early-signal conversion. 1-2 developer weeks for MVP.', impactLabel: 'Impact', impactValue: '15-20%', impactSubtext: 'conversion uplift', impactColor: '#B000FF' },
            { id: 71, icon: '🔥', title: 'TikTok Organic + Paid UA', description: 'Short-form transformation content and paid ads on the platform. Creator-led UGC demos net 200K+ views per post. Targeting 18-34, US English, gym and nutrition interests.', impactLabel: 'Impact', impactValue: 'High', impactSubtext: '~10K installs/month at $1.50 CPI', impactColor: '#FF170D' },
            { id: 72, icon: '🍎', title: 'Apple Search Ads', description: 'The app ranks for 1,249 keywords but runs zero paid Apple Search Ads. Conservatively, allocating 5-10K/month to the lowest CAC installs. Discovery campaigns recommended.', impactLabel: 'Opportunity', impactValue: 'Lowest CAC', impactSubtext: 'channel in App Store', impactColor: '#00C853' },
            { id: 73, icon: '🌍', title: 'International Expansion', description: 'App is predominantly English-language. Localization into Spanish, Portuguese, French, German. Targeting LATAM and Europe. Translations + locale-aware CTAs. Expect new revenue CAC to mirror US performance.', impactLabel: 'Growth Stat', impactValue: 'Near-zero COGS', impactSubtext: 'due to pure digital delivery', impactColor: '#2F00FF' },
          ],
          contactName: 'Evelin Herrera', contactTitle: 'M&A Advisor · EHVM Mobile',
          contactEmail: 'hi@evelinherrera.com', contactPhone: '+1 415 798 1766',
          contactImage: '/images/evelin.png',
          contactCal: 'https://cal.com/evelin-herrera-pvrkn4/15min',
          contactNda: 'https://docuseal.com/d/J7NtDuzmxCfh7E',
          processSteps: [
            { id: 80, title: 'Sign Mutual NDA', note: '~2 minutes', description: 'A mutual non-disclosure agreement unlocks access to advertising metrics, full cohort data, tech stack documentation, and detailed financials.' },
            { id: 81, title: 'Data Room Access & Discovery', note: '30 days', description: 'Includes Meta Ads Manager screenshots, RevenueCat dashboards, cohort exports, P&L, tech stack, and seller Q&A.' },
            { id: 82, title: 'Submit Offer', note: 'Rolling basis', description: 'Best and final offers accepted on a rolling basis. We recommend acting within 14 days — active buyer interest is high.' },
            { id: 83, title: 'Negotiation & Closing', note: '14–21 days', description: 'Closing via escrow. Asset transfer includes App Store & Play Store accounts, source code, brand assets, social handles, and 30-day seller support.' },
          ],
          activePanel: 'meta',
          isDirty: false,
        })
        // Auto-save sample as a draft so it shows in the apps list
        get().saveApp('draft')
        get().showToast('Sample app loaded — Coachify', '✨')
      },
    }),
    {
      name: 'ehvm_admin',
      partialize: (state) => ({ apps: state.apps, news: state.news, personStories: state.personStories, siteLinks: state.siteLinks, pageSubtitles: state.pageSubtitles }),
    }
  )
)
