const API_BASE = '/api'

export interface RelayChain {
  id: number
  name: string
  displayName: string
  explorerUrl: string
  currency: { symbol: string }
}

export interface RelayLeg {
  currency: {
    chainId: number
    symbol: string
    name: string
    metadata?: { logoURI?: string }
  }
  amountFormatted: string
  amountUsd: string
}

export interface RelayTx {
  hash?: string
  chainId: number
}

export interface RelayRequest {
  id: string
  status: 'success' | 'pending' | 'failure' | 'refund' | string
  user: string
  recipient: string
  createdAt: string
  data?: {
    inTxs?: RelayTx[]
    outTxs?: RelayTx[]
    metadata?: {
      currencyIn?: RelayLeg
      currencyOut?: RelayLeg
    }
  }
}

interface RequestsResponse {
  requests: RelayRequest[]
  continuation?: string | null
}

let chainsCache: Promise<Map<number, RelayChain>> | null = null

export function fetchChains(): Promise<Map<number, RelayChain>> {
  if (!chainsCache) {
    chainsCache = fetch(`${API_BASE}/relay-chains`)
      .then((res) => {
        if (!res.ok) throw new Error(`chains request failed (${res.status})`)
        return res.json()
      })
      .then((json: { chains: RelayChain[] }) => {
        const map = new Map<number, RelayChain>()
        for (const chain of json.chains) map.set(chain.id, chain)
        return map
      })
      .catch((err) => {
        chainsCache = null
        throw err
      })
  }
  return chainsCache
}

const PAGE_LIMIT = 50
const MAX_PAGES = 40 // hard cap (~2000 records) so one whale address can't hang the page

export async function fetchAllRequests(
  address: string,
  signal: AbortSignal,
  onPage?: (loaded: number) => void,
): Promise<RelayRequest[]> {
  const all: RelayRequest[] = []
  let continuation: string | undefined
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ user: address, limit: String(PAGE_LIMIT) })
    if (continuation) params.set('continuation', continuation)

    const res = await fetch(`${API_BASE}/relay-requests?${params}`, { signal })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error ?? `Relay API request failed (${res.status})`)
    }
    const json: RequestsResponse = await res.json()

    all.push(...json.requests)
    onPage?.(all.length)

    if (!json.continuation || json.requests.length < PAGE_LIMIT) break
    continuation = json.continuation
  }
  return all
}

export function isValidAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim())
}
