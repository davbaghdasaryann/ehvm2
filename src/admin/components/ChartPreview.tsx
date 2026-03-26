'use client'
import { useEffect, useRef } from 'react'

type ChartType = 'line' | 'bar' | 'doughnut' | 'pie' | 'horizontalBar'

interface Dataset {
  label: string
  data: string
  color: string
  colors?: string
}

interface ChartPreviewProps {
  type: ChartType
  title: string
  subtitle: string
  labels: string
  datasets: Dataset[]
}

function normalizeChartType(type: string): { resolvedType: 'line' | 'bar' | 'doughnut' | 'pie'; indexAxis: 'x' | 'y' } {
  if (type === 'horizontalBar') return { resolvedType: 'bar', indexAxis: 'y' }
  if (type === 'line' || type === 'bar' || type === 'doughnut' || type === 'pie')
    return { resolvedType: type, indexAxis: 'x' }
  return { resolvedType: 'line', indexAxis: 'x' }
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.trim()
  const full = /^#([0-9a-f]{6})$/i
  const short = /^#([0-9a-f]{3})$/i
  let val = 0
  if (full.test(normalized)) val = Number.parseInt(normalized.slice(1), 16)
  else if (short.test(normalized)) {
    const ex = normalized.slice(1).split('').map((c) => c + c).join('')
    val = Number.parseInt(ex, 16)
  } else return `rgba(26,26,26,${alpha})`
  return `rgba(${(val >> 16) & 255},${(val >> 8) & 255},${val & 255},${alpha})`
}

export default function ChartPreview({ type, title, subtitle, labels, datasets }: ChartPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const instanceRef = useRef<{ destroy: () => void } | null>(null)

  useEffect(() => {
    const renderChart = async () => {
      if (!canvasRef.current) return

      const chartModule = await import('chart.js/auto')
      const Chart = chartModule.default

      const labelArray = labels.split(',').map((l) => l.trim()).filter(Boolean)
      const normalizedDatasets = datasets
        .map((ds) => {
          const dataArray = ds.data.split(',').map((d) => Number.parseFloat(d.trim())).filter(Boolean)
          if (dataArray.length === 0) return null

          const { resolvedType } = normalizeChartType(type)
          const isPie = resolvedType === 'pie' || resolvedType === 'doughnut'
          const color = ds.color || '#1a1a1a'

          let backgroundColor: string | string[] = hexToRgba(color, 0.75)
          let borderColor: string | string[] = isPie ? '#fff' : color

          if (ds.colors) {
            const colorsArray = ds.colors.split(',').map((c) => c.trim()).filter(Boolean)
            if (colorsArray.length > 0) {
              backgroundColor = colorsArray
              if (!isPie && resolvedType === 'bar') {
                borderColor = colorsArray
              }
            }
          }

          if (isPie) {
            borderColor = '#fff'
          } else if (resolvedType === 'line') {
            backgroundColor = hexToRgba(color, 0.08)
          }

          return {
            label: ds.label || 'Series',
            data: dataArray,
            borderColor,
            backgroundColor,
            borderWidth: isPie ? 2 : resolvedType === 'line' ? 2 : 1,
            borderRadius: 4,
            pointRadius: 3,
            fill: resolvedType === 'line',
            tension: 0.4,
          }
        })
        .filter((ds): ds is Exclude<typeof ds, null> => ds !== null)

      if (normalizedDatasets.length === 0 || labelArray.length === 0) return

      const { resolvedType, indexAxis } = normalizeChartType(type)

      if (instanceRef.current) instanceRef.current.destroy()

      instanceRef.current = new Chart(canvasRef.current, {
        type: resolvedType,
        data: {
          labels: labelArray,
          datasets: normalizedDatasets,
        },
        options: {
          indexAxis,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: resolvedType === 'pie' || resolvedType === 'doughnut' ? false : true },
          },
          scales:
            resolvedType === 'pie' || resolvedType === 'doughnut'
              ? {}
              : {
                  x: { grid: { display: false }, border: { display: false } },
                  y: { grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false } },
                },
          cutout: resolvedType === 'doughnut' ? '60%' : undefined,
        },
      })
    }

    void renderChart()

    return () => {
      if (instanceRef.current) instanceRef.current.destroy()
    }
  }, [type, labels, datasets])

  return (
    <div className="bg-tag rounded-icon p-[12px]">
      <p className="text-[12px] font-bold text-caption mb-[8px]">PREVIEW</p>
      <div className="relative h-[280px] bg-white rounded-[8px] overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
