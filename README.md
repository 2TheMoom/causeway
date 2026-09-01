# Causeway

Look up any EVM address and see its total volume, transaction count, chain
activity, and history on the [Relay](https://relay.link) bridge — no signup,
no wallet connection.

## Architecture

React/Vite frontend + two Vercel serverless functions (`/api/relay-chains`,
`/api/relay-requests`) that proxy Relay's public `api.relay.link/requests/v2`
endpoint. The proxy exists for three reasons:

- **Shared rate limit.** Relay's public tier has no per-user key, so its
  rate limit is shared across every anonymous caller. A single wallet lookup
  can page through dozens of requests; proxying lets the server retry with
  backoff on a 429 instead of surfacing it straight to the visitor.
- **Edge caching.** Responses are served with `Cache-Control: s-maxage`, so
  repeat lookups of the same (popular) address are served from Vercel's CDN
  instead of hitting Relay again.
- **Future API key.** Relay's `/requests/v2` is deprecated and sunsets
  **2026-11-24** in favor of `/requests/v3`, which requires an API key. That
  key can live as a server-side env var on the proxy and never touch the
  client — swapping it in later is a same-file change to `api/relay-requests.ts`,
  no architecture change needed.

## Stack

Vite + React + TypeScript + Tailwind CSS v4, deployed on Vercel. No chart
library — the volume chart and chain bars are hand-rolled SVG.

## Running locally

```bash
npm install
vercel dev   # serves the frontend and the /api functions together
```

(`npm run dev` also works for frontend-only iteration, but `/api` calls will
404 since Vite's dev server doesn't run the serverless functions.)

## A note on data sources

Polymer (polymerlabs.org) isn't included. It's cross-chain messaging
infrastructure other bridges build on, not a bridge that moves user funds
itself — there's no public, address-indexed volume data for it the way there
is for Relay.
