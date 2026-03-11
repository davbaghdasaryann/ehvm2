'use client'
import { useAdminStore } from '@/admin/store/adminStore'

export default function KpisPanel() {
  const { kpiItems, addKpi, removeKpi, updateKpi } = useAdminStore()
  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">KPI Cards</div><div className="panel-subtitle">Up to 6 headline metrics displayed prominently</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => addKpi()}>+ Add KPI</button>
      </div>
      {kpiItems.map((k, i) => (
        <div key={k.id} className="array-item">
          <div className="array-item-header">
            <span className="array-item-label">KPI #{i + 1}</span>
            <button className="remove-btn" onClick={() => removeKpi(k.id)}>×</button>
          </div>
          <div className="form-grid form-grid-3">
            <div className="field"><label className="field-label">Label</label><input type="text" value={k.label} onChange={e => updateKpi(k.id, 'label', e.target.value)} placeholder="Monthly Recurring Revenue" /></div>
            <div className="field"><label className="field-label">Value</label><input type="text" value={k.value} onChange={e => updateKpi(k.id, 'value', e.target.value)} placeholder="$70K" /></div>
            <div className="field"><label className="field-label">Trend Badge</label><input type="text" value={k.trend} onChange={e => updateKpi(k.id, 'trend', e.target.value)} placeholder="↑ 22% YoY" /></div>
            <div className="field"><label className="field-label">Sub-text</label><input type="text" value={k.sub} onChange={e => updateKpi(k.id, 'sub', e.target.value)} placeholder="$840K ARR" /></div>
            <div className="field"><label className="field-label">Icon / Emoji</label><input type="text" value={k.icon} onChange={e => updateKpi(k.id, 'icon', e.target.value)} placeholder="📊" /></div>
          </div>
        </div>
      ))}
      <button className="add-btn" onClick={() => addKpi()}>＋ Add KPI Card</button>
    </div>
  )
}
