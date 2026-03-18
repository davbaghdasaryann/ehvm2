'use client'
import { useRef } from 'react'
import { useAdminStore } from '@/admin/store/adminStore'

export default function MetaPanel() {
  const s = useAdminStore()
  const tagInputRef = useRef<HTMLInputElement>(null)

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = input.value.trim().replace(/,$/, '')
      if (val && !s.tags.includes(val)) {
        s.setField('tags', [...s.tags, val])
      }
      input.value = ''
    }
    if (e.key === 'Backspace' && input.value === '' && s.tags.length) {
      s.setField('tags', s.tags.slice(0, -1))
    }
  }

  const removeTag = (i: number) => {
    s.setField('tags', s.tags.filter((_, idx) => idx !== i))
  }

  const appStatus = s.currentAppId ? s.apps.find(a => a.id === s.currentAppId)?.status || 'draft' : 'draft'

  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Meta & Identity</div><div className="panel-subtitle">Core app identity, badge, tags, and asking price</div></div>
      </div>

      {/* App Identity */}
      <div className="card">
        <div className="card-header"><div className="card-title">App Identity</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-2" style={{ marginBottom: 14 }}>
            <div className="field">
              <label className="field-label">App Name</label>
              <input type="text" value={s.metaName} onChange={e => s.setField('metaName', e.target.value)} placeholder="e.g. Coachify" />
            </div>
            <div className="field">
              <label className="field-label">Tagline</label>
              <input type="text" value={s.metaTagline} onChange={e => s.setField('metaTagline', e.target.value)} placeholder="e.g. AI Workouts" />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">Hero Description</label>
            <textarea value={s.metaDescription} onChange={e => s.setField('metaDescription', e.target.value)} rows={3} placeholder="Compelling one-paragraph description for acquirers..." />
          </div>
          <div className="form-grid form-grid-3">
            <div className="field">
              <label className="field-label">Category</label>
              <select value={s.metaCategory} onChange={e => s.setField('metaCategory', e.target.value)}>
                {['Utilities','Health & Fitness','Photo & Video','Education','Graphics & Design','Lifestyle','Reference','Productivity','Social Networking','Entertainment','Finance','Food & Drink','Portfolio','Personalization','Business','Music','Navigation','Shopping','Sports','Tools','Weather','Books','Kids','Gaming'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Platforms</label>
              <select value={s.metaPlatforms} onChange={e => s.setField('metaPlatforms', e.target.value)}>
                {['iOS + Android','iOS Only','Android Only','Web + Mobile'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Business Model</label>
              <select value={s.metaModel} onChange={e => s.setField('metaModel', e.target.value)}>
                {['AI / Subscription','Subscription','Freemium','One-Time Purchase','Ad-Supported','B2B SaaS','IAP','IAP + AdMon','AdMon'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Badge */}
      <div className="card">
        <div className="card-header"><div className="card-title">App Badge</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-2">
            <div className="field">
              <label className="field-label">Badge Label</label>
              <input type="text" value={s.metaBadge} onChange={e => s.setField('metaBadge', e.target.value)} placeholder="e.g. Acquisition Opportunity · Health & Fitness" />
            </div>
            <div className="field">
              <label className="field-label">Asking Price Label</label>
              <input type="text" value={s.metaAsking} onChange={e => s.setField('metaAsking', e.target.value)} placeholder="e.g. Asking ~3.5× ARR" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Store & Web Links</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-3">
            <div className="field">
              <label className="field-label">App Store URL</label>
              <input type="url" value={s.metaAppStoreUrl} onChange={e => s.setField('metaAppStoreUrl', e.target.value)} placeholder="https://apps.apple.com/..." />
            </div>
            <div className="field">
              <label className="field-label">Play Store URL</label>
              <input type="url" value={s.metaPlayStoreUrl} onChange={e => s.setField('metaPlayStoreUrl', e.target.value)} placeholder="https://play.google.com/..." />
            </div>
            <div className="field">
              <label className="field-label">Website URL</label>
              <input type="url" value={s.metaWebsiteUrl} onChange={e => s.setField('metaWebsiteUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Developer Country</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-2">
            <div className="field">
              <label className="field-label">Country</label>
              <input type="text" value={s.metaDeveloperCountry} onChange={e => s.setField('metaDeveloperCountry', e.target.value)} placeholder="United States" />
            </div>
            <div className="field">
              <label className="field-label">Flag Emoji</label>
              <input type="text" value={s.metaDeveloperFlag} onChange={e => s.setField('metaDeveloperFlag', e.target.value)} placeholder="🇺🇸" />
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="card">
        <div className="card-header"><div className="card-title">Tags</div></div>
        <div className="card-body">
          <div className="field">
            <label className="field-label">App Tags</label>
            <div className="tag-editor" onClick={() => tagInputRef.current?.focus()}>
              {s.tags.map((t, i) => (
                <span key={i} className="tag-pill">
                  {t} <span className="remove" onClick={() => removeTag(i)}>×</span>
                </span>
              ))}
              <input ref={tagInputRef} type="text" className="tag-input-field" placeholder="Type tag + Enter…" onKeyDown={handleTagKey} />
            </div>
            <div className="field-hint">Press Enter or comma to add. Click × to remove.</div>
          </div>
        </div>
      </div>

      {/* Status & Visibility */}
      <div className="card">
        <div className="card-header"><div className="card-title">Status & Visibility</div></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="toggle-field">
            <div><div className="toggle-label">Featured</div><div className="toggle-desc">Show in featured/highlighted apps</div></div>
            <button className={`toggle${s.featured ? ' on' : ''}`} onClick={() => s.setField('featured', !s.featured)} />
          </div>
          <div className="toggle-field">
            <div><div className="toggle-label">NDA Required</div><div className="toggle-desc">Show NDA gate before full data room</div></div>
            <button className={`toggle${s.ndaRequired ? ' on' : ''}`} onClick={() => s.setField('ndaRequired', !s.ndaRequired)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.55)', fontSize: 12, color: '#666' }}>
            <span>{appStatus === 'published' ? '🟢' : '📝'}</span>
            <span>Status: <strong style={{ color: appStatus === 'published' ? '#2d7a4f' : '#111' }}>{appStatus}</strong> — use <strong style={{ color: '#2d7a4f' }}>Publish App</strong> in the topbar to go live</span>
          </div>
        </div>
      </div>
    </div>
  )
}
