'use client'
import ImageUploadButton from '@/admin/components/ImageUploadButton'
import { useAdminStore } from '@/admin/store/adminStore'
import AiGenerateButton from '@/admin/components/AiGenerateButton'

export function FunnelPanel() {
  const s = useAdminStore()
  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Conversion Funnel</div><div className="panel-subtitle">Impression → Install → Trial → Paid funnel steps</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => s.addFunnelStep()}>+ Add Step</button>
      </div>
      <div className="card">
        <div className="card-body">
          {s.funnelSteps.map((step, i) => (
            <div key={step.id} className="array-item">
              <div className="array-item-header">
                <span className="array-item-label">Step #{i + 1}</span>
                <button className="remove-btn" onClick={() => s.removeFunnelStep(step.id)}>×</button>
              </div>
              <div className="form-grid form-grid-3">
                <div className="field"><label className="field-label">Step Label</label><input type="text" value={step.label} onChange={e => s.updateFunnelStep(step.id, 'label', e.target.value)} placeholder="Impressions" /></div>
                <div className="field"><label className="field-label">Value Display</label><input type="text" value={step.value} onChange={e => s.updateFunnelStep(step.id, 'value', e.target.value)} placeholder="2.4M / mo" /></div>
                <div className="field"><label className="field-label">% of Top</label><input type="text" value={step.pct} onChange={e => s.updateFunnelStep(step.id, 'pct', e.target.value)} placeholder="100%" /></div>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => s.addFunnelStep()}>＋ Add Funnel Step</button>
        </div>
      </div>
    </div>
  )
}

export function ProductPanel() {
  const s = useAdminStore()
  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Product Vision & Roadmap</div><div className="panel-subtitle">Vision statement and shipped / in-progress / planned features</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => s.addRoadmapItem()}>+ Add Item</button>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Product Vision</div>
          <AiGenerateButton
            fieldLabel="Product Vision"
            fieldPath="product.vision"
            currentValue={s.productVision}
            instruction="Use the current app category, model, KPIs, and market context. Make it strategic but credible."
            onGenerated={(text) => s.setField('productVision', text)}
          />
        </div>
        <div className="card-body">
          <textarea value={s.productVision} onChange={e => s.setField('productVision', e.target.value)} rows={4} placeholder="Describe the product vision..." />
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Roadmap Items</div>
          <button className="btn btn-ghost btn-sm" onClick={() => s.addRoadmapItem()}>+ Item</button>
        </div>
        <div className="card-body">
          {s.roadmapItems.map((r, i) => (
            <div key={r.id} className="array-item">
              <div className="array-item-header">
                <span className="array-item-label">Item #{i + 1}</span>
                <button className="remove-btn" onClick={() => s.removeRoadmapItem(r.id)}>×</button>
              </div>
              <div className="form-grid form-grid-3">
                <div className="field">
                  <label className="field-label">Status</label>
                  <select value={r.status} onChange={e => s.updateRoadmap(r.id, 'status', e.target.value)}>
                    <option value="done">✅ Shipped</option>
                    <option value="progress">🟡 In Progress</option>
                    <option value="planned">⬜ Planned</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label className="field-label">Feature Title</label>
                  <input type="text" value={r.title} onChange={e => s.updateRoadmap(r.id, 'title', e.target.value)} placeholder="AI Personalized Workout Plans" />
                  <AiGenerateButton
                    fieldLabel="Feature Title"
                    fieldPath={`product.roadmap.${i}.title`}
                    currentValue={r.title}
                    instruction={`Roadmap status is ${r.status}.`}
                    onGenerated={(text) => s.updateRoadmap(r.id, 'title', text)}
                  />
                </div>
                <div className="field" style={{ gridColumn: 'span 3' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <label className="field-label" style={{ marginBottom: 0 }}>Description</label>
                    <AiGenerateButton
                      fieldLabel="Roadmap Description"
                      fieldPath={`product.roadmap.${i}.description`}
                      currentValue={r.description}
                      instruction={`Feature title: ${r.title || 'empty'}. Roadmap status: ${r.status}.`}
                      onGenerated={(text) => s.updateRoadmap(r.id, 'description', text)}
                    />
                  </div>
                  <textarea rows={2} value={r.description} onChange={e => s.updateRoadmap(r.id, 'description', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => s.addRoadmapItem()}>＋ Add Roadmap Item</button>
        </div>
      </div>
    </div>
  )
}

export function MarketPanel() {
  const s = useAdminStore()
  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Market & Competitors</div><div className="panel-subtitle">TAM/SAM/SOM and competitive landscape</div></div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Market Sizing</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-3">
            {([['marketTam','TAM','$15.3B','Total Addressable Market'],['marketSam','SAM','$2.1B','Serviceable Addressable Market'],['marketSom','SOM','$210M','Serviceable Obtainable Market'],['marketTamLabel','TAM Label','Global fitness apps',''],['marketSamLabel','SAM Label','AI fitness apps',''],['marketYear','Year','2025','']] as ['marketTam'|'marketSam'|'marketSom'|'marketTamLabel'|'marketSamLabel'|'marketYear', string, string, string][]).map(([key, label, ph, hint]) => (
              <div key={key} className="field">
                <label className="field-label">{label}</label>
                <input type="text" value={s[key] as string} onChange={e => s.setField(key, e.target.value)} placeholder={ph} />
                {hint && <div className="field-hint">{hint}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Competitors</div>
          <button className="btn btn-ghost btn-sm" onClick={() => s.addCompetitor()}>+ Add</button>
        </div>
        <div className="card-body">
          {s.competitors.map((c, i) => (
            <div key={c.id} className="array-item">
              <div className="array-item-header">
                <span className="array-item-label">Competitor #{i + 1}</span>
                <button className="remove-btn" onClick={() => s.removeCompetitor(c.id)}>×</button>
              </div>
              <div className="form-grid form-grid-3">
                <div className="field"><label className="field-label">Emoji Icon</label><input type="text" value={c.icon} onChange={e => s.updateCompetitor(c.id, 'icon', e.target.value)} placeholder="💪" /></div>
                <div className="field"><label className="field-label">App Name</label><input type="text" value={c.name} onChange={e => s.updateCompetitor(c.id, 'name', e.target.value)} placeholder="Fitbod" /></div>
                <div className="field">
                  <label className="field-label">This App?</label>
                  <select value={c.isThisApp ? 'true' : 'false'} onChange={e => s.updateCompetitor(c.id, 'isThisApp', e.target.value === 'true')}>
                    <option value="false">No</option>
                    <option value="true">Yes ← This App</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: 'span 3' }}>
                  <label className="field-label">Description</label>
                  <input type="text" value={c.description} onChange={e => s.updateCompetitor(c.id, 'description', e.target.value)} placeholder="Adaptive strength training · $30M+ ARR" />
                  <AiGenerateButton
                    fieldLabel="Competitor Description"
                    fieldPath={`market.competitors.${i}.description`}
                    currentValue={c.description}
                    instruction={`Competitor name: ${c.name || 'empty'}. This app: ${c.isThisApp ? 'yes' : 'no'}.`}
                    onGenerated={(text) => s.updateCompetitor(c.id, 'description', text)}
                  />
                </div>
                <div className="field"><label className="field-label">App Store Rating</label><input type="text" value={c.appStoreRating} onChange={e => s.updateCompetitor(c.id, 'appStoreRating', e.target.value)} placeholder="4.8" /></div>
                <div className="field"><label className="field-label">App Store Icon</label><input type="text" value={c.appStoreIcon || ''} onChange={e => s.updateCompetitor(c.id, 'appStoreIcon', e.target.value)} placeholder="🍎 (optional)" /></div>
                <div className="field"><label className="field-label">Google Play Rating</label><input type="text" value={c.googleStoreRating} onChange={e => s.updateCompetitor(c.id, 'googleStoreRating', e.target.value)} placeholder="4.6" /></div>
                <div className="field"><label className="field-label">Google Play Icon</label><input type="text" value={c.googleStoreIcon || ''} onChange={e => s.updateCompetitor(c.id, 'googleStoreIcon', e.target.value)} placeholder="▶ (optional)" /></div>
                <div className="field"><label className="field-label">App Link</label><input type="text" value={c.link} onChange={e => s.updateCompetitor(c.id, 'link', e.target.value)} placeholder="https://apps.apple.com/..." /></div>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => s.addCompetitor()}>＋ Add Competitor</button>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">ASO Keyword Rankings</div>
          <button className="btn btn-ghost btn-sm" onClick={() => s.addKeyword()}>+ Add</button>
        </div>
        <div className="card-body">
          {s.keywords.map((k, i) => (
            <div key={k.id} className="array-item">
              <div className="array-item-header">
                <span className="array-item-label">Keyword #{i + 1}</span>
                <button className="remove-btn" onClick={() => s.removeKeyword(k.id)}>×</button>
              </div>
              <div className="form-grid form-grid-3">
                <div className="field"><label className="field-label">Keyword</label><input type="text" value={k.keyword} onChange={e => s.updateKeyword(k.id, 'keyword', e.target.value)} placeholder="ai workout planner" /></div>
                <div className="field"><label className="field-label">Store</label><input type="text" value={k.store} onChange={e => s.updateKeyword(k.id, 'store', e.target.value)} placeholder="App Store" /></div>
                <div className="field"><label className="field-label">Country</label><input type="text" value={k.country} onChange={e => s.updateKeyword(k.id, 'country', e.target.value)} placeholder="US" /></div>
                <div className="field"><label className="field-label">Rank</label><input type="text" value={k.rank} onChange={e => s.updateKeyword(k.id, 'rank', e.target.value)} placeholder="#2" /></div>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => s.addKeyword()}>＋ Add Keyword</button>
        </div>
      </div>
    </div>
  )
}

export function OpportunitiesPanel() {
  const s = useAdminStore()
  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Growth Opportunities</div><div className="panel-subtitle">Upside levers for the acquirer</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => s.addOpportunity()}>+ Add</button>
      </div>
      <div className="card">
        <div className="card-body">
          {s.opportunities.map((o, i) => (
            <div key={o.id} className="array-item">
              <div className="array-item-header">
                <span className="array-item-label">Item #{i + 1}</span>
                <button className="remove-btn" onClick={() => s.removeOpportunity(o.id)}>×</button>
              </div>
              <div className="form-grid form-grid-3">
                <div className="field"><label className="field-label">Emoji</label><input type="text" value={o.icon} onChange={e => s.updateOpportunity(o.id, 'icon', e.target.value)} placeholder="💳" /></div>
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label className="field-label">Title</label>
                  <input type="text" value={o.title} onChange={e => s.updateOpportunity(o.id, 'title', e.target.value)} placeholder="Paywall A/B Testing" />
                  <AiGenerateButton
                    fieldLabel="Opportunity Title"
                    fieldPath={`opportunities.${i}.title`}
                    currentValue={o.title}
                    onGenerated={(text) => s.updateOpportunity(o.id, 'title', text)}
                  />
                </div>
                <div className="field" style={{ gridColumn: 'span 3' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <label className="field-label" style={{ marginBottom: 0 }}>Description</label>
                    <AiGenerateButton
                      fieldLabel="Opportunity Description"
                      fieldPath={`opportunities.${i}.description`}
                      currentValue={o.description}
                      instruction={`Opportunity title: ${o.title || 'empty'}.`}
                      onGenerated={(text) => s.updateOpportunity(o.id, 'description', text)}
                    />
                  </div>
                  <textarea rows={2} value={o.description} onChange={e => s.updateOpportunity(o.id, 'description', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => s.addOpportunity()}>＋ Add Opportunity</button>
        </div>
      </div>
    </div>
  )
}

export function ContactPanel() {
  const s = useAdminStore()
  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Contact & Process</div><div className="panel-subtitle">Advisor contact info and acquisition process steps</div></div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Point of Contact</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-2">
            <div className="field"><label className="field-label">Name</label><input type="text" value={s.contactName} onChange={e => s.setField('contactName', e.target.value)} placeholder="Evelin Herrera" /></div>
            <div className="field"><label className="field-label">Title</label><input type="text" value={s.contactTitle} onChange={e => s.setField('contactTitle', e.target.value)} placeholder="M&A Advisor · EHVM Mobile" /></div>
            <div className="field"><label className="field-label">Email</label><input type="email" value={s.contactEmail} onChange={e => s.setField('contactEmail', e.target.value)} placeholder="hi@example.com" /></div>
            <div className="field"><label className="field-label">Phone</label><input type="tel" value={s.contactPhone} onChange={e => s.setField('contactPhone', e.target.value)} placeholder="+1 415 000 0000" /></div>
            <div className="field">
              <label className="field-label">Contact Image URL</label>
              <div className="url-upload-row">
                <input type="url" value={s.contactImage} onChange={e => s.setField('contactImage', e.target.value)} placeholder="https://..." />
                <ImageUploadButton
                  folder="contacts"
                  onUploaded={(url) => s.setField('contactImage', url)}
                  onSuccess={(message) => s.showToast(message, '🖼')}
                  onError={(message) => s.showToast(message, '⚠️')}
                  label="Upload"
                />
              </div>
            </div>
            <div className="field"><label className="field-label">Calendar Link</label><input type="url" value={s.contactCal} onChange={e => s.setField('contactCal', e.target.value)} placeholder="https://cal.com/..." /></div>
            <div className="field"><label className="field-label">NDA Signing Link</label><input type="url" value={s.contactNda} onChange={e => s.setField('contactNda', e.target.value)} placeholder="https://docuseal.com/d/..." /></div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Acquisition Process Steps</div>
          <button className="btn btn-ghost btn-sm" onClick={() => s.addProcessStep()}>+ Step</button>
        </div>
        <div className="card-body">
          {s.processSteps.map((step, i) => (
            <div key={step.id} className="array-item">
              <div className="array-item-header">
                <span className="array-item-label">Step {i + 1}</span>
                <button className="remove-btn" onClick={() => s.removeProcessStep(step.id)}>×</button>
              </div>
              <div className="form-grid form-grid-2">
                <div className="field">
                  <label className="field-label">Step Title</label>
                  <input type="text" value={step.title} onChange={e => s.updateProcessStep(step.id, 'title', e.target.value)} placeholder="Sign Mutual NDA" />
                  <AiGenerateButton
                    fieldLabel="Process Step Title"
                    fieldPath={`contact.processSteps.${i}.title`}
                    currentValue={step.title}
                    onGenerated={(text) => s.updateProcessStep(step.id, 'title', text)}
                  />
                </div>
                <div className="field"><label className="field-label">Note / Badge text</label><input type="text" value={step.note} onChange={e => s.updateProcessStep(step.id, 'note', e.target.value)} placeholder="~2 minutes" /></div>
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <label className="field-label" style={{ marginBottom: 0 }}>Description</label>
                    <AiGenerateButton
                      fieldLabel="Process Step Description"
                      fieldPath={`contact.processSteps.${i}.description`}
                      currentValue={step.description}
                      instruction={`Step title: ${step.title || 'empty'}. Step note: ${step.note || 'empty'}.`}
                      onGenerated={(text) => s.updateProcessStep(step.id, 'description', text)}
                    />
                  </div>
                  <textarea rows={2} value={step.description} onChange={e => s.updateProcessStep(step.id, 'description', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => s.addProcessStep()}>＋ Add Step</button>
        </div>
      </div>
    </div>
  )
}

export function ImagesPanel() {
  const s = useAdminStore()
  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Media & Images</div><div className="panel-subtitle">Enter image URLs — stored in the app JSON</div></div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">App Screenshots</div></div>
        <div className="card-body">
          {s.screenshots.map((sc, i) => (
            <div key={sc.id} className="array-item">
              <div className="array-item-header">
                <span className="array-item-label">Screenshot #{i + 1}</span>
                <button className="remove-btn" onClick={() => s.removeScreenshot(sc.id)}>×</button>
              </div>
              <div className="form-grid form-grid-2">
                <div className="field">
                  <label className="field-label">Image URL</label>
                  <div className="url-upload-row">
                    <input type="url" value={sc.url} onChange={e => s.updateScreenshot(sc.id, 'url', e.target.value)} placeholder="https://…" />
                    <ImageUploadButton
                      folder="screenshots"
                      onUploaded={(url) => s.updateScreenshot(sc.id, 'url', url)}
                      onSuccess={(message) => s.showToast(message, '🖼')}
                      onError={(message) => s.showToast(message, '⚠️')}
                      label="Upload"
                    />
                  </div>
                  <div className="img-preview" style={{ height: 80 }}>
                    {sc.url ? <img src={sc.url} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : '🖼 No URL'}
                  </div>
                </div>
                <div className="field"><label className="field-label">Caption</label><input type="text" value={sc.caption} onChange={e => s.updateScreenshot(sc.id, 'caption', e.target.value)} placeholder="Home screen / Onboarding" /></div>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => s.addScreenshot()}>＋ Add Screenshot URL</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">App Icon</div></div>
        <div className="card-body">
          <div className="field">
            <label className="field-label">App Icon URL</label>
            <div className="url-upload-row">
              <input type="url" value={s.imgIcon} onChange={e => s.setField('imgIcon', e.target.value)} placeholder="https://..." />
              <ImageUploadButton
                folder="icons"
                onUploaded={(url) => s.setField('imgIcon', url)}
                onSuccess={(message) => s.showToast(message, '🖼')}
                onError={(message) => s.showToast(message, '⚠️')}
                label="Upload"
              />
            </div>
            <div className="img-preview" style={{ height: 80, width: 80, borderRadius: 18 }}>
              {s.imgIcon ? <img src={s.imgIcon} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : '🖼'}
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Cover / Hero Image</div></div>
        <div className="card-body">
          <div className="field">
            <label className="field-label">Cover Image URL</label>
            <div className="url-upload-row">
              <input type="url" value={s.imgCover} onChange={e => s.setField('imgCover', e.target.value)} placeholder="https://..." />
              <ImageUploadButton
                folder="covers"
                onUploaded={(url) => s.setField('imgCover', url)}
                onSuccess={(message) => s.showToast(message, '🖼')}
                onError={(message) => s.showToast(message, '⚠️')}
                label="Upload"
              />
            </div>
            <div className="img-preview">
              {s.imgCover ? <img src={s.imgCover} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : '🖼 No image'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
