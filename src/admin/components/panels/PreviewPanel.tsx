'use client'
import { useState, useEffect, useRef } from 'react'
import { useAdminStore } from '@/admin/store/adminStore'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildListingHTMLHelper } = require('@/admin/lib/buildListingHTML')

export default function PreviewPanel() {
  const s = useAdminStore()
  const [tab, setTab] = useState<'listing' | 'json'>('listing')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const app = s.collectApp()

  useEffect(() => {
    if (tab === 'listing' && iframeRef.current) {
      const html = buildListingHTMLHelper(app)
      const doc = iframeRef.current.contentDocument
      if (doc) { doc.open(); doc.write(html); doc.close() }
    }
  })

  return (
    <div>
      <div className="panel-header">
        <div>
          <div className="panel-title">Listing Preview</div>
          <div className="panel-subtitle">Live render of the published listing page</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setTab('listing')} style={tab === 'listing' ? { borderColor: '#111', color: '#444' } : {}}>👁 Listing</button>
          <button className="btn btn-ghost" onClick={() => setTab('json')} style={tab === 'json' ? { borderColor: '#111', color: '#444' } : {}}>{'{ } JSON'}</button>
          <button className="btn btn-success" onClick={s.exportJSON}>⬇ Export db.json</button>
        </div>
      </div>
      {tab === 'listing' && (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
          <iframe ref={iframeRef} style={{ width: '100%', height: '80vh', border: 'none', display: 'block' }} title="Listing Preview" />
        </div>
      )}
      {tab === 'json' && (
        <div className="card">
          <div className="card-body">
            <pre className="json-preview">{JSON.stringify({ apps: s.apps }, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
