import type { ReactNode } from 'react'
import { Sparkline } from './Sparkline'

interface Props {
  label: string
  value: string
  sublabel?: string
  icon?: ReactNode
  trend?: number[]
}

export function StatTile({ label, value, sublabel, icon, trend }: Props) {
  return (
    <div
      className="rounded-2xl border p-5 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span
            className="grid size-7 shrink-0 place-items-center rounded-lg"
            style={{ background: 'color-mix(in srgb, var(--series-1) 12%, transparent)', color: 'var(--series-1)' }}
          >
            {icon}
          </span>
        )}
        <div className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="text-[28px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {value}
        </div>
        {trend && trend.length >= 2 && <Sparkline values={trend} />}
      </div>
      {sublabel && (
        <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {sublabel}
        </div>
      )}
    </div>
  )
}
