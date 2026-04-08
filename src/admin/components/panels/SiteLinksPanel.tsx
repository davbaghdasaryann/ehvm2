'use client'

import { useEffect } from 'react'
import { useAdminStore } from '@/admin/store/adminStore'
import { DEFAULT_SITE_LINKS } from '@/lib/defaultSiteLinks'

export default function SiteLinksPanel() {
  const s = useAdminStore()

  useEffect(() => {
    if (!s.siteLinks) {
      s.updateSiteLink('seeAllAppsUrl', DEFAULT_SITE_LINKS.seeAllAppsUrl)
      s.updateSiteLink('seeAllAppsLabel', DEFAULT_SITE_LINKS.seeAllAppsLabel)
      s.updateSiteLink('ndaUrl', DEFAULT_SITE_LINKS.ndaUrl)
      s.updateSiteLink('wantToBuyUrl', DEFAULT_SITE_LINKS.wantToBuyUrl)
      s.updateSiteLink('wantToSellUrl', DEFAULT_SITE_LINKS.wantToSellUrl)
      s.updateSiteLink('updatedAt', new Date().toISOString())
    }
  }, [])

  const links = s.siteLinks ?? DEFAULT_SITE_LINKS

  return (
    <div>
      <div className="panel-header">
        <div>
          <div className="panel-title">Site Links</div>
          <div className="panel-subtitle">Edit the key hyperlinks shown across the website</div>
        </div>
        <button className="btn btn-success btn-sm" onClick={() => void s.saveSiteLinks()}>💾 Save Links</button>
      </div>

      {/* Apps Gallery CTA */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Apps Page — CTA Button</div></div>
        <div className="card-body">
          <div className="field" style={{ marginBottom: 12 }}>
            <label className="field-label">Button Label</label>
            <input
              type="text"
              value={links.seeAllAppsLabel}
              onChange={e => s.updateSiteLink('seeAllAppsLabel', e.target.value)}
              placeholder="🔒 See all Apps & Numbers"
            />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label className="field-label">Button URL</label>
            <input
              type="text"
              value={links.seeAllAppsUrl}
              onChange={e => s.updateSiteLink('seeAllAppsUrl', e.target.value)}
              placeholder="https://... or mailto:..."
            />
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text3)' }}>
              Shown at the bottom of the /apps gallery page
            </div>
          </div>
          <div className="field">
            <label className="field-label">NDA Gate — URL</label>
            <input
              type="text"
              value={links.ndaUrl || ''}
              onChange={e => s.updateSiteLink('ndaUrl', e.target.value)}
              placeholder="https://docuseal.com/..."
            />
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text3)' }}>
              "Sign NDA and get full access" overlay on the apps gallery
            </div>
          </div>
        </div>
      </div>

      {/* Contact Page CTAs */}
      <div className="card">
        <div className="card-header"><div className="card-title">Contact Page — CTA Buttons</div></div>
        <div className="card-body">
          <div className="field" style={{ marginBottom: 12 }}>
            <label className="field-label">Want to Buy? — URL</label>
            <input
              type="text"
              value={links.wantToBuyUrl}
              onChange={e => s.updateSiteLink('wantToBuyUrl', e.target.value)}
              placeholder="mailto:evelin@ehvm.com?subject=..."
            />
          </div>
          <div className="field">
            <label className="field-label">Want to Sell? — URL</label>
            <input
              type="text"
              value={links.wantToSellUrl}
              onChange={e => s.updateSiteLink('wantToSellUrl', e.target.value)}
              placeholder="mailto:evelin@ehvm.com?subject=..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
