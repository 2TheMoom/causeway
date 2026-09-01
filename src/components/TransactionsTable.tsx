import type { RelayChain, RelayRequest } from '../lib/relay'
import { formatDate, formatUsdFull, formatRelativeTime } from '../lib/format'

interface Props {
  requests: RelayRequest[]
  chains: Map<number, RelayChain>
}

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  success: { color: 'var(--status-good)', label: 'Success' },
  pending: { color: 'var(--status-warning)', label: 'Pending' },
  failure: { color: 'var(--status-critical)', label: 'Failed' },
  refund: { color: 'var(--status-critical)', label: 'Refunded' },
}

function explorerLink(req: RelayRequest, chains: Map<number, RelayChain>): string | null {
  const tx = req.data?.outTxs?.[0] ?? req.data?.inTxs?.[0]
  if (!tx?.hash) return null
  const chain = chains.get(tx.chainId)
  if (!chain?.explorerUrl) return null
  return `${chain.explorerUrl}/tx/${tx.hash}`
}

export function TransactionsTable({ requests, chains }: Props) {
  if (requests.length === 0) {
    return (
      <div
        className="grid h-[160px] place-items-center rounded-2xl border text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-muted)' }}
      >
        No transactions yet
      </div>
    )
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-[var(--shadow-card)]"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
    >
      <div className="border-b p-4 text-[13px] font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        Recent transactions
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr style={{ color: 'var(--text-muted)' }}>
              <th className="px-4 py-2 text-left text-xs font-medium">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Route</th>
              <th className="px-4 py-2 text-right text-xs font-medium">Amount</th>
              <th className="px-4 py-2 text-right text-xs font-medium">Status</th>
              <th className="w-8 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const meta = req.data?.metadata
              const originChain = meta?.currencyIn ? chains.get(meta.currencyIn.currency.chainId) : undefined
              const destChain = meta?.currencyOut ? chains.get(meta.currencyOut.currency.chainId) : undefined
              const usd = meta?.currencyIn?.amountUsd ?? meta?.currencyOut?.amountUsd
              const status = STATUS_STYLE[req.status] ?? { color: 'var(--text-muted)', label: req.status }
              const link = explorerLink(req, chains)

              return (
                <tr key={req.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }} title={formatDate(req.createdAt)}>
                    {formatRelativeTime(req.createdAt)}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                    <span className="font-medium">{meta?.currencyIn?.currency.symbol ?? '—'}</span>
                    <span style={{ color: 'var(--text-muted)' }}> on {originChain?.displayName ?? 'Unknown'}</span>
                    <span style={{ color: 'var(--text-muted)' }}> → </span>
                    <span className="font-medium">{meta?.currencyOut?.currency.symbol ?? '—'}</span>
                    <span style={{ color: 'var(--text-muted)' }}> on {destChain?.displayName ?? 'Unknown'}</span>
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right" style={{ color: 'var(--text-primary)' }}>
                    {usd ? formatUsdFull(Number.parseFloat(usd)) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: status.color }}>
                      <span className="inline-block size-1.5 rounded-full" style={{ background: status.color }} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="View transaction on block explorer"
                        className="inline-flex size-6 items-center justify-center rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <path d="M15 3h6v6" />
                          <path d="M10 14 21 3" />
                        </svg>
                      </a>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
