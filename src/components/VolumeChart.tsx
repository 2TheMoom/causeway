import { useEffect, useId, useRef, useState } from 'react'
import type { TimeBucket } from '../lib/aggregate'
import { formatUsdCompact, formatUsdFull } from '../lib/format'
import { smoothLinePath } from '../lib/svgPath'

interface Props {
  series: TimeBucket[]
}

const HEIGHT = 220
const PAD = { top: 20, right: 12, bottom: 26, left: 12 }

export function VolumeChart({ series }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const gradientId = useId()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setWidth(w)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (series.length === 0) {
    return (
      <div
        className="grid h-[220px] place-items-center rounded-2xl border text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-muted)' }}
      >
        No volume in this window
      </div>
    )
  }

  const maxVol = Math.max(...series.map((b) => b.volumeUsd), 1)
  const innerW = width - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom

  const points = series.map((bucket, i) => {
    const x = PAD.left + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW)
    const y = PAD.top + innerH - (bucket.volumeUsd / maxVol) * innerH
    return { x, y, bucket }
  })

  const linePath = smoothLinePath(points)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD.top + innerH} L ${points[0].x} ${PAD.top + innerH} Z`

  const labelStep = Math.max(1, Math.ceil(series.length / 6))
  const hovered = hoverIdx !== null ? points[hoverIdx] : null

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    let closest = 0
    let closestDist = Infinity
    points.forEach((p, i) => {
      const d = Math.abs(p.x - x)
      if (d < closestDist) {
        closestDist = d
        closest = i
      }
    })
    setHoverIdx(closest)
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl border p-4 shadow-[var(--shadow-card)]"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
    >
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          Volume over time
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatUsdCompact(maxVol)} peak
        </span>
      </div>

      <svg
        width={width}
        height={HEIGHT}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIdx(null)}
        className="touch-none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <line
            key={frac}
            x1={PAD.left}
            x2={width - PAD.right}
            y1={PAD.top + innerH * (1 - frac)}
            y2={PAD.top + innerH * (1 - frac)}
            stroke="var(--gridline)"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 || i === hoverIdx ? 4 : 0}
            fill="var(--series-1)"
            stroke="var(--surface-1)"
            strokeWidth={2}
          />
        ))}

        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="var(--baseline)"
            strokeWidth={1}
          />
        )}

        {points.map(
          (p, i) =>
            i % labelStep === 0 && (
              <text
                key={i}
                x={p.x}
                y={HEIGHT - 6}
                fontSize={11}
                textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
                fill="var(--text-muted)"
              >
                {p.bucket.label}
              </text>
            ),
        )}

        <text
          x={points[points.length - 1].x}
          y={points[points.length - 1].y - 10}
          textAnchor="end"
          fontSize={12}
          fontWeight={600}
          fill="var(--text-primary)"
        >
          {formatUsdCompact(points[points.length - 1].bucket.volumeUsd)}
        </text>
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-4 rounded-xl border px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(hovered.x - 60, 0), width - 140),
            background: 'var(--surface-2)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            {hovered.bucket.label}
          </div>
          <div className="font-mono-tabular mt-0.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatUsdFull(hovered.bucket.volumeUsd)}
          </div>
          <div style={{ color: 'var(--text-muted)' }}>{hovered.bucket.count} tx</div>
        </div>
      )}
    </div>
  )
}
