'use client'
import { useEffect, useRef, useState } from 'react'
import { useAdminStore } from '@/admin/store/adminStore'
import type { AppfiguresAdminProduct } from '@/lib/appfigures-types'

const ADMIN_APPFIGURES_PRODUCTS_API = '/api/admin/appfigures/products'

function findMatchingProduct(
  products: AppfiguresAdminProduct[],
  store: 'apple' | 'google_play',
  productId: string,
  storeProductId: string,
) {
  const normalizedStoreProductId = storeProductId.trim()
  return products.find((product) => {
    if (product.store !== store) return false
    if (product.id === productId && productId) return true
    if (!normalizedStoreProductId) return false
    if (store === 'apple') {
      return product.refNo === normalizedStoreProductId || product.vendorIdentifier === normalizedStoreProductId
    }
    return product.packageName === normalizedStoreProductId || product.bundleIdentifier === normalizedStoreProductId || product.vendorIdentifier === normalizedStoreProductId
  }) || null
}

function productOptionLabel(product: AppfiguresAdminProduct): string {
  const parts = [product.name]
  if (product.developer) parts.push(product.developer)
  parts.push(`#${product.id}`)
  if (product.store === 'apple' && product.refNo) parts.push(`App ID ${product.refNo}`)
  if (product.store === 'google_play' && (product.packageName || product.bundleIdentifier)) {
    parts.push(product.packageName || product.bundleIdentifier || '')
  }
  if (!product.active) parts.push('inactive')
  return parts.filter(Boolean).join(' · ')
}

export default function MetaPanel() {
  const s = useAdminStore()
  const tagInputRef = useRef<HTMLInputElement>(null)
  const [products, setProducts] = useState<AppfiguresAdminProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [productsError, setProductsError] = useState('')

  const loadProducts = async () => {
    if (isLoadingProducts) return
    setIsLoadingProducts(true)
    setProductsError('')
    try {
      const response = await fetch(ADMIN_APPFIGURES_PRODUCTS_API, { method: 'GET', cache: 'no-store' })
      if (response.status === 401) {
        window.location.href = '/admin/login'
        return
      }

      const payload = await response.json() as {
        configured?: boolean
        error?: string
        products?: AppfiguresAdminProduct[]
      }

      if (!response.ok || payload.configured === false) {
        setProducts([])
        setProductsError(payload.error || 'Failed to load Appfigures products.')
        return
      }

      setProducts(Array.isArray(payload.products) ? payload.products : [])
      if (payload.error) {
        setProductsError(payload.error)
      }
    } catch (error) {
      setProducts([])
      setProductsError(error instanceof Error ? error.message : 'Failed to load Appfigures products.')
    } finally {
      setIsLoadingProducts(false)
    }
  }

  useEffect(() => {
    void loadProducts()
    // component is only mounted while this panel is active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = input.value.trim().replace(/,$/, '')
      if (val && !s.tags.includes(val)) {
        s.setField('tags', [...s.tags, val])
      }
      input.value = ''
    }
    if (e.key === 'Backspace' && input.value === '' && s.tags.length) {
      s.setField('tags', s.tags.slice(0, -1))
    }
  }

  const removeTag = (i: number) => {
    s.setField('tags', s.tags.filter((_, idx) => idx !== i))
  }

  const appStatus = s.currentAppId ? s.apps.find(a => a.id === s.currentAppId)?.status || 'draft' : 'draft'
  const appleProducts = products.filter((product) => product.store === 'apple')
  const googleProducts = products.filter((product) => product.store === 'google_play')
  const selectedAppleProduct = findMatchingProduct(appleProducts, 'apple', s.appfiguresAppleProductId, s.appfiguresAppleAppId)
  const selectedGoogleProduct = findMatchingProduct(googleProducts, 'google_play', s.appfiguresGoogleProductId, s.appfiguresGooglePackageName)

  const selectAppleProduct = (selectedId: string) => {
    const selected = appleProducts.find((product) => product.id === selectedId)
    s.setField('appfiguresAppleProductId', selected?.id || '')
    s.setField('appfiguresAppleAppId', selected?.refNo || selected?.vendorIdentifier || '')
  }

  const selectGoogleProduct = (selectedId: string) => {
    const selected = googleProducts.find((product) => product.id === selectedId)
    s.setField('appfiguresGoogleProductId', selected?.id || '')
    s.setField('appfiguresGooglePackageName', selected?.packageName || selected?.bundleIdentifier || selected?.vendorIdentifier || '')
  }

  return (
    <div>
      <div className="panel-header">
        <div><div className="panel-title">Meta & Identity</div><div className="panel-subtitle">Core app identity, badge, tags, and asking price</div></div>
      </div>

      {/* App Identity */}
      <div className="card">
        <div className="card-header"><div className="card-title">App Identity</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-2" style={{ marginBottom: 14 }}>
            <div className="field">
              <label className="field-label">App Name</label>
              <input type="text" value={s.metaName} onChange={e => s.setField('metaName', e.target.value)} placeholder="e.g. Coachify" />
            </div>
            <div className="field">
              <label className="field-label">Tagline</label>
              <input type="text" value={s.metaTagline} onChange={e => s.setField('metaTagline', e.target.value)} placeholder="e.g. AI Workouts" />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">Hero Description</label>
            <textarea value={s.metaDescription} onChange={e => s.setField('metaDescription', e.target.value)} rows={3} placeholder="Compelling one-paragraph description for acquirers..." />
          </div>
          <div className="form-grid form-grid-3">
            <div className="field">
              <label className="field-label">Category</label>
              <select value={s.metaCategory} onChange={e => s.setField('metaCategory', e.target.value)}>
                {['Utilities','Health & Fitness','Photo & Video','Education','Graphics & Design','Lifestyle','Reference','Productivity','Social Networking','Entertainment','Finance','Food & Drink','Portfolio','Personalization','Business','Music','Navigation','Shopping','Sports','Tools','Weather','Books','Kids','Gaming'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Platforms</label>
              <select value={s.metaPlatforms} onChange={e => s.setField('metaPlatforms', e.target.value)}>
                {['iOS + Android','iOS Only','Android Only','Web + Mobile'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Business Model</label>
              <select value={s.metaModel} onChange={e => s.setField('metaModel', e.target.value)}>
                {['AI / Subscription','Subscription','Freemium','One-Time Purchase','Ad-Supported','B2B SaaS','IAP','IAP + AdMon','AdMon'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Badge */}
      <div className="card">
        <div className="card-header"><div className="card-title">App Badge</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-2">
            <div className="field">
              <label className="field-label">Badge Label</label>
              <input type="text" value={s.metaBadge} onChange={e => s.setField('metaBadge', e.target.value)} placeholder="e.g. Acquisition Opportunity · Health & Fitness" />
            </div>
            <div className="field">
              <label className="field-label">Asking Price Label</label>
              <input type="text" value={s.metaAsking} onChange={e => s.setField('metaAsking', e.target.value)} placeholder="e.g. Asking ~3.5× ARR" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Store & Web Links</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-3">
            <div className="field">
              <label className="field-label">App Store URL</label>
              <input type="url" value={s.metaAppStoreUrl} onChange={e => s.setField('metaAppStoreUrl', e.target.value)} placeholder="https://apps.apple.com/..." />
            </div>
            <div className="field">
              <label className="field-label">Play Store URL</label>
              <input type="url" value={s.metaPlayStoreUrl} onChange={e => s.setField('metaPlayStoreUrl', e.target.value)} placeholder="https://play.google.com/..." />
            </div>
            <div className="field">
              <label className="field-label">Website URL</label>
              <input type="url" value={s.metaWebsiteUrl} onChange={e => s.setField('metaWebsiteUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Appfigures</div></div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              {products.length > 0
                ? `Loaded ${products.length} product${products.length === 1 ? '' : 's'} from Appfigures`
                : 'Load products from your Appfigures account and pick them instead of pasting IDs.'}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void loadProducts()}>
              {isLoadingProducts ? 'Loading…' : 'Refresh Products'}
            </button>
          </div>
          {productsError ? (
            <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 12, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.16)', color: '#8f2d2d', fontSize: 12 }}>
              {productsError}
            </div>
          ) : null}
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">Default Country</label>
            <input
              type="text"
              value={s.appfiguresDefaultCountry}
              onChange={e => s.setField('appfiguresDefaultCountry', e.target.value.toUpperCase())}
              placeholder="US"
              maxLength={2}
            />
            <div className="field-hint">Used for country-scoped Appfigures endpoints like ratings, reviews, ranks, and featured placements.</div>
          </div>
          <div className="form-grid form-grid-2" style={{ marginBottom: 14 }}>
            <div className="field">
              <label className="field-label">Pick iOS Product</label>
              <select
                value={selectedAppleProduct?.id || ''}
                onChange={e => selectAppleProduct(e.target.value)}
              >
                <option value="">Choose an Appfigures iOS product…</option>
                {appleProducts.map(product => (
                  <option key={product.id} value={product.id}>{productOptionLabel(product)}</option>
                ))}
              </select>
              <div className="field-hint">Selecting a product auto-fills both the Appfigures product ID and Apple App ID.</div>
            </div>
            <div className="field">
              <label className="field-label">Pick Android Product</label>
              <select
                value={selectedGoogleProduct?.id || ''}
                onChange={e => selectGoogleProduct(e.target.value)}
              >
                <option value="">Choose an Appfigures Google Play product…</option>
                {googleProducts.map(product => (
                  <option key={product.id} value={product.id}>{productOptionLabel(product)}</option>
                ))}
              </select>
              <div className="field-hint">Selecting a product auto-fills both the Appfigures product ID and package name.</div>
            </div>
          </div>
          <div className="form-grid form-grid-2" style={{ marginBottom: 14 }}>
            <div className="field">
              <label className="field-label">Appfigures Apple Product ID</label>
              <input
                type="text"
                value={s.appfiguresAppleProductId}
                onChange={e => s.setField('appfiguresAppleProductId', e.target.value)}
                placeholder="Optional Appfigures product id"
              />
            </div>
            <div className="field">
              <label className="field-label">Apple App ID</label>
              <input
                type="text"
                value={s.appfiguresAppleAppId}
                onChange={e => s.setField('appfiguresAppleAppId', e.target.value)}
                placeholder="e.g. 1234567890"
              />
            </div>
          </div>
          <div className="form-grid form-grid-2">
            <div className="field">
              <label className="field-label">Appfigures Google Product ID</label>
              <input
                type="text"
                value={s.appfiguresGoogleProductId}
                onChange={e => s.setField('appfiguresGoogleProductId', e.target.value)}
                placeholder="Optional Appfigures product id"
              />
            </div>
            <div className="field">
              <label className="field-label">Google Play Package Name</label>
              <input
                type="text"
                value={s.appfiguresGooglePackageName}
                onChange={e => s.setField('appfiguresGooglePackageName', e.target.value)}
                placeholder="e.g. com.example.app"
              />
            </div>
          </div>
          {(selectedAppleProduct || selectedGoogleProduct) ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              {selectedAppleProduct ? (
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.36)', border: '1px solid rgba(255,255,255,0.58)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{selectedAppleProduct.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                    Apple · {selectedAppleProduct.developer || 'Unknown developer'} · App ID {selectedAppleProduct.refNo || selectedAppleProduct.vendorIdentifier || 'N/A'}
                  </div>
                </div>
              ) : null}
              {selectedGoogleProduct ? (
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.36)', border: '1px solid rgba(255,255,255,0.58)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{selectedGoogleProduct.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                    Google Play · {selectedGoogleProduct.developer || 'Unknown developer'} · {selectedGoogleProduct.packageName || selectedGoogleProduct.bundleIdentifier || 'No package name'}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="field-hint" style={{ marginTop: 10 }}>
            If product IDs are blank the public page will try to resolve products from the Apple App ID or package name. The server still needs `APPFIGURES_TOKEN` configured.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Developer Country</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-2">
            <div className="field">
              <label className="field-label">Country</label>
              <input type="text" value={s.metaDeveloperCountry} onChange={e => s.setField('metaDeveloperCountry', e.target.value)} placeholder="United States" />
            </div>
            <div className="field">
              <label className="field-label">Flag Emoji</label>
              <input type="text" value={s.metaDeveloperFlag} onChange={e => s.setField('metaDeveloperFlag', e.target.value)} placeholder="🇺🇸" />
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="card">
        <div className="card-header"><div className="card-title">Tags</div></div>
        <div className="card-body">
          <div className="field">
            <label className="field-label">App Tags</label>
            <div className="tag-editor" onClick={() => tagInputRef.current?.focus()}>
              {s.tags.map((t, i) => (
                <span key={i} className="tag-pill">
                  {t} <span className="remove" onClick={() => removeTag(i)}>×</span>
                </span>
              ))}
              <input ref={tagInputRef} type="text" className="tag-input-field" placeholder="Type tag + Enter…" onKeyDown={handleTagKey} />
            </div>
            <div className="field-hint">Press Enter or comma to add. Click × to remove.</div>
          </div>
        </div>
      </div>

      {/* Status & Visibility */}
      <div className="card">
        <div className="card-header"><div className="card-title">Status & Visibility</div></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="toggle-field">
            <div><div className="toggle-label">Featured</div><div className="toggle-desc">Show in featured/highlighted apps</div></div>
            <button className={`toggle${s.featured ? ' on' : ''}`} onClick={() => s.setField('featured', !s.featured)} />
          </div>
          <div className="toggle-field">
            <div><div className="toggle-label">NDA Required</div><div className="toggle-desc">Show NDA gate before full data room</div></div>
            <button className={`toggle${s.ndaRequired ? ' on' : ''}`} onClick={() => s.setField('ndaRequired', !s.ndaRequired)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.55)', fontSize: 12, color: '#666' }}>
            <span>{appStatus === 'published' ? '🟢' : '📝'}</span>
            <span>Status: <strong style={{ color: appStatus === 'published' ? '#2d7a4f' : '#111' }}>{appStatus}</strong> — use <strong style={{ color: '#2d7a4f' }}>Publish App</strong> in the topbar to go live</span>
          </div>
        </div>
      </div>
    </div>
  )
}
