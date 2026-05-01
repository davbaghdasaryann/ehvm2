'use client'
import { useAdminStore } from '@/admin/store/adminStore'
import type { DataSourceMode } from '@/admin/types'
import AiGenerateButton from '@/admin/components/AiGenerateButton'

const SOURCE_OPTIONS: { value: DataSourceMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'manual', label: 'Manual only' },
  { value: 'live', label: 'Live Appfigures' },
]

type CardType = 'revenue' | 'rating'

const CARD_TYPES: { value: CardType; label: string; icon: string; color: string }[] = [
  { value: 'revenue', label: 'Revenue / Trend', icon: '📈', color: '#34a853' },
  { value: 'rating',  label: 'Rating',          icon: '⭐', color: '#8B5CF6' },
]

const PLACEHOLDERS: Record<CardType, { label: string; value: string; trend: string; sub: string }> = {
  revenue: {
    label: 'Monthly Recurring Revenue',
    value: '$70K',
    trend: '↑ 22% YoY',
    sub:   '$840K ARR',
  },
  rating: {
    label: 'iOS App Rating',
    value: '4.7',
    trend: 'Top 5% category',
    sub:   '1,249 ranked keywords',
  },
}

function cardTypeFromIcon(icon: string): CardType {
  return /star|rating|⭐|★/i.test(icon) ? 'rating' : 'revenue'
}

export default function KpisPanel() {
  const { kpiItems, addKpi, removeKpi, updateKpi, dataSourceKpis, setField } = useAdminStore()

  function handleTypeChange(id: number, type: CardType) {
    updateKpi(id, 'icon', CARD_TYPES.find(t => t.value === type)!.icon)
  }

  return (
    <div>
      <div className="panel-header">
        <div>
          <div className="panel-title">KPI Cards</div>
          <div className="panel-subtitle">Up to 6 headline metrics displayed prominently</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => addKpi()}>+ Add KPI</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Data Source</div></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 8 }}>
            {SOURCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setField('dataSourceKpis', opt.value)}
                className={`btn btn-sm ${dataSourceKpis === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              >{opt.label}</button>
            ))}
          </div>
          <p className="panel-subtitle" style={{ marginTop: 6 }}>
            {dataSourceKpis === 'auto' && 'Manual KPIs shown first; Appfigures fills unique gaps.'}
            {dataSourceKpis === 'manual' && 'Only manually entered KPIs shown; Appfigures data ignored.'}
            {dataSourceKpis === 'live' && 'Only live Appfigures KPIs shown; manual entries ignored.'}
          </p>
        </div>
      </div>

      {kpiItems.map((k, i) => {
        const type = cardTypeFromIcon(k.icon)
        const ph = PLACEHOLDERS[type]
        const accentColor = type === 'rating' ? '#8B5CF6' : '#34a853'

        return (
          <div key={k.id} className="array-item">
            <div className="array-item-header">
              <span className="array-item-label">KPI #{i + 1}</span>
              <button className="remove-btn" onClick={() => removeKpi(k.id)}>×</button>
            </div>

            {/* Card type selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {CARD_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => handleTypeChange(k.id, ct.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    border: `1.5px solid ${type === ct.value ? ct.color : '#e0e0e0'}`,
                    background: type === ct.value ? `${ct.color}18` : '#fff',
                    color: type === ct.value ? ct.color : '#666',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span>{ct.icon}</span> {ct.label}
                </button>
              ))}
            </div>

            {/* Preview strip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
              padding: '10px 14px', borderRadius: 12, background: '#F5F5F7',
              borderLeft: `3px solid ${accentColor}`,
            }}>
              <span style={{ fontSize: 20 }}>{type === 'rating' ? '⭐' : '📈'}</span>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', fontWeight: 600 }}>
                  {k.label || ph.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
                  {k.value || ph.value}
                  {type === 'rating' && <span style={{ color: accentColor, marginLeft: 6 }}>★</span>}
                </div>
                {k.trend && <div style={{ fontSize: 12, color: accentColor, fontWeight: 500 }}>{type === 'revenue' ? `↗ ${k.trend.replace(/^[↑↗]\s*/,'')}` : k.trend}</div>}
                {k.sub   && <div style={{ fontSize: 12, color: '#888' }}>{k.sub}</div>}
              </div>
            </div>

            {/* Fields */}
            <div className="form-grid form-grid-2">
              <div className="field">
                <label className="field-label">Label</label>
                <input type="text" value={k.label} onChange={e => updateKpi(k.id, 'label', e.target.value)} placeholder={ph.label} />
                <AiGenerateButton fieldLabel="KPI Label" fieldPath={`kpis.${i}.label`} currentValue={k.label} onGenerated={text => updateKpi(k.id, 'label', text)} />
              </div>
              <div className="field">
                <label className="field-label">Value</label>
                <input type="text" value={k.value} onChange={e => updateKpi(k.id, 'value', e.target.value)} placeholder={ph.value} />
                <AiGenerateButton fieldLabel="KPI Value" fieldPath={`kpis.${i}.value`} currentValue={k.value} instruction={`KPI label: ${k.label || 'empty'}. Use only known numbers from context.`} onGenerated={text => updateKpi(k.id, 'value', text)} />
              </div>
              <div className="field">
                <label className="field-label">{type === 'revenue' ? 'Trend (e.g. ↑ 22% YoY)' : 'Badge (e.g. Top 5% category)'}</label>
                <input type="text" value={k.trend} onChange={e => updateKpi(k.id, 'trend', e.target.value)} placeholder={ph.trend} />
                <AiGenerateButton fieldLabel="KPI Trend" fieldPath={`kpis.${i}.trend`} currentValue={k.trend} instruction={`KPI label: ${k.label || 'empty'}. Use only known numbers from context.`} onGenerated={text => updateKpi(k.id, 'trend', text)} />
              </div>
              <div className="field">
                <label className="field-label">{type === 'revenue' ? 'Sub-text (e.g. $840K ARR)' : 'Detail (e.g. 1,249 ranked keywords)'}</label>
                <input type="text" value={k.sub} onChange={e => updateKpi(k.id, 'sub', e.target.value)} placeholder={ph.sub} />
                <AiGenerateButton fieldLabel="KPI Sub-text" fieldPath={`kpis.${i}.sub`} currentValue={k.sub} instruction={`KPI label: ${k.label || 'empty'}. Use only known context.`} onGenerated={text => updateKpi(k.id, 'sub', text)} />
              </div>
            </div>
          </div>
        )
      })}

      <button className="add-btn" onClick={() => addKpi()}>＋ Add KPI Card</button>
    </div>
  )
}
