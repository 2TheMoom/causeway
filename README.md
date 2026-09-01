# Causeway

Look up any EVM address and see its total volume, transaction count, chain
activity, and history on the [Relay](https://relay.link) bridge — no signup,
no wallet connection.

Live data comes straight from Relay's public `api.relay.link/requests/v2`
endpoint, called directly from the browser (it's CORS-open and needs no API
key). Everything is client-side; there's no backend.

## Stack

Vite + React + TypeScript + Tailwind CSS v4. No chart library — the volume
chart and chain bars are hand-rolled SVG.

## Running locally

```bash
npm install
npm run dev
```

## Deploying

Push to `main` and the included GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds and publishes to GitHub Pages
automatically. Enable Pages for the repo under **Settings → Pages → Source:
GitHub Actions** once, and it takes over from there.

## A note on data sources

Polymer (polymerlabs.org) isn't included. It's cross-chain messaging
infrastructure other bridges build on, not a bridge that moves user funds
itself — there's no public, address-indexed volume data for it the way there
is for Relay.

## Known limitation

Relay's `/requests/v2` endpoint is deprecated and scheduled to sunset on
**2026-11-24** in favor of `/requests/v3`, which requires an API key. Since
this is a fully static site, that key can't be embedded in client code
without being exposed — migrating past the sunset date will need a small
serverless proxy (e.g. a Cloudflare Worker) just to hold the key, in front of
this same static frontend.
