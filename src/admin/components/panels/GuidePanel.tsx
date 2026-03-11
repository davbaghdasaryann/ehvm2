'use client'

import { useAdminStore } from '@/admin/store/adminStore'

export default function GuidePanel() {
  const s = useAdminStore()

  return (
    <div>
      <div className="panel-header">
        <div>
          <div className="panel-title">How To Use Admin</div>
          <div className="panel-subtitle">Quick reference for apps, news, media, and publishing workflow</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">1. Create Or Edit App</div>
        </div>
        <div className="card-body">
          <ol className="admin-guide-list">
            <li>Open `All Apps` to edit existing app, or click `New App`.</li>
            <li>Fill `Meta & Identity` first: name, tagline, description, badge, links.</li>
            <li>Complete app data panels: KPIs, Financials, Charts, Funnel, Product, Market, Opportunities.</li>
            <li>Add `Contact & Process` and `Media & Images` before publish.</li>
          </ol>
          <div className="admin-guide-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => s.setPanel('apps')}>Open Apps</button>
            <button className="btn btn-primary btn-sm" onClick={() => s.newApp()}>New App</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">2. Manage News</div>
        </div>
        <div className="card-body">
          <ol className="admin-guide-list">
            <li>Go to `News` panel and add/edit article fields: image, title, subtitle, quote, button.</li>
            <li>Set `Published = Yes` to show on website.</li>
            <li>Set `Featured = Yes` to prioritize in floating news and `/news/all`.</li>
          </ol>
          <div className="admin-guide-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => s.setPanel('news')}>Open News</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">3. Save, Preview, Publish</div>
        </div>
        <div className="card-body">
          <ol className="admin-guide-list">
            <li>Use `Save Draft` while editing.</li>
            <li>Use `Live Preview` to verify layout and data.</li>
            <li>Use `Publish App` only when required fields are complete.</li>
            <li>Use `Export` if you want a backup copy of current database JSON.</li>
          </ol>
          <div className="admin-guide-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => s.setPanel('preview')}>Open Preview</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">4. Image Upload Tips</div>
        </div>
        <div className="card-body">
          <ul className="admin-guide-list">
            <li>Use `Upload` buttons in panels to store images under `/uploads/...`.</li>
            <li>Prefer clear PNG/JPG/WebP files under 10MB.</li>
            <li>If an image is missing on site, re-open the entry and verify the saved URL.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
