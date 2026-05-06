'use client'
import { useAdminStore } from '@/admin/store/adminStore'

export default function AppsPanel() {
  const { apps, loadApp, deleteApp, duplicateApp, setPanel, newApp } = useAdminStore()

  const handleDelete = (id: string) => {
    if (confirm('Delete this app?')) deleteApp(id)
  }

  if (!apps.length) {
    return (
      <div>
        <div className="panel-header">
          <div><div className="panel-title">All Apps</div><div className="panel-subtitle">Manage your published apps</div></div>
          <button className="btn btn-primary" onClick={newApp}>+ New App</button>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px', fontFamily: 'var(--mono)', fontSize: '12px' }}>
            No apps yet. Create your first app →
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">All Apps</div><div className="panel-subtitle">Manage your published apps</div></div>
        <button className="btn btn-primary" onClick={newApp}>+ New App</button>
      </div>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="apps-table">
            <thead>
              <tr>
                <th>App Name</th><th>MRR</th><th>Category</th><th>Status</th><th>Updated</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(app => (
                <tr key={app.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
                        {app.media?.icon ? (
                          <img src={app.media.icon} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : '📱'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{app.meta?.name || 'Untitled'}{app.meta?.tagline && <span style={{ fontWeight: 400, color: 'var(--text3)' }}> — {app.meta.tagline}</span>}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{app.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{app.financials?.mrr || '—'}</td>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{app.meta?.category || '—'}</td>
                  <td><span className={`status-pill ${app.status}`}>{app.status}</span></td>
                  <td style={{ color: 'var(--text3)', fontSize: 11 }}>{new Date(app.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { loadApp(app.id); setPanel('meta') }}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => duplicateApp(app.id)}>Duplicate</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(app.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
