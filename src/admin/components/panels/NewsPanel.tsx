'use client'

import ImageUploadButton from '@/admin/components/ImageUploadButton'
import { useAdminStore } from '@/admin/store/adminStore'

export default function NewsPanel() {
  const s = useAdminStore()

  return (
    <div>
      <div className="panel-header">
        <div>
          <div className="panel-title">News</div>
          <div className="panel-subtitle">Image, title, subtitle, quote, and button content for website news pages</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={s.addNews}>+ Add Article</button>
      </div>

      {s.news.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px', fontFamily: 'var(--mono)', fontSize: '12px' }}>
            No news entries yet. Add your first article.
          </div>
        </div>
      ) : (
        s.news.map((item, index) => (
          <div key={item.id} className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">Article #{index + 1} <span className="card-badge">{item.published ? 'published' : 'draft'}</span></div>
              <button className="remove-btn" onClick={() => s.deleteNews(item.id)}>×</button>
            </div>
            <div className="card-body">
              <div className="form-grid form-grid-2" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label">Title</label>
                  <input type="text" value={item.title} onChange={e => s.updateNews(item.id, 'title', e.target.value)} placeholder="Article title" />
                </div>
                <div className="field">
                  <label className="field-label">Slug</label>
                  <input type="text" value={item.slug} onChange={e => s.updateNews(item.id, 'slug', e.target.value)} placeholder="article-slug" />
                </div>
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">Image URL</label>
                <div className="url-upload-row">
                  <input type="url" value={item.image} onChange={e => s.updateNews(item.id, 'image', e.target.value)} placeholder="https://..." />
                  <ImageUploadButton
                    folder="news"
                    onUploaded={(url) => s.updateNews(item.id, 'image', url)}
                    onSuccess={(message) => s.showToast(message, '🖼')}
                    onError={(message) => s.showToast(message, '⚠️')}
                    label="Upload"
                  />
                </div>
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">Subtitle</label>
                <textarea rows={2} value={item.subtitle} onChange={e => s.updateNews(item.id, 'subtitle', e.target.value)} placeholder="Short subtitle text" />
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">Quote</label>
                <textarea rows={3} value={item.quote} onChange={e => s.updateNews(item.id, 'quote', e.target.value)} placeholder="Quote text" />
              </div>

              <div className="form-grid form-grid-2" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label">Button Label</label>
                  <input type="text" value={item.buttonLabel} onChange={e => s.updateNews(item.id, 'buttonLabel', e.target.value)} placeholder="Read story" />
                </div>
                <div className="field">
                  <label className="field-label">Button URL</label>
                  <input type="url" value={item.buttonUrl} onChange={e => s.updateNews(item.id, 'buttonUrl', e.target.value)} placeholder="https://..." />
                </div>
              </div>

              <div className="form-grid form-grid-3">
                <div className="field">
                  <label className="field-label">Category</label>
                  <select value={item.category} onChange={e => s.updateNews(item.id, 'category', e.target.value)}>
                    <option value="Event">Event</option>
                    <option value="Story">Story</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Featured</label>
                  <select value={item.featured ? 'true' : 'false'} onChange={e => s.updateNews(item.id, 'featured', e.target.value === 'true')}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Published</label>
                  <select value={item.published ? 'true' : 'false'} onChange={e => s.updateNews(item.id, 'published', e.target.value === 'true')}>
                    <option value="false">Draft</option>
                    <option value="true">Published</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
