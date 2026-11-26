## What is it?

A lightweight Next.js app that shows the number of free spaces in Belgrade's public garages and parking lots, scraped from [Parking Servis Beograd](https://www.parking-servis.co.rs/garaze-i-parkiralista) and presented in a faster, more readable UI.
The app is an installable PWA.

## How data freshness works

- The source page is scraped at most **once per minute**, no matter how many people use the app (Next.js data cache, shared across visitors).
- An open tab asks for new numbers every minute, but only while it's visible, and catches up when you come back to it.
- If the source is down, the last good numbers stay on screen with a notice.

## Tech and tools

- Next.js 16 (App Router, React Server Components, ISR)
- React 19
- bun
- cheerio for scraping
- Hand-written service worker + web app manifest (installable, opens offline)

## Development

```sh
bun install
bun dev          # http://localhost:3000
bun run lint
bun run typecheck
bun run build
```

## Note on the source's TLS certificate

`parking-servis.co.rs` doesn't send its intermediate certificate. Browsers cope with that, but Node rejects the connection (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`). `src/lib/certs.ts` bundles the missing public Sectigo intermediate, which is added to the trusted set for that request only. Verification stays on. If the site changes its certificate vendor, update that file.
