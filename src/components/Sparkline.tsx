import { smoothLinePath } from '../lib/svgPath'

interface Props {
  values: number[]
  width?: number
  height?: number
}

/** 12-point trend line per the stat-tile figure contract: de-emphasis hue, current period in the accent. */
export function Sparkline({ values, width = 64, height = 24 }: Props) {
  const recent = values.slice(-12)
  if (recent.length < 2) return null

  const max = Math.max(...recent, 1)
  const min = Math.min(...recent, 0)
  const range = max - min || 1
  const pad = 2
  const points = recent.map((v, i) => ({
    x: pad + (i / (recent.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2),
  }))

  const allPath = smoothLinePath(points)
  const lastSegmentPath = smoothLinePath(points.slice(-2))
  const last = points[points.length - 1]

  return (
    <svg width={width} height={height} className="shrink-0">
      <path d={allPath} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
      <path d={lastSegmentPath} fill="none" stroke="var(--series-1)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={2.5} fill="var(--series-1)" stroke="var(--surface-1)" strokeWidth={1.5} />
    </svg>
  )
}
