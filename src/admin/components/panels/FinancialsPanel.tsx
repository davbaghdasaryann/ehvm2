'use client'
import { useAdminStore } from '@/admin/store/adminStore'
import type { DataSourceMode } from '@/admin/types'
import AiGenerateButton from '@/admin/components/AiGenerateButton'

const SOURCE_OPTIONS: { value: DataSourceMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'manual', label: 'Manual only' },
  { value: 'live', label: 'Live Appfigures' },
]

export default function FinancialsPanel() {
  const s = useAdminStore()
  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Financial Table</div><div className="panel-subtitle">TTM P&L rows shown in the Financial Snapshot</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => s.loadAppfiguresData()}>📊 Load from Appfigures</button>
          <button className="btn btn-primary btn-sm" onClick={() => s.addFinRow()}>+ Add Row</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Data Source</div></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 8 }}>
            {SOURCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => s.setField('dataSourceFinancials', opt.value)}
                className={`btn btn-sm ${s.dataSourceFinancials === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              >{opt.label}</button>
            ))}
          </div>
          <p className="panel-subtitle" style={{ marginTop: 6 }}>
            {s.dataSourceFinancials === 'auto' && 'Manual financials shown first; Appfigures fills unique gaps.'}
            {s.dataSourceFinancials === 'manual' && 'Only manually entered financials shown; Appfigures data ignored.'}
            {s.dataSourceFinancials === 'live' && 'Only live Appfigures financials shown; manual entries ignored.'}
          </p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Summary Metrics</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-3">
            {([['finMrr','MRR','$70,000'],['finArr','ARR','$840K'],['finLtvCac','LTV:CAC Ratio','4.2×'],['finMargin','Net Margin %','~43%'],['finYoy','YoY Growth','22%'],['finMultiple','Asking Multiple','3.5× ARR']] as ['finMrr'|'finArr'|'finLtvCac'|'finMargin'|'finYoy'|'finMultiple', string, string][]).map(([key, label, ph]) => (
              <div key={key} className="field">
                <label className="field-label">{label}</label>
                <input type="text" value={s[key] as string} onChange={e => s.setField(key, e.target.value)} placeholder={ph} />
                <AiGenerateButton
                  fieldLabel={label}
                  fieldPath={`financials.${key}`}
                  currentValue={s[key] as string}
                  instruction="Use only known numbers from the current app context. If unknown, produce a conservative NDA-safe label."
                  onGenerated={(text) => s.setField(key, text)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">P&L Table Rows <span className="card-badge">TTM</span></div>
          <button className="btn btn-ghost btn-sm" onClick={() => s.addFinRow()}>+ Row</button>
        </div>
        <div className="card-body">
          {s.finRows.map((r, i) => (
            <div key={r.id} className="array-item">
              <div className="array-item-header">
                <span className="array-item-label">Row #{i + 1}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select value={r.highlight ? 'true' : 'false'} onChange={e => s.updateFinRow(r.id, 'highlight', e.target.value === 'true')} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, width: 'auto' }}>
                    <option value="false">Normal</option>
                    <option value="true">Highlighted</option>
                  </select>
                  <button className="remove-btn" onClick={() => s.removeFinRow(r.id)}>×</button>
                </div>
              </div>
              <div className="form-grid form-grid-3">
                <div className="field">
                  <label className="field-label">Metric Label</label>
                  <input type="text" value={r.label} onChange={e => s.updateFinRow(r.id, 'label', e.target.value)} placeholder="Gross Revenue" />
                  <AiGenerateButton fieldLabel="P&L Metric Label" fieldPath={`financials.plRows.${i}.label`} currentValue={r.label} onGenerated={(text) => s.updateFinRow(r.id, 'label', text)} />
                </div>
                <div className="field">
                  <label className="field-label">TTM Amount</label>
                  <input type="text" value={r.amount} onChange={e => s.updateFinRow(r.id, 'amount', e.target.value)} placeholder="$756,000" />
                  <AiGenerateButton fieldLabel="P&L TTM Amount" fieldPath={`financials.plRows.${i}.amount`} currentValue={r.amount} instruction={`Metric label: ${r.label || 'empty'}. Use only known numbers from context.`} onGenerated={(text) => s.updateFinRow(r.id, 'amount', text)} />
                </div>
                <div className="field">
                  <label className="field-label">MoM Trend</label>
                  <input type="text" value={r.trend} onChange={e => s.updateFinRow(r.id, 'trend', e.target.value)} placeholder="↑ 22%" />
                  <AiGenerateButton fieldLabel="P&L Trend" fieldPath={`financials.plRows.${i}.trend`} currentValue={r.trend} instruction={`Metric label: ${r.label || 'empty'}. Use only known numbers from context.`} onGenerated={(text) => s.updateFinRow(r.id, 'trend', text)} />
                </div>
                <div className="field" style={{ gridColumn: 'span 3' }}>
                  <label className="field-label">Notes</label>
                  <input type="text" value={r.notes} onChange={e => s.updateFinRow(r.id, 'notes', e.target.value)} placeholder="App Store + Play Store gross" />
                  <AiGenerateButton fieldLabel="P&L Notes" fieldPath={`financials.plRows.${i}.notes`} currentValue={r.notes} instruction={`Metric label: ${r.label || 'empty'}. Amount: ${r.amount || 'empty'}.`} onGenerated={(text) => s.updateFinRow(r.id, 'notes', text)} />
                </div>
                <div className="field" style={{ gridColumn: 'span 3' }}>
                  <label className="field-label">Icon SVG <span style={{ fontWeight: 400, color: '#888' }}>(paste full &lt;svg&gt;…&lt;/svg&gt; code)</span></label>
                  <textarea
                    value={r.icon || ''}
                    onChange={e => s.updateFinRow(r.id, 'icon', e.target.value)}
                    placeholder='<svg width="21" height="21" viewBox="0 0 21 21" fill="none" …>…</svg>'
                    rows={3}
                    style={{ fontFamily: 'monospace', fontSize: 11, resize: 'vertical' }}
                  />
                  {r.icon && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: '#888' }}>Preview:</span>
                      <span dangerouslySetInnerHTML={{ __html: r.icon }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => s.addFinRow()}>＋ Add P&L Row</button>
        </div>
      </div>
    </div>
  )
}
