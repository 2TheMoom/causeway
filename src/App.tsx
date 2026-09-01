import { AddressBar } from './components/AddressBar'
import { ThemeToggle } from './components/ThemeToggle'
import { StatTile } from './components/StatTile'
import { StatusBreakdown } from './components/StatusBreakdown'
import { VolumeChart } from './components/VolumeChart'
import { ChainBar } from './components/ChainBar'
import { TransactionsTable } from './components/TransactionsTable'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { Identicon } from './components/Identicon'
import { CopyButton } from './components/CopyButton'
import { ErrorState, EmptyState, NoActivityState } from './components/StateViews'
import { useTheme } from './hooks/useTheme'
import { useAddressTracker } from './hooks/useAddressTracker'
import { useRecentAddresses } from './hooks/useRecentAddresses'
import { isValidAddress } from './lib/relay'
import { formatCompactNumber, formatDate, formatUsdCompact, shortenAddress } from './lib/format'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { status, stats, chains, loadedCount, error, lookup } = useAddressTracker()
  const { recent, remember } = useRecentAddresses()

  function handleSubmit(address: string) {
    const trimmed = address.trim()
    if (isValidAddress(trimmed)) remember(trimmed)
    lookup(trimmed)
  }

  return (
    <div className="min-h-full">
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-0) 80%, transparent)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M2 17h4l2.5-9L12 20l3.5-12L18 17h4" stroke="var(--series-1)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[17px] font-bold tracking-tight">Causeway</span>
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <div className="relative py-14 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[280px] w-[560px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.15] blur-[80px]"
            style={{ background: 'var(--series-1)' }}
          />
          <h1 className="relative text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Track any wallet's Relay activity
          </h1>
          <p className="relative mx-auto mt-3 max-w-lg text-[15px]" style={{ color: 'var(--text-secondary)' }}>
            Total volume, transactions, and chain activity for any address on the Relay bridge — live, no signup.
          </p>
        </div>

        <div className="mx-auto max-w-xl">
          <AddressBar onSubmit={handleSubmit} isInvalid={status === 'invalid'} recent={recent} />
        </div>

        <div className="mt-10">
          {status === 'idle' && <EmptyState />}
          {status === 'invalid' && <EmptyState />}

          {status === 'loading' && (
            <div className="rise-in">
              {loadedCount > 0 && (
                <p className="mb-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-mono-tabular">{loadedCount}</span> transactions loaded…
                </p>
              )}
              <DashboardSkeleton />
            </div>
          )}

          {status === 'error' && error && <ErrorState message={error} />}

          {status === 'loaded' && stats && stats.totalTransactions === 0 && <NoActivityState />}

          {status === 'loaded' && stats && stats.totalTransactions > 0 && (
            <div className="rise-in flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <Identicon address={stats.recent[0]?.user ?? ''} size={24} />
                  <span className="font-mono-tabular text-sm" style={{ color: 'var(--text-primary)' }}>
                    {shortenAddress(stats.recent[0]?.user ?? '', 6)}
                  </span>
                  <CopyButton value={stats.recent[0]?.user ?? ''} />
                </div>
                {stats.firstSeenAt && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    First seen on Relay {formatDate(stats.firstSeenAt)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatTile
                  label="Total volume"
                  value={formatUsdCompact(stats.totalVolumeUsd)}
                  trend={stats.series.map((b) => b.volumeUsd)}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  }
                />
                <StatTile
                  label="Transactions"
                  value={formatCompactNumber(stats.totalTransactions)}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  }
                />
                <StatTile
                  label="Success rate"
                  value={`${Math.round((stats.successCount / stats.totalTransactions) * 100)}%`}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m20 6-11 11-5-5" />
                    </svg>
                  }
                />
                <StatTile
                  label="Chains touched"
                  value={String(stats.chains.length)}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
                <VolumeChart series={stats.series} />
                <StatusBreakdown
                  successCount={stats.successCount}
                  pendingCount={stats.pendingCount}
                  failedCount={stats.failedCount}
                />
              </div>

              <ChainBar chains={stats.chains} />

              <TransactionsTable requests={stats.recent} chains={chains} />
            </div>
          )}
        </div>
      </main>

      <footer className="mx-auto max-w-5xl px-6 pb-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Data via the public{' '}
        <a href="https://docs.relay.link" target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2">
          Relay API
        </a>
        . Not affiliated with Relay Protocol.
      </footer>
    </div>
  )
}

export default App
