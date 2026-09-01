import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = { maxDuration: 30 }

const RELAY_BASE = 'https://api.relay.link'
const PAGE_LIMIT = 50
const MAX_PAGES = 20
const MAX_RETRIES_PER_PAGE = 4
const TIME_BUDGET_MS = 25_000
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

interface RelayPage {
  requests: unknown[]
  continuation?: string | null
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

async function fetchPage(user: string, continuation: string | undefined): Promise<RelayPage> {
  const url = new URL(`${RELAY_BASE}/requests/v2`)
  url.searchParams.set('user', user)
  url.searchParams.set('limit', String(PAGE_LIMIT))
  if (continuation) url.searchParams.set('continuation', continuation)

  let lastStatus = 0
  for (let attempt = 0; attempt <= MAX_RETRIES_PER_PAGE; attempt++) {
    const upstream = await fetch(url.toString())
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
    return (await upstream.json()) as RelayPage
  }
  throw new UpstreamError(`Relay API is rate-limited (${lastStatus})`, lastStatus)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user } = req.query

  if (typeof user !== 'string' || !ADDRESS_RE.test(user)) {
    res.status(400).json({ error: 'Missing or invalid "user" address' })
    return
  }

  const deadline = Date.now() + TIME_BUDGET_MS
  const all: unknown[] = []
  let continuation: string | undefined
  let partial = false

  for (let page = 0; page < MAX_PAGES; page++) {
    if (Date.now() > deadline) {
      partial = true
      break
    }
    try {
      const json = await fetchPage(user, continuation)
      all.push(...json.requests)
      if (!json.continuation) {
        // A page that's exactly full (== PAGE_LIMIT) with no continuation is suspicious under
        // active throttling: Relay can silently drop the token instead of erroring, which looks
        // identical to "this is genuinely the end of history." Flag it rather than trust it.
        if (json.requests.length === PAGE_LIMIT) partial = true
        break
      }
      if (json.requests.length < PAGE_LIMIT) break
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

  // A full result is safe to cache broadly; a partial one is retried on the next visit instead.
  res.setHeader('Cache-Control', partial ? 'no-store' : 's-maxage=45, stale-while-revalidate=300')
  res.status(200).json({ requests: all, partial })
}
