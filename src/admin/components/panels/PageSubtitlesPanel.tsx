'use client'
import { useAdminStore } from '@/admin/store/adminStore'

export default function PageSubtitlesPanel() {
  const s = useAdminStore()

  const pageSubtitles = s.pageSubtitles ?? { home: '', news: '', contact: '' }

  const handleSave = async () => {
    await s.savePageSubtitles()
  }

  return (
    <div>
      <div className="panel-header">
        <div>
          <div className="panel-title">Page Subtitles</div>
          <div className="panel-subtitle">Edit page header subtitles</div>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary"
          style={{
            padding: '6px 12px',
            fontSize: 13,
            borderRadius: 6,
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-text)',
            cursor: 'pointer'
          }}
        >
          Save
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Home Page</div>
        </div>
        <div className="card-body">
          <div className="field">
            <label className="field-label">Subtitle</label>
            <textarea
              value={pageSubtitles.home}
              onChange={e => s.updatePageSubtitle('home', e.target.value)}
              placeholder="(Leave empty for no subtitle)"
              style={{ width: '100%', minHeight: 60, fontFamily: 'var(--mono)', fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">News Page</div>
        </div>
        <div className="card-body">
          <div className="field">
            <label className="field-label">Subtitle</label>
            <textarea
              value={pageSubtitles.news}
              onChange={e => s.updatePageSubtitle('news', e.target.value)}
              placeholder="News, Stories, Events"
              style={{ width: '100%', minHeight: 60, fontFamily: 'var(--mono)', fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Contact Page</div>
        </div>
        <div className="card-body">
          <div className="field">
            <label className="field-label">Subtitle</label>
            <textarea
              value={pageSubtitles.contact}
              onChange={e => s.updatePageSubtitle('contact', e.target.value)}
              placeholder="Connecting app builders and buyers. Reach out to get started."
              style={{ width: '100%', minHeight: 60, fontFamily: 'var(--mono)', fontSize: 13 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
