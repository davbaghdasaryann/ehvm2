'use client'
import { useAdminStore } from '@/admin/store/adminStore'
import ChartPreview from '@/admin/components/ChartPreview'
import type { DataSourceMode } from '@/admin/types'

const SOURCE_OPTIONS: { value: DataSourceMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'manual', label: 'Manual only' },
  { value: 'live', label: 'Live Appfigures' },
]

export default function ChartsPanel() {
  const s = useAdminStore()
  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Charts & Graphs</div><div className="panel-subtitle">Define chart data — rendered as Chart.js on the app page</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => s.loadAppfiguresData()}>📊 Load from Appfigures</button>
          <button className="btn btn-primary btn-sm" onClick={() => s.addChart()}>+ Add Chart</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Data Source</div></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 8 }}>
            {SOURCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => s.setField('dataSourceCharts', opt.value)}
                className={`btn btn-sm ${s.dataSourceCharts === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              >{opt.label}</button>
            ))}
          </div>
          <p className="panel-subtitle" style={{ marginTop: 6 }}>
            {s.dataSourceCharts === 'auto' && 'Manual charts shown first; Appfigures fills unique gaps.'}
            {s.dataSourceCharts === 'manual' && 'Only manually entered charts shown; Appfigures data ignored.'}
            {s.dataSourceCharts === 'live' && 'Only live Appfigures charts shown; manual entries ignored.'}
          </p>
        </div>
      </div>
      {s.charts.map((c, ci) => (
        <div key={c.id} className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">Chart #{ci + 1}: {c.title || 'Untitled'} <span className="card-badge">{c.type}</span></div>
            <button className="remove-btn" onClick={() => s.removeChart(c.id)}>×</button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
              <div>
                <div className="form-grid form-grid-3" style={{ marginBottom: 14 }}>
                  <div className="field"><label className="field-label">Chart Title</label><input type="text" value={c.title} onChange={e => s.updateChart(c.id, 'title', e.target.value)} placeholder="Revenue Growth" /></div>
                  <div className="field"><label className="field-label">Subtitle</label><input type="text" value={c.subtitle} onChange={e => s.updateChart(c.id, 'subtitle', e.target.value)} placeholder="MRR since launch…" /></div>
                  <div className="field">
                    <label className="field-label">Chart Type</label>
                    <select value={c.type} onChange={e => s.updateChart(c.id, 'type', e.target.value)}>
                      {['line','bar','doughnut','pie','horizontalBar'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 14 }}>
                  <label className="field-label">X-Axis Labels</label>
                  <input type="text" value={c.labels} onChange={e => s.updateChart(c.id, 'labels', e.target.value)} placeholder="Feb,Mar,Apr,May,Jun (comma-separated)" />
                </div>
                <div className="section-divider">Datasets</div>
                {c.datasets.map((ds, di) => {
                  const isPieChart = c.type === 'pie' || c.type === 'doughnut'
                  const isLineChart = c.type === 'line'
                  const dataValues = ds.data.split(',').map(d => d.trim()).filter(Boolean)
                  const colorValues = ds.colors ? ds.colors.split(',').map(c => c.trim()).filter(Boolean) : []

                  const suggestedColors = [
                    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
                    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#64748b'
                  ]

                  // Generate gradient for current color
                  const generateGradient = (baseColor: string, count: number) => {
                    const normalized = baseColor.trim()
                    const full = /^#([0-9a-f]{6})$/i
                    const short = /^#([0-9a-f]{3})$/i
                    let val = 0
                    if (full.test(normalized)) val = Number.parseInt(normalized.slice(1), 16)
                    else if (short.test(normalized)) {
                      const ex = normalized.slice(1).split('').map((c) => c + c).join('')
                      val = Number.parseInt(ex, 16)
                    } else return Array(count).fill('#1a1a1a')

                    const r = (val >> 16) & 255
                    const g = (val >> 8) & 255
                    const b = val & 255

                    const palette = []
                    for (let i = 0; i < count; i++) {
                      const ratio = i / Math.max(count - 1, 1)
                      const lightness = 0.7 - ratio * 0.55

                      const lr = Math.round(r + (255 - r) * (lightness - 0.5) * 2)
                      const lg = Math.round(g + (255 - g) * (lightness - 0.5) * 2)
                      const lb = Math.round(b + (255 - b) * (lightness - 0.5) * 2)
                      palette.push(`rgb(${Math.max(0, Math.min(255, lr))},${Math.max(0, Math.min(255, lg))},${Math.max(0, Math.min(255, lb))})`)
                    }
                    return palette
                  }

                  const gradientPalette = generateGradient(ds.color, Math.max(dataValues.length, 1))

                  return (
                    <div key={di}>
                      <div className="chart-data-row">
                        <input type="text" value={ds.label} onChange={e => s.updateDataset(c.id, di, 'label', e.target.value)} placeholder="Series label" style={{ maxWidth: 120 }} />
                        <input type="text" value={ds.data} onChange={e => s.updateDataset(c.id, di, 'data', e.target.value)} placeholder="Comma-separated values: 12000,16500…" style={{ flex: 3, fontFamily: 'var(--mono)', fontSize: 11 }} />
                        <button className="remove-btn" onClick={() => s.removeDataset(c.id, di)}>×</button>
                      </div>

                      {isLineChart && (
                        <div style={{ marginLeft: 0, marginBottom: 12, marginTop: 12 }}>
                          <label className="field-label" style={{ fontSize: 11, marginBottom: 8 }}>Line Color</label>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {suggestedColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => s.updateDataset(c.id, di, 'color', color)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 6,
                                  backgroundColor: color,
                                  border: ds.color === color ? '2px solid #000' : '2px solid var(--border)',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              />
                            ))}
                            <input
                              type="color"
                              value={ds.color}
                              onChange={e => s.updateDataset(c.id, di, 'color', e.target.value)}
                              title="Custom color"
                              style={{ width: 32, height: 32, borderRadius: 6, border: '2px solid var(--border)', background: 'none', cursor: 'pointer', padding: 0 }}
                            />
                          </div>
                        </div>
                      )}

                      {!isLineChart && (
                        <div style={{ marginLeft: 0, marginBottom: 12, marginTop: 12 }}>
                          <label className="field-label" style={{ fontSize: 11, marginBottom: 8 }}>Gradient Base Color</label>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            {suggestedColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => s.updateDataset(c.id, di, 'color', color)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 6,
                                  backgroundColor: color,
                                  border: ds.color === color ? '2px solid #000' : '2px solid var(--border)',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              />
                            ))}
                            <input
                              type="color"
                              value={ds.color}
                              onChange={e => s.updateDataset(c.id, di, 'color', e.target.value)}
                              title="Custom color"
                              style={{ width: 32, height: 32, borderRadius: 6, border: '2px solid var(--border)', background: 'none', cursor: 'pointer', padding: 0 }}
                            />
                          </div>

                          {dataValues.length > 0 && (
                            <div>
                              <label className="field-label" style={{ fontSize: 11, marginBottom: 8 }}>Slice Colors (click to customize)</label>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {gradientPalette.map((color, idx) => (
                                  <input
                                    key={idx}
                                    type="color"
                                    value={colorValues[idx] || color}
                                    onChange={e => {
                                      const newColors = [...colorValues]
                                      newColors[idx] = e.target.value
                                      s.updateDataset(c.id, di, 'colors', newColors.join(','))
                                    }}
                                    title={`Customize slice ${idx + 1}`}
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 0,
                                      border: '2px solid rgba(0,0,0,0.2)',
                                      cursor: 'pointer',
                                      padding: 0
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                <button className="add-btn" onClick={() => s.addDataset(c.id)}>＋ Add Dataset / Series</button>
              </div>
              <div>
                <ChartPreview type={c.type as 'line' | 'bar' | 'doughnut' | 'pie' | 'horizontalBar'} title={c.title} subtitle={c.subtitle} labels={c.labels} datasets={c.datasets} />
              </div>
            </div>
          </div>
        </div>
      ))}
      <button className="add-btn" onClick={() => s.addChart()}>＋ Add Chart</button>
    </div>
  )
}
