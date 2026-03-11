'use client'
import { useAdminStore } from '@/admin/store/adminStore'

export default function FinancialsPanel() {
  const s = useAdminStore()
  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Financial Table</div><div className="panel-subtitle">TTM P&L rows shown in the Financial Snapshot</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => s.addFinRow()}>+ Add Row</button>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Summary Metrics</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-3">
            {([['finMrr','MRR','$70,000'],['finArr','ARR','$840K'],['finLtvCac','LTV:CAC Ratio','4.2×'],['finMargin','Net Margin %','~43%'],['finYoy','YoY Growth','22%'],['finMultiple','Asking Multiple','3.5× ARR']] as ['finMrr'|'finArr'|'finLtvCac'|'finMargin'|'finYoy'|'finMultiple', string, string][]).map(([key, label, ph]) => (
              <div key={key} className="field">
                <label className="field-label">{label}</label>
                <input type="text" value={s[key] as string} onChange={e => s.setField(key, e.target.value)} placeholder={ph} />
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
                <div className="field"><label className="field-label">Metric Label</label><input type="text" value={r.label} onChange={e => s.updateFinRow(r.id, 'label', e.target.value)} placeholder="Gross Revenue" /></div>
                <div className="field"><label className="field-label">TTM Amount</label><input type="text" value={r.amount} onChange={e => s.updateFinRow(r.id, 'amount', e.target.value)} placeholder="$756,000" /></div>
                <div className="field"><label className="field-label">MoM Trend</label><input type="text" value={r.trend} onChange={e => s.updateFinRow(r.id, 'trend', e.target.value)} placeholder="↑ 22%" /></div>
                <div className="field" style={{ gridColumn: 'span 3' }}><label className="field-label">Notes</label><input type="text" value={r.notes} onChange={e => s.updateFinRow(r.id, 'notes', e.target.value)} placeholder="App Store + Play Store gross" /></div>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => s.addFinRow()}>＋ Add P&L Row</button>
        </div>
      </div>
    </div>
  )
}
