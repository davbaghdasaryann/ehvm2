'use client'
import { useState } from 'react'
import { useAdminStore } from '@/admin/store/adminStore'

type StatusFilter = 'all' | 'published' | 'draft'
type SortKey = 'name' | 'status' | 'updatedAt'

export default function AppsPanel() {
  const { apps, loadApp, deleteApp, duplicateApp, setPanel, newApp } = useAdminStore()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'updatedAt', dir: 'desc' })

  const handleDelete = (id: string) => {
    if (confirm('Delete this app?')) deleteApp(id)
  }

  const handleSort = (key: SortKey) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  const sortIndicator = (key: SortKey) => sort.key === key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''

  const filtered = apps
    .filter(a => statusFilter === 'all' || a.status === statusFilter)
    .sort((a, b) => {
      let av = '', bv = ''
      if (sort.key === 'name') { av = a.meta?.name?.toLowerCase() || ''; bv = b.meta?.name?.toLowerCase() || '' }
      else if (sort.key === 'status') { av = a.status; bv = b.status }
      else if (sort.key === 'updatedAt') { av = a.updatedAt; bv = b.updatedAt }
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })

  const counts = { all: apps.length, published: apps.filter(a => a.status === 'published').length, draft: apps.filter(a => a.status === 'draft').length }

  const filterBar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
      {(['all', 'published', 'draft'] as StatusFilter[]).map(f => (
        <button
          key={f}
          onClick={() => setStatusFilter(f)}
          style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
            borderColor: statusFilter === f ? 'var(--accent)' : 'var(--border)',
            background: statusFilter === f ? 'var(--accent)' : 'transparent',
            color: statusFilter === f ? '#fff' : 'var(--text2)',
          }}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)} <span style={{ opacity: 0.7, fontWeight: 400 }}>({counts[f]})</span>
        </button>
      ))}
    </div>
  )

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
          {filterBar}
          <table className="apps-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>App Name{sortIndicator('name')}</th>
                <th>MRR</th>
                <th>Category</th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>Status{sortIndicator('status')}</th>
                <th onClick={() => handleSort('updatedAt')} style={{ cursor: 'pointer', userSelect: 'none' }}>Updated{sortIndicator('updatedAt')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: '32px', fontSize: 12 }}>No {statusFilter} apps.</td></tr>
              ) : filtered.map(app => (
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
