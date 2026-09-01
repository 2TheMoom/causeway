import type { VercelRequest, VercelResponse } from '@vercel/node'

const RELAY_BASE = 'https://api.relay.link'
const EXTRA_RETRIES = 2
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, continuation, limit } = req.query

  if (typeof user !== 'string' || !ADDRESS_RE.test(user)) {
    res.status(400).json({ error: 'Missing or invalid "user" address' })
    return
  }

  const upstreamUrl = new URL(`${RELAY_BASE}/requests/v2`)
  upstreamUrl.searchParams.set('user', user)
  upstreamUrl.searchParams.set('limit', typeof limit === 'string' ? limit : '50')
  if (typeof continuation === 'string' && continuation) {
    upstreamUrl.searchParams.set('continuation', continuation)
  }

  let lastStatus = 0
  for (let attempt = 0; attempt <= EXTRA_RETRIES; attempt++) {
    const upstream = await fetch(upstreamUrl.toString())
    lastStatus = upstream.status

    if (upstream.status === 429) {
      const retryAfterHeader = Number(upstream.headers.get('retry-after'))
      const delay = retryAfterHeader > 0 ? retryAfterHeader * 1000 : 400 * 2 ** attempt
      await sleep(Math.min(delay, 3000))
      continue
    }

    const body = await upstream.text()
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Relay API request failed (${upstream.status})` })
      return
    }

    // Short edge cache: keeps a burst of pagination calls (or repeat visitors
    // looking up the same address) from re-hitting Relay's shared rate limit.
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=120')
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(body)
    return
  }

  res.status(429).json({ error: `Relay API is rate-limited (${lastStatus}) — please try again shortly` })
}
