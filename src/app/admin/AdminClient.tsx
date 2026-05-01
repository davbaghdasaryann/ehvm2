'use client'
import { useEffect, useState } from 'react'
import { useAdminStore } from '@/admin/store/adminStore'
import { PanelName } from '@/admin/types'
import AppsPanel from '@/admin/components/panels/AppsPanel'
import GuidePanel from '@/admin/components/panels/GuidePanel'
import NewsPanel from '@/admin/components/panels/NewsPanel'
import StoryPanel from '@/admin/components/panels/StoryPanel'
import SiteLinksPanel from '@/admin/components/panels/SiteLinksPanel'
import PageSubtitlesPanel from '@/admin/components/panels/PageSubtitlesPanel'
import MetaPanel from '@/admin/components/panels/MetaPanel'
import KpisPanel from '@/admin/components/panels/KpisPanel'
import FinancialsPanel from '@/admin/components/panels/FinancialsPanel'
import ChartsPanel from '@/admin/components/panels/ChartsPanel'
import PreviewPanel from '@/admin/components/panels/PreviewPanel'
import StoreIntelligencePanel from '@/admin/components/panels/StoreIntelligencePanel'
import {
  FunnelPanel, ProductPanel, MarketPanel,
  OpportunitiesPanel, ContactPanel, ImagesPanel
} from '@/admin/components/panels/MiscPanels'

const NAV_ITEMS: { panel: PanelName; icon: string; label: string; editOnly?: boolean }[] = [
  { panel: 'guide', icon: '🧭', label: 'Guide', editOnly: false },
  { panel: 'news', icon: '📰', label: 'News', editOnly: false },
  { panel: 'story', icon: '📖', label: 'Our Story', editOnly: false },
  { panel: 'sitelinks', icon: '🔗', label: 'Site Links', editOnly: false },
  { panel: 'pagesubtitles', icon: '✍', label: 'Page Subtitles', editOnly: false },
  { panel: 'meta', icon: '🏷', label: 'Meta & Identity', editOnly: true },
  { panel: 'kpis', icon: '📊', label: 'KPI Cards', editOnly: true },
  { panel: 'financials', icon: '💰', label: 'Financials', editOnly: true },
  { panel: 'charts', icon: '📈', label: 'Charts & Graphs', editOnly: true },
  { panel: 'funnel', icon: '🔻', label: 'Conversion Funnel', editOnly: true },
  { panel: 'product', icon: '🗺', label: 'Roadmap', editOnly: true },
  { panel: 'market', icon: '🌍', label: 'Market & Competitors', editOnly: true },
  { panel: 'opportunities', icon: '🚀', label: 'Opportunities', editOnly: true },
  { panel: 'contact', icon: '👤', label: 'Contact & Process', editOnly: true },
  { panel: 'images', icon: '🖼', label: 'Media & Images', editOnly: true },
  { panel: 'storeintelligence', icon: '🏪', label: 'Store Intelligence', editOnly: true },
  { panel: 'preview', icon: '👁', label: 'Live Preview', editOnly: true },
]

export default function AdminClient() {
  const s = useAdminStore()
  const hasApp = s.currentAppId !== null || s.metaName !== ''
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [statusTime, setStatusTime] = useState(() => new Date().toLocaleTimeString())

  useEffect(() => {
    const t = setInterval(() => setStatusTime(new Date().toLocaleTimeString()), 10000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      await useAdminStore.getState().hydrateFromServer()
      if (cancelled) return
      if (typeof window !== 'undefined' && window.location.pathname !== '/admin') return
      const state = useAdminStore.getState()
      if (state.apps.length === 0 && !state.metaName) {
        state.prefillSample()
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const panelComponent: Record<PanelName, React.ReactNode> = {
    guide: <GuidePanel />,
    apps: <AppsPanel />,
    news: <NewsPanel />,
    story: <StoryPanel />,
    sitelinks: <SiteLinksPanel />,
    pagesubtitles: <PageSubtitlesPanel />,
    meta: <MetaPanel />,
    kpis: <KpisPanel />,
    financials: <FinancialsPanel />,
    charts: <ChartsPanel />,
    funnel: <FunnelPanel />,
    product: <ProductPanel />,
    market: <MarketPanel />,
    opportunities: <OpportunitiesPanel />,
    contact: <ContactPanel />,
    images: <ImagesPanel />,
    storeintelligence: <StoreIntelligencePanel />,
    preview: <PreviewPanel />,
  }

  const chipApp = s.currentAppId ? s.apps.find(a => a.id === s.currentAppId) : null
  const chipName = s.metaName || chipApp?.meta?.name || 'New App'
  const chipTagline = s.metaTagline || chipApp?.meta?.tagline || ''
  const chipStatus = chipApp?.status || 'draft'
  const chipIcon = s.imgIcon || chipApp?.media?.icon || ''

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } finally {
      window.location.href = '/admin/login'
    }
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* TOPBAR */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="topbar-brand">
            EHVM Admin <span style={{ color: 'var(--text3)', fontWeight: 300 }}>/ App Manager</span>
          </div>
          {hasApp && (
            <div className="topbar-chip">
              <div className="chip-icon">
                {chipIcon
                  ? <img src={chipIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  : '📱'}
              </div>
              <div className="chip-name">{chipName}{chipTagline ? ` — ${chipTagline}` : ''}</div>
              <div className={`chip-status ${chipStatus}`}>{chipStatus}</div>
            </div>
          )}
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" disabled={!hasApp} onClick={() => s.setPanel('preview')}>👁 Preview</button>
          <button className="btn btn-ghost" disabled={!hasApp} onClick={s.exportJSON}>⬇ Export</button>
          <button className="btn btn-ghost" disabled={!hasApp} onClick={() => s.saveApp('draft')}>💾 Save Draft</button>
          <button className="btn btn-success" disabled={!hasApp} onClick={() => s.saveApp('published')}>🚀 Publish App</button>
          <button className="btn btn-ghost" onClick={handleLogout}>{isLoggingOut ? '…' : 'Log out'}</button>
        </div>
      </div>

      <div className="admin-layout">
        {/* SIDEBAR */}
        <nav className="sidebar">
          <div className="sidebar-section-label">Database</div>
          <button className={`nav-item${s.activePanel === 'apps' ? ' active' : ''}`} onClick={() => { s.setPanel('apps') }}>
            <span className="icon">📋</span> All Apps
          </button>
          <button className="nav-item" onClick={() => s.newApp()}>
            <span className="icon">➕</span> New App
          </button>

          <div className="sidebar-section-label">Content</div>
          {NAV_ITEMS.filter(item => !item.editOnly).map(item => (
            <button
              key={item.panel}
              className={`nav-item${s.activePanel === item.panel ? ' active' : ''}`}
              onClick={() => s.setPanel(item.panel)}
            >
              <span className="icon">{item.icon}</span> {item.label}
            </button>
          ))}

          <div className="sidebar-section-label" style={{ opacity: hasApp ? 1 : 0.4 }}>Edit App</div>
          {NAV_ITEMS.filter(item => item.editOnly).map(item => (
            <button
              key={item.panel}
              className={`nav-item${s.activePanel === item.panel ? ' active' : ''}${!hasApp ? ' disabled' : ''}`}
              onClick={() => hasApp && s.setPanel(item.panel)}
            >
              <span className="icon">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        {/* MAIN */}
        <main className="main-content">
          {panelComponent[s.activePanel]}
        </main>
      </div>

      {/* STATUS BAR */}
      <div className="status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className={`status-dot ${s.isDirty ? 'unsaved' : 'saved'}`} />
          <span>{s.isDirty ? 'Unsaved changes…' : `All changes saved · ${statusTime}`}</span>
        </div>
        <div>EHVM Admin · db.json · <span>{s.apps.length}</span> app(s) · <span>{s.news.length}</span> news</div>
      </div>

      {/* VALIDATION MODAL */}
      {s.validationModal.open && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) s.closeValidation() }}>
          <div className="modal-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>Can&apos;t publish yet</div>
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>Fix the issues below, or save as a draft instead.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {s.validationModal.failures.map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.15)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}
                  onClick={() => { s.closeValidation(); s.setPanel(f.panel) }}>
                  <span style={{ color: '#c0392b' }}>⚠</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#c0392b' }}>{f.label}</div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Go to: {f.panel}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa' }}>→</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={s.closeValidation}>Cancel</button>
              <button className="btn btn-ghost" style={{ borderColor: 'rgba(180,83,9,0.3)', color: '#b45309' }} onClick={() => { s.closeValidation(); s.saveApp('draft') }}>💾 Save as Draft</button>
              <button className="btn btn-primary" onClick={() => { s.closeValidation(); s.setPanel('meta') }}>Go Fix →</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div className={`toast${s.toast.visible ? ' show' : ''}`}>
        <span>{s.toast.icon}</span>
        <span>{s.toast.msg}</span>
      </div>
    </div>
  )
}
