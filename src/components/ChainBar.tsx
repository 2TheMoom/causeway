import { useState } from 'react'
import type { ChainActivity } from '../lib/aggregate'
import { formatUsdCompact, formatUsdFull } from '../lib/format'

interface Props {
  chains: ChainActivity[]
}

const MAX_ROWS = 8

export function ChainBar({ chains }: Props) {
  const [hoverKey, setHoverKey] = useState<number | null>(null)

  const top = chains.slice(0, MAX_ROWS)
  const rest = chains.slice(MAX_ROWS)
  const restVolume = rest.reduce((sum, c) => sum + c.volumeUsd, 0)
  const restCount = rest.reduce((sum, c) => sum + c.count, 0)

  const rows =
    restVolume > 0
      ? [...top, { chainId: -1, name: 'Other chains', volumeUsd: restVolume, count: restCount }]
      : top

  const maxVol = Math.max(...rows.map((r) => r.volumeUsd), 1)

  if (rows.length === 0) {
    return (
      <div
        className="grid h-[220px] place-items-center rounded-2xl border text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-muted)' }}
      >
        No chain activity yet
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border p-4 shadow-[var(--shadow-card)]"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
    >
      <div className="mb-4 text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        Activity by chain
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const pct = (row.volumeUsd / maxVol) * 100
          const isHovered = hoverKey === row.chainId
          return (
            <div
              key={row.chainId}
              className="group"
              onPointerEnter={() => setHoverKey(row.chainId)}
              onPointerLeave={() => setHoverKey(null)}
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {row.name}
                </span>
                <span className="font-mono-tabular" style={{ color: 'var(--text-secondary)' }}>
                  {isHovered ? `${formatUsdFull(row.volumeUsd)} · ${row.count} tx` : formatUsdCompact(row.volumeUsd)}
                </span>
              </div>
              <div className="h-[10px] rounded-full" style={{ background: 'var(--gridline)' }}>
                <div
                  className="h-full rounded-full transition-[opacity,width] duration-150"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: 'var(--series-1)',
                    opacity: isHovered ? 0.85 : 1,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
