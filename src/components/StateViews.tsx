export function LoadingState({ loadedCount }: { loadedCount: number }) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <div
        className="size-8 animate-spin rounded-full border-2 border-transparent"
        style={{ borderTopColor: 'var(--series-1)', borderRightColor: 'var(--series-1)' }}
      />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Pulling transactions from Relay
        {loadedCount > 0 && <span className="font-mono-tabular"> · {loadedCount} loaded</span>}
      </p>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl border py-16 text-center"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--status-critical)' }}>
        Couldn't load activity for that address
      </p>
      <p className="max-w-sm text-xs" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <div
        className="grid size-14 place-items-center rounded-2xl border"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Track any wallet's Relay activity
      </p>
      <p className="max-w-xs text-xs" style={{ color: 'var(--text-muted)' }}>
        Paste an address above to see its total bridge &amp; swap volume, transaction history, and chain activity.
      </p>
    </div>
  )
}

export function NoActivityState() {
  return (
    <div className="flex flex-col items-center gap-2 py-24 text-center">
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        No Relay activity found
      </p>
      <p className="max-w-xs text-xs" style={{ color: 'var(--text-muted)' }}>
        This address hasn't made any bridge or swap transactions through Relay yet.
      </p>
    </div>
  )
}
