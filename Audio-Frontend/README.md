# Audioblocks Frontend

Next.js 15 (App Router) web app — the public marketing site and the
authenticated listener/artist/admin dashboard, talking to
`AudioBlock_Backend`.

See the [root README](../README.md) for the full picture — architecture,
how auth and on-chain actions actually work, and deployed contract
addresses.

## Local setup

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL + NEXT_PUBLIC_PRIVY_APP_ID
npm run dev                   # http://localhost:3000
```

Requires a running `AudioBlock_Backend` instance (`NEXT_PUBLIC_API_URL`
must point at it), and a Privy app id matching the backend's `PRIVY_APP_ID`.

## Routes

**Public site** — `app/(home)/`

| Route | Description |
|---|---|
| `/` | Landing page |
| `/artist-hub` | Artist onboarding/marketing page; becomes the real artist dashboard once logged in as an artist |
| `/artist/[id]` | Public artist profile |
| `/marketPlace`, `/marketPlace/[id]` | Rooms — browse and unlock paid access to unreleased tracks |
| `/collective` | Community/collective marketing page |

**Dashboard** — `app/dashboard/` (requires a Privy session; gated by `middleware.ts`)

| Route | Description |
|---|---|
| `/dashboard` | Explore |
| `/dashboard/community` | Vote for songs, deposit into the pool, see round leaderboards |
| `/dashboard/profile`, `/dashboard/profile/edit` | Listener/artist profile |
| `/dashboard/collection` | Song collaborations |
| `/dashboard/playlist` | Personal playlist |
| `/dashboard/admin` | Admin-only — open/close voting rounds |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
