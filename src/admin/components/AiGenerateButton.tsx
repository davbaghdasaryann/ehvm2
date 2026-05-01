'use client'

import { useState } from 'react'
import { useAdminStore } from '@/admin/store/adminStore'

type AiGenerateButtonProps = {
  fieldLabel: string
  fieldPath: string
  currentValue: string
  instruction?: string
  onGenerated: (text: string) => void
  className?: string
}

export default function AiGenerateButton({
  fieldLabel,
  fieldPath,
  currentValue,
  instruction,
  onGenerated,
  className = 'btn btn-sm ai-generate-btn',
}: AiGenerateButtonProps) {
  const [loading, setLoading] = useState(false)
  const collectApp = useAdminStore((s) => s.collectApp)
  const showToast = useAdminStore((s) => s.showToast)

  const generate = async () => {
    if (loading) return
    setLoading(true)
    try {
      const response = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldLabel,
          fieldPath,
          currentValue,
          instruction,
          app: collectApp(),
        }),
      })

      if (response.status === 401) {
        window.location.href = '/admin/login'
        return
      }

      const payload = (await response.json()) as { text?: string; error?: string }
      if (!response.ok || !payload.text) {
        showToast(payload.error || 'AI generation failed', '!')
        return
      }

      onGenerated(payload.text)
      showToast(`Generated ${fieldLabel}`, 'AI')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'AI generation failed', '!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" className={className} onClick={generate} disabled={loading} title={`Generate ${fieldLabel} with AI`}>
      <span className="ai-generate-mark" aria-hidden="true">{loading ? '...' : 'AI'}</span>
      <span>{loading ? 'Thinking' : 'Generate'}</span>
    </button>
  )
}
