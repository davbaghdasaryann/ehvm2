'use client'
import { useAdminStore } from '@/admin/store/adminStore'

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
            {c.datasets.map((ds, di) => (
              <div key={di} className="chart-data-row">
                <div className="chart-color-dot" style={{ background: ds.color }} />
                <input type="text" value={ds.label} onChange={e => s.updateDataset(c.id, di, 'label', e.target.value)} placeholder="Series label" style={{ maxWidth: 120 }} />
                <input type="text" value={ds.data} onChange={e => s.updateDataset(c.id, di, 'data', e.target.value)} placeholder="Comma-separated values: 12000,16500…" style={{ flex: 3, fontFamily: 'var(--mono)', fontSize: 11 }} />
                <input type="color" value={ds.color} onChange={e => s.updateDataset(c.id, di, 'color', e.target.value)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', padding: 0 }} />
                <button className="remove-btn" onClick={() => s.removeDataset(c.id, di)}>×</button>
              </div>
            ))}
            <button className="add-btn" onClick={() => s.addDataset(c.id)}>＋ Add Dataset / Series</button>
          </div>
        </div>
      ))}
      <button className="add-btn" onClick={() => s.addChart()}>＋ Add Chart</button>
    </div>
  )
}
