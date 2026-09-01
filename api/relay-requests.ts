import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = { maxDuration: 30 }

const RELAY_BASE = 'https://api.relay.link'
const PAGE_LIMIT = 50
const MAX_PAGES = 20
const MAX_RETRIES_PER_PAGE = 4
const TIME_BUDGET_MS = 25_000
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

// Shape the rest of the app is built against (originally v2's shape). The v3
// response is structurally different, so it's normalized into this on the way
// out — nothing downstream of this file needs to know v3 exists.
interface NormalizedLeg {
  currency: {
    chainId: number
    symbol: string
    name: string
    metadata?: { logoURI?: string }
  }
  amountFormatted: string
  amountUsd: string
}

interface NormalizedRequest {
  id: string
  status: string
  user: string
  recipient: string
  createdAt: string
  data: {
    inTxs: { hash?: string; chainId: number }[]
    outTxs: { hash?: string; chainId: number }[]
    metadata: {
      currencyIn: NormalizedLeg | null
      currencyOut: NormalizedLeg | null
    }
  }
}

interface V3Currency {
  currency: NormalizedLeg['currency']
  amountFormatted: string
  amountUsd: string
}

interface V3RoutePhase {
  origin?: { inputCurrency?: V3Currency | null; outputCurrency?: V3Currency | null } | null
  destination?: { inputCurrency?: V3Currency | null; outputCurrency?: V3Currency | null } | null
}

interface V3Tx {
  txHash?: string
  chainId: number
}

interface V3Request {
  id: string
  status: string
  user: string
  recipient: string
  createdAt: string
  data?: {
    inTxs?: V3Tx[]
    outTxs?: V3Tx[]
    route?: { actual?: V3RoutePhase | null; quoted?: V3RoutePhase | null } | null
  }
}

interface V3Page {
  requests: V3Request[]
  continuation?: string | null
}

function normalize(req: V3Request): NormalizedRequest {
  const phase = req.data?.route?.actual ?? req.data?.route?.quoted
  const currencyIn = phase?.origin?.inputCurrency ?? null
  const currencyOut = phase?.destination?.outputCurrency ?? phase?.origin?.outputCurrency ?? null

  return {
    id: req.id,
    status: req.status,
    user: req.user,
    recipient: req.recipient,
    createdAt: req.createdAt,
    data: {
      inTxs: (req.data?.inTxs ?? []).map((tx) => ({ hash: tx.txHash, chainId: tx.chainId })),
      outTxs: (req.data?.outTxs ?? []).map((tx) => ({ hash: tx.txHash, chainId: tx.chainId })),
      metadata: {
        currencyIn: currencyIn && {
          currency: currencyIn.currency,
          amountFormatted: currencyIn.amountFormatted,
          amountUsd: currencyIn.amountUsd,
        },
        currencyOut: currencyOut && {
          currency: currencyOut.currency,
          amountFormatted: currencyOut.amountFormatted,
          amountUsd: currencyOut.amountUsd,
        },
      },
    },
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class UpstreamError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function fetchPage(apiKey: string, user: string, continuation: string | undefined): Promise<V3Page> {
  const url = new URL(`${RELAY_BASE}/requests/v3`)
  url.searchParams.set('user', user)
  url.searchParams.set('limit', String(PAGE_LIMIT))
  if (continuation) url.searchParams.set('continuation', continuation)

  let lastStatus = 0
  for (let attempt = 0; attempt <= MAX_RETRIES_PER_PAGE; attempt++) {
    const upstream = await fetch(url.toString(), { headers: { 'x-api-key': apiKey } })
    lastStatus = upstream.status

    if (upstream.status === 429) {
      const retryAfterHeader = Number(upstream.headers.get('retry-after'))
      const delay = retryAfterHeader > 0 ? retryAfterHeader * 1000 : Math.min(500 * 2 ** attempt, 4000)
      await sleep(delay)
      continue
    }
    if (!upstream.ok) {
      throw new UpstreamError(`Relay API request failed (${upstream.status})`, upstream.status)
    }
    return (await upstream.json()) as V3Page
  }
  throw new UpstreamError(`Relay API is rate-limited (${lastStatus})`, lastStatus)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user } = req.query

  if (typeof user !== 'string' || !ADDRESS_RE.test(user)) {
    res.status(400).json({ error: 'Missing or invalid "user" address' })
    return
  }

  const apiKey = process.env.RELAY_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'RELAY_API_KEY is not configured on the server' })
    return
  }

  const deadline = Date.now() + TIME_BUDGET_MS
  const all: NormalizedRequest[] = []
  let continuation: string | undefined
  let partial = false

  for (let page = 0; page < MAX_PAGES; page++) {
    if (Date.now() > deadline) {
      partial = true
      break
    }
    try {
      const json = await fetchPage(apiKey, user, continuation)
      all.push(...json.requests.map(normalize))
      if (!json.continuation) {
        // An exactly-full page with no cursor is suspicious under throttling: Relay can drop
        // the token instead of erroring, which looks identical to "this is the end of history."
        // A short page with no cursor is the trustworthy, unambiguous end.
        if (json.requests.length === PAGE_LIMIT) partial = true
        break
      }
      // Trust the cursor, not the page length — a short page can still carry a valid
      // continuation (observed on v3), so length alone is not a safe stop condition.
      continuation = json.continuation
    } catch (err) {
      if (all.length > 0) {
        partial = true
        break
      }
      const status = err instanceof UpstreamError ? err.status : 502
      res.status(status).json({ error: err instanceof Error ? err.message : 'Relay API request failed' })
      return
    }
  }

  res.setHeader('Cache-Control', partial ? 'no-store' : 's-maxage=45, stale-while-revalidate=300')
  res.status(200).json({ requests: all, partial })
}
