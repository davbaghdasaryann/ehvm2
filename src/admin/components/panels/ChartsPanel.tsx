'use client'
import { useAdminStore } from '@/admin/store/adminStore'
import ChartPreview from '@/admin/components/ChartPreview'

export default function ChartsPanel() {
  const s = useAdminStore()
  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Charts & Graphs</div><div className="panel-subtitle">Define chart data — rendered as Chart.js on the app page</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => s.addChart()}>+ Add Chart</button>
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
                  const sectionLabel = isPieChart ? 'Slice' : 'Bar'

                  return (
                    <div key={di}>
                      <div className="chart-data-row">
                        <input type="color" value={ds.color} onChange={e => s.updateDataset(c.id, di, 'color', e.target.value)} title="Default color" style={{ width: 32, height: 32, borderRadius: 6, border: '2px solid var(--border)', background: 'none', cursor: 'pointer', padding: 0 }} />
                        <input type="text" value={ds.label} onChange={e => s.updateDataset(c.id, di, 'label', e.target.value)} placeholder="Series label" style={{ maxWidth: 120 }} />
                        <input type="text" value={ds.data} onChange={e => s.updateDataset(c.id, di, 'data', e.target.value)} placeholder="Comma-separated values: 12000,16500…" style={{ flex: 3, fontFamily: 'var(--mono)', fontSize: 11 }} />
                        <button className="remove-btn" onClick={() => s.removeDataset(c.id, di)}>×</button>
                      </div>
                      {dataValues.length > 0 && !isLineChart && (
                        <div style={{ marginLeft: 40, marginBottom: 12 }}>
                          <label className="field-label" style={{ fontSize: 11, marginBottom: 8 }}>{sectionLabel} Colors (optional)</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {dataValues.map((_, colorIndex) => {
                              const currentColor = colorValues[colorIndex] || '#4361ee'
                              return (
                                <div key={colorIndex} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input
                                    type="color"
                                    value={currentColor}
                                    onChange={e => {
                                      const newColors = [...colorValues]
                                      newColors[colorIndex] = e.target.value
                                      s.updateDataset(c.id, di, 'colors', newColors.join(','))
                                    }}
                                    style={{ width: 32, height: 32, borderRadius: 6, border: '2px solid var(--border)', background: 'none', cursor: 'pointer', padding: 0 }}
                                  />
                                  <span style={{ fontSize: 11, color: 'var(--color-caption)' }}>{sectionLabel} {colorIndex + 1}</span>
                                </div>
                              )
                            })}
                          </div>
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
