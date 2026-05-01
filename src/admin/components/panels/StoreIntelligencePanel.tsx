'use client'
import { useAdminStore } from '@/admin/store/adminStore'

const STAR_OPTIONS = [1, 2, 3, 4, 5]
const STORE_OPTIONS = ['apple', 'google_play']

export default function StoreIntelligencePanel() {
  const s = useAdminStore()
  return (
    <div>
      {/* Store Signals */}
      <div className="panel-header">
        <div>
          <div className="panel-title">Store Intelligence</div>
          <div className="panel-subtitle">Metric cards shown in the Store Intelligence section</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => s.addStoreSignal()}>+ Add Signal</button>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Signal Cards</div></div>
        <div className="card-body">
          {s.storeSignals.length === 0 && (
            <p className="panel-subtitle">No signals yet — click "+ Add Signal" to start.</p>
          )}
          {s.storeSignals.map((sg, i) => (
            <div key={sg.id} className="array-item">
              <div className="array-item-header">
                <span className="array-item-label">Signal #{i + 1}</span>
                <button className="remove-btn" onClick={() => s.removeStoreSignal(sg.id)}>×</button>
              </div>
              <div className="form-grid form-grid-3">
                <div className="field">
                  <label className="field-label">Label</label>
                  <input type="text" value={sg.label} onChange={e => s.updateStoreSignal(sg.id, 'label', e.target.value)} placeholder="Featured Countries" />
                </div>
                <div className="field">
                  <label className="field-label">Value</label>
                  <input type="text" value={sg.value} onChange={e => s.updateStoreSignal(sg.id, 'value', e.target.value)} placeholder="88" />
                </div>
                <div className="field">
                  <label className="field-label">Sub-text (optional)</label>
                  <input type="text" value={sg.sub} onChange={e => s.updateStoreSignal(sg.id, 'sub', e.target.value)} placeholder="AF, AG, AI, AO, AR…" />
                </div>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => s.addStoreSignal()}>＋ Add Signal Card</button>
        </div>
      </div>

      {/* Manual Reviews */}
      <div className="panel-header" style={{ marginTop: 24 }}>
        <div>
          <div className="panel-title">Recent Store Reviews</div>
          <div className="panel-subtitle">Manual reviews shown in the Recent Store Reviews section</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => s.addManualReview()}>+ Add Review</button>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Reviews</div></div>
        <div className="card-body">
          {s.manualReviews.length === 0 && (
            <p className="panel-subtitle">No reviews yet — click "+ Add Review" to start.</p>
          )}
          {s.manualReviews.map((r, i) => (
            <div key={r.id} className="array-item">
              <div className="array-item-header">
                <span className="array-item-label">Review #{i + 1}</span>
                <button className="remove-btn" onClick={() => s.removeManualReview(r.id)}>×</button>
              </div>
              <div className="form-grid form-grid-3">
                <div className="field">
                  <label className="field-label">Title</label>
                  <input type="text" value={r.title} onChange={e => s.updateManualReview(r.id, 'title', e.target.value)} placeholder="Great app!" />
                </div>
                <div className="field">
                  <label className="field-label">Author</label>
                  <input type="text" value={r.author} onChange={e => s.updateManualReview(r.id, 'author', e.target.value)} placeholder="user123" />
                </div>
                <div className="field">
                  <label className="field-label">Product Name</label>
                  <input type="text" value={r.productName} onChange={e => s.updateManualReview(r.id, 'productName', e.target.value)} placeholder="Coachify: AI Workouts" />
                </div>
                <div className="field">
                  <label className="field-label">Stars</label>
                  <select value={r.stars} onChange={e => s.updateManualReview(r.id, 'stars', Number(e.target.value))}>
                    {STAR_OPTIONS.map(n => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Store</label>
                  <select value={r.store} onChange={e => s.updateManualReview(r.id, 'store', e.target.value)}>
                    {STORE_OPTIONS.map(st => <option key={st} value={st}>{st === 'apple' ? 'Apple App Store' : 'Google Play'}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Date</label>
                  <input type="date" value={r.date} onChange={e => s.updateManualReview(r.id, 'date', e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Version (optional)</label>
                  <input type="text" value={r.version} onChange={e => s.updateManualReview(r.id, 'version', e.target.value)} placeholder="5.3.31" />
                </div>
                <div className="field" style={{ gridColumn: 'span 3' }}>
                  <label className="field-label">Review Text</label>
                  <textarea
                    value={r.review}
                    onChange={e => s.updateManualReview(r.id, 'review', e.target.value)}
                    placeholder="Write the review content here…"
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => s.addManualReview()}>＋ Add Review</button>
        </div>
      </div>
    </div>
  )
}
