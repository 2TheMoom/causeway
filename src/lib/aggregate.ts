import type { RelayChain, RelayRequest } from './relay'

export interface ChainActivity {
  chainId: number
  name: string
  volumeUsd: number
  count: number
}

export interface TokenActivity {
  symbol: string
  logoURI?: string
  volumeUsd: number
  count: number
}

export interface TimeBucket {
  label: string
  start: number
  volumeUsd: number
  count: number
}

export interface AddressStats {
  totalVolumeUsd: number
  totalTransactions: number
  successCount: number
  pendingCount: number
  failedCount: number
  chains: ChainActivity[]
  tokens: TokenActivity[]
  series: TimeBucket[]
  firstSeenAt: string | null
  lastSeenAt: string | null
  recent: RelayRequest[]
}

function volumeOf(req: RelayRequest): number {
  const meta = req.data?.metadata
  const usd = meta?.currencyIn?.amountUsd ?? meta?.currencyOut?.amountUsd
  const parsed = usd ? Number.parseFloat(usd) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

function chainName(chains: Map<number, RelayChain>, id: number | undefined): string {
  if (id === undefined) return 'Unknown'
  return chains.get(id)?.displayName ?? `Chain ${id}`
}

function bucketFormat(date: Date, granularity: 'day' | 'week' | 'month'): { label: string; start: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  if (granularity === 'month') {
    d.setUTCDate(1)
    return { label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), start: d.getTime() }
  }
  if (granularity === 'week') {
    const day = d.getUTCDay()
    d.setUTCDate(d.getUTCDate() - day)
    return { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), start: d.getTime() }
  }
  return { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), start: d.getTime() }
}

export function computeStats(requests: RelayRequest[], chains: Map<number, RelayChain>): AddressStats {
  let totalVolumeUsd = 0
  let successCount = 0
  let pendingCount = 0
  let failedCount = 0

  const chainMap = new Map<number, ChainActivity>()
  const tokenMap = new Map<string, TokenActivity>()
  const timestamps: number[] = []

  const sorted = [...requests].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  for (const req of sorted) {
    const vol = volumeOf(req)
    totalVolumeUsd += vol

    if (req.status === 'success') successCount++
    else if (req.status === 'pending') pendingCount++
    else failedCount++

    const meta = req.data?.metadata
    const originId = meta?.currencyIn?.currency.chainId
    const destId = meta?.currencyOut?.currency.chainId
    for (const id of new Set([originId, destId].filter((v): v is number => v !== undefined))) {
      const existing = chainMap.get(id) ?? { chainId: id, name: chainName(chains, id), volumeUsd: 0, count: 0 }
      existing.volumeUsd += vol
      existing.count += 1
      chainMap.set(id, existing)
    }

    const symbol = meta?.currencyIn?.currency.symbol
    if (symbol) {
      const existing = tokenMap.get(symbol) ?? {
        symbol,
        logoURI: meta?.currencyIn?.currency.metadata?.logoURI,
        volumeUsd: 0,
        count: 0,
      }
      existing.volumeUsd += vol
      existing.count += 1
      tokenMap.set(symbol, existing)
    }

    timestamps.push(new Date(req.createdAt).getTime())
  }

  const spanDays =
    timestamps.length > 1 ? (Math.max(...timestamps) - Math.min(...timestamps)) / 86_400_000 : 0
  const granularity: 'day' | 'week' | 'month' = spanDays > 365 ? 'month' : spanDays > 90 ? 'week' : 'day'

  const bucketOrder: string[] = []
  const buckets = new Map<string, TimeBucket>()
  for (const req of sorted) {
    const { label, start } = bucketFormat(new Date(req.createdAt), granularity)
    let bucket = buckets.get(label)
    if (!bucket) {
      bucket = { label, start, volumeUsd: 0, count: 0 }
      buckets.set(label, bucket)
      bucketOrder.push(label)
    }
    bucket.volumeUsd += volumeOf(req)
    bucket.count += 1
  }

  return {
    totalVolumeUsd,
    totalTransactions: requests.length,
    successCount,
    pendingCount,
    failedCount,
    chains: [...chainMap.values()].sort((a, b) => b.volumeUsd - a.volumeUsd),
    tokens: [...tokenMap.values()].sort((a, b) => b.volumeUsd - a.volumeUsd),
    series: bucketOrder.map((label) => buckets.get(label)!).sort((a, b) => a.start - b.start),
    firstSeenAt: sorted[0]?.createdAt ?? null,
    lastSeenAt: sorted[sorted.length - 1]?.createdAt ?? null,
    recent: [...sorted].reverse().slice(0, 25),
  }
}
