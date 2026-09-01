import type { VercelRequest, VercelResponse } from '@vercel/node'

const RELAY_BASE = 'https://api.relay.link'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const upstream = await fetch(`${RELAY_BASE}/chains`)
    const body = await upstream.text()

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Relay chains request failed (${upstream.status})` })
      return
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(body)
  } catch {
    res.status(502).json({ error: 'Failed to reach Relay API' })
  }
}
