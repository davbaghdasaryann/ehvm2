'use client'

import ImageUploadButton from '@/admin/components/ImageUploadButton'
import { useAdminStore } from '@/admin/store/adminStore'
import type { NewsBlock } from '@/data/articles'

export default function NewsPanel() {
  const s = useAdminStore()

  const addNewsBlock = (itemId: string, type: NewsBlock['type']) => {
    const item = s.news.find(n => n.id === itemId)
    if (!item) return
    const blocks = item.blocks || []
    const newBlock: NewsBlock = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      imageUrl: '',
      imageCaption: '',
      quoteText: '',
      quoteCite: '',
    }
    s.updateNews(itemId, 'blocks', [...blocks, newBlock])
  }

  const removeNewsBlock = (itemId: string, blockId: string) => {
    const item = s.news.find(n => n.id === itemId)
    if (!item?.blocks) return
    s.updateNews(itemId, 'blocks', item.blocks.filter(b => b.id !== blockId))
  }

  const updateNewsBlock = (itemId: string, blockId: string, field: keyof NewsBlock, value: string) => {
    const item = s.news.find(n => n.id === itemId)
    if (!item?.blocks) return
    const blocks = item.blocks.map(b =>
      b.id === blockId ? { ...b, [field]: value } : b
    )
    s.updateNews(itemId, 'blocks', blocks)
  }

  return (
    <div>
      <div className="panel-header">
        <div>
          <div className="panel-title">News</div>
          <div className="panel-subtitle">Create articles with rich content blocks</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={s.addNews}>+ Add Article</button>
          <button className="btn btn-success btn-sm" onClick={() => void s.saveNews()}>💾 Save All</button>
        </div>
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

              <div className="form-grid form-grid-2" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label">Date</label>
                  <input type="date" value={item.date ? item.date.split('T')[0] : ''} onChange={e => s.updateNews(item.id, 'date', e.target.value ? new Date(e.target.value).toISOString() : '')} />
                </div>
                <div className="field">
                  <label className="field-label">Author</label>
                  <input type="text" value={item.author || ''} onChange={e => s.updateNews(item.id, 'author', e.target.value)} placeholder="Author name" />
                </div>
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">Hero Image</label>
                <div className="url-upload-row">
                  <input type="url" value={item.image || ''} onChange={e => s.updateNews(item.id, 'image', e.target.value)} placeholder="https://..." />
                  <ImageUploadButton
                    folder="news"
                    onUploaded={(url) => s.updateNews(item.id, 'image', url)}
                    onSuccess={(message) => s.showToast(message, '🖼')}
                    onError={(message) => s.showToast(message, '⚠️')}
                    label="Upload"
                  />
                </div>
              </div>

              <div className="form-grid form-grid-2" style={{ marginBottom: 16 }}>
                <div className="field">
                  <label className="field-label">Category</label>
                  <select value={item.category} onChange={e => s.updateNews(item.id, 'category', e.target.value)}>
                    <option value="Event">Event</option>
                    <option value="Story">Story</option>
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

              {/* Content Blocks */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>CONTENT BLOCKS ({item.blocks?.length || 0})</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => addNewsBlock(item.id, 'text')}>+ text</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => addNewsBlock(item.id, 'title')}>+ title</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => addNewsBlock(item.id, 'image')}>+ image</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => addNewsBlock(item.id, 'quote')}>+ quote</button>
                  </div>
                </div>

                {item.blocks && item.blocks.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '20px 0', fontFamily: 'var(--mono)', fontSize: 11 }}>
                    No blocks yet.
                  </div>
                )}

                {item.blocks && item.blocks.map((block, bi) => (
                  <div key={block.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'capitalize' }}>
                        {block.type === 'text' ? '📝 Text' : block.type === 'title' ? '📄 Title' : block.type === 'image' ? '🖼 Image' : '❝ Quote'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 'auto' }}>#{bi + 1}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={bi === 0}
                        onClick={() => s.moveNewsBlock(item.id, block.id, 'up')}
                        style={{ padding: '2px 7px' }}
                      >
                        ↑
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={bi === (item.blocks?.length || 0) - 1}
                        onClick={() => s.moveNewsBlock(item.id, block.id, 'down')}
                        style={{ padding: '2px 7px' }}
                      >
                        ↓
                      </button>
                      <button className="remove-btn" onClick={() => removeNewsBlock(item.id, block.id)}>×</button>
                    </div>

                    {(block.type === 'text' || block.type === 'title') && (
                      <textarea
                        rows={block.type === 'text' ? 3 : 2}
                        value={block.content || ''}
                        onChange={e => updateNewsBlock(item.id, block.id, 'content', e.target.value)}
                        placeholder={block.type === 'text' ? 'Text content. Use [link text](https://url) to add hyperlinks.' : 'Title text'}
                        style={{ width: '100%' }}
                      />
                    )}
                    {block.type === 'image' && (
                      <>
                        <div className="field" style={{ marginBottom: 8 }}>
                          <label className="field-label" style={{ fontSize: 12 }}>Image URL</label>
                          <div className="url-upload-row">
                            <input
                              type="url"
                              value={block.imageUrl || ''}
                              onChange={e => updateNewsBlock(item.id, block.id, 'imageUrl', e.target.value)}
                              placeholder="https://..."
                            />
                            <ImageUploadButton
                              folder="news"
                              onUploaded={(url) => updateNewsBlock(item.id, block.id, 'imageUrl', url)}
                              onSuccess={(message) => s.showToast(message, '🖼')}
                              onError={(message) => s.showToast(message, '⚠️')}
                              label="Upload"
                            />
                          </div>
                        </div>
                        <div className="field">
                          <label className="field-label" style={{ fontSize: 12 }}>Caption</label>
                          <textarea
                            rows={2}
                            value={block.imageCaption || ''}
                            onChange={e => updateNewsBlock(item.id, block.id, 'imageCaption', e.target.value)}
                            placeholder="Image caption"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </>
                    )}
                    {block.type === 'quote' && (
                      <>
                        <div className="field" style={{ marginBottom: 8 }}>
                          <label className="field-label" style={{ fontSize: 12 }}>Quote Text</label>
                          <textarea
                            rows={3}
                            value={block.quoteText || ''}
                            onChange={e => updateNewsBlock(item.id, block.id, 'quoteText', e.target.value)}
                            placeholder="Quote text"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div className="field">
                          <label className="field-label" style={{ fontSize: 12 }}>Attribution</label>
                          <input
                            type="text"
                            value={block.quoteCite || ''}
                            onChange={e => updateNewsBlock(item.id, block.id, 'quoteCite', e.target.value)}
                            placeholder="Quote attribution"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
