'use client'

import { useEffect } from 'react'
import { useAdminStore } from '@/admin/store/adminStore'
import { DEFAULT_EVELIN_STORY } from '@/lib/defaultStory'
import ImageUploadButton from '@/admin/components/ImageUploadButton'
import type { StoryBlock } from '@/admin/types'

const BLOCK_LABELS: Record<StoryBlock['type'], string> = {
  text: '📝 Text',
  youtube: '▶️ YouTube',
  tweet: '🐦 Tweet',
  quote: '❝ Quote',
}

export default function StoryPanel() {
  const s = useAdminStore()

  // Seed with Evelin's default if empty
  useEffect(() => {
    if (s.personStories.length === 0) {
      s.addPersonStory
      // Replace with Evelin's default
      const seed = { ...DEFAULT_EVELIN_STORY, updatedAt: new Date().toISOString() }
      // We set directly via internal action
      useAdminStore.setState({ personStories: [seed] })
    }
  }, [])

  return (
    <div>
      <div className="panel-header">
        <div>
          <div className="panel-title">Our Story</div>
          <div className="panel-subtitle">One page per person — each gets their own /story/[slug] URL</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={s.addPersonStory}>+ Add Person</button>
          <button className="btn btn-success btn-sm" onClick={() => void s.savePersonStories()}>💾 Save All</button>
        </div>
      </div>

      {s.personStories.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px', fontFamily: 'var(--mono)', fontSize: 12 }}>
            No stories yet. Add a person above.
          </div>
        </div>
      ) : (
        s.personStories.map((person, pIdx) => (
          <div key={person.id} className="card" style={{ marginBottom: 16 }}>
            {/* Card header */}
            <div className="card-header">
              <div className="card-title">
                {person.name || 'Unnamed'} <span className="card-badge">{person.published ? 'published' : 'draft'}</span>
                <span style={{ fontWeight: 400, color: 'var(--text3)', fontSize: 11, marginLeft: 8 }}>/story/{person.slug || '…'}</span>
              </div>
              <button className="remove-btn" onClick={() => s.deletePersonStory(person.id)}>×</button>
            </div>

            <div className="card-body">
              {/* Identity */}
              <div className="form-grid form-grid-3" style={{ marginBottom: 12 }}>
                <div className="field">
                  <label className="field-label">Name</label>
                  <input
                    type="text"
                    value={person.name}
                    onChange={e => s.updatePersonStoryField(person.id, 'name', e.target.value)}
                    placeholder="Evelin"
                  />
                </div>
                <div className="field">
                  <label className="field-label">Slug (URL)</label>
                  <input
                    type="text"
                    value={person.slug}
                    onChange={e => s.updatePersonStoryField(person.id, 'slug', e.target.value)}
                    placeholder="evelin"
                  />
                </div>
                <div className="field">
                  <label className="field-label">Published</label>
                  <select
                    value={person.published ? 'true' : 'false'}
                    onChange={e => s.updatePersonStoryField(person.id, 'published', e.target.value === 'true')}
                  >
                    <option value="false">Draft</option>
                    <option value="true">Published</option>
                  </select>
                </div>
              </div>

              {/* Headline + Hero */}
              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">Headline</label>
                <input
                  type="text"
                  value={person.headline}
                  onChange={e => s.updatePersonStoryField(person.id, 'headline', e.target.value)}
                  placeholder="The story behind…"
                />
              </div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label className="field-label">Hero Image</label>
                <div className="url-upload-row">
                  <input
                    type="text"
                    value={person.heroImage}
                    onChange={e => s.updatePersonStoryField(person.id, 'heroImage', e.target.value)}
                    placeholder="/images/evelin.png or https://…"
                  />
                  <ImageUploadButton
                    folder="story"
                    onUploaded={url => s.updatePersonStoryField(person.id, 'heroImage', url)}
                    onSuccess={msg => s.showToast(msg, '🖼')}
                    onError={msg => s.showToast(msg, '⚠️')}
                    label="Upload"
                  />
                </div>
              </div>

              {/* Content blocks */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>CONTENT BLOCKS ({person.blocks.length})</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    {(['text', 'youtube', 'tweet', 'quote'] as StoryBlock['type'][]).map(t => (
                      <button key={t} className="btn btn-ghost btn-sm" onClick={() => s.addPersonStoryBlock(person.id, t)}>+ {t}</button>
                    ))}
                  </div>
                </div>

                {person.blocks.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '20px 0', fontFamily: 'var(--mono)', fontSize: 11 }}>
                    No blocks yet.
                  </div>
                )}

                {person.blocks.map((block, bIdx) => (
                  <div key={block.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{BLOCK_LABELS[block.type]}</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 'auto' }}>#{bIdx + 1}</span>
                      <button className="btn btn-ghost btn-sm" disabled={bIdx === 0} onClick={() => s.movePersonStoryBlock(person.id, block.id, 'up')} style={{ padding: '2px 7px' }}>↑</button>
                      <button className="btn btn-ghost btn-sm" disabled={bIdx === person.blocks.length - 1} onClick={() => s.movePersonStoryBlock(person.id, block.id, 'down')} style={{ padding: '2px 7px' }}>↓</button>
                      <button className="remove-btn" onClick={() => s.removePersonStoryBlock(person.id, block.id)}>×</button>
                    </div>

                    {block.type === 'text' && (
                      <textarea rows={3} value={block.content || ''} onChange={e => s.updatePersonStoryBlock(person.id, block.id, 'content', e.target.value)} placeholder="Paragraph text…" />
                    )}
                    {block.type === 'youtube' && (
                      <div className="form-grid form-grid-2">
                        <div className="field">
                          <label className="field-label">Video ID</label>
                          <input type="text" value={block.videoId || ''} onChange={e => s.updatePersonStoryBlock(person.id, block.id, 'videoId', e.target.value)} placeholder="dQw4w9WgXcQ" />
                        </div>
                        <div className="field">
                          <label className="field-label">Title (optional)</label>
                          <input type="text" value={block.videoTitle || ''} onChange={e => s.updatePersonStoryBlock(person.id, block.id, 'videoTitle', e.target.value)} placeholder="Video title" />
                        </div>
                      </div>
                    )}
                    {block.type === 'tweet' && (
                      <div className="field">
                        <label className="field-label">Tweet URL</label>
                        <input type="url" value={block.tweetUrl || ''} onChange={e => s.updatePersonStoryBlock(person.id, block.id, 'tweetUrl', e.target.value)} placeholder="https://x.com/user/status/…" />
                      </div>
                    )}
                    {block.type === 'quote' && (
                      <>
                        <div className="field" style={{ marginBottom: 8 }}>
                          <label className="field-label">Quote Text</label>
                          <textarea rows={2} value={block.quoteText || ''} onChange={e => s.updatePersonStoryBlock(person.id, block.id, 'quoteText', e.target.value)} placeholder="Quote text…" />
                        </div>
                        <div className="field">
                          <label className="field-label">Citation</label>
                          <input type="text" value={block.quoteCite || ''} onChange={e => s.updatePersonStoryBlock(person.id, block.id, 'quoteCite', e.target.value)} placeholder="— Name, Title" />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Social links */}
              <div className="form-grid form-grid-2">
                {(['instagram', 'twitter', 'linkedin', 'tiktok'] as const).map(key => (
                  <div key={key} className="field">
                    <label className="field-label" style={{ textTransform: 'capitalize' }}>{key === 'twitter' ? 'X / Twitter' : key}</label>
                    <input
                      type="url"
                      value={person.social[key]}
                      onChange={e => s.updatePersonStoryField(person.id, 'social', { ...person.social, [key]: e.target.value })}
                      placeholder={`https://${key}.com/…`}
                    />
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
