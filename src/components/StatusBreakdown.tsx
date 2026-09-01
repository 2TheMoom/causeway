interface Props {
  successCount: number
  pendingCount: number
  failedCount: number
}

export function StatusBreakdown({ successCount, pendingCount, failedCount }: Props) {
  const total = successCount + pendingCount + failedCount || 1
  const items = [
    { label: 'Success', count: successCount, color: 'var(--status-good)' },
    { label: 'Pending', count: pendingCount, color: 'var(--status-warning)' },
    { label: 'Failed', count: failedCount, color: 'var(--status-critical)' },
  ]

  return (
    <div
      className="rounded-2xl border p-5 shadow-[var(--shadow-card)]"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
    >
      <div className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        Transaction status
      </div>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full" style={{ background: 'var(--gridline)' }}>
        {items.map(
          (item) =>
            item.count > 0 && (
              <div
                key={item.label}
                style={{
                  width: `${(item.count / total) * 100}%`,
                  background: item.color,
                  marginRight: 2,
                }}
              />
            ),
        )}
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <span className="inline-block size-2 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
            <span className="font-mono-tabular font-medium" style={{ color: 'var(--text-primary)' }}>
              {item.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
