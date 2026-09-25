# Audioblocks

A music streaming platform where listeners vote for songs each round, fund a
community USDC pool, and the top-voted artists get paid out on-chain — plus
Rooms, a pay-to-unlock marketplace for early/unreleased tracks.

Built on [Arc](https://arc.io) (Circle's USDC-native L1). Wallets are
provisioned and signed for automatically via Circle's developer-controlled
wallets — listeners and artists never touch a seed phrase, gas, or a browser
wallet extension.

> This is a monorepo. `AudioBlock_Backend/` and `Audio-Frontend/` each have
> their own `README.md` with just their own local setup steps — this file is
> the map of the whole system.

## Table of contents

- [How it actually works](#how-it-actually-works)
- [Repository layout](#repository-layout)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Smart contracts](#smart-contracts)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)

## How it actually works

**Listeners**
- Stream music, ad-free (adaptive-bitrate HLS, transcoded server-side into
  multiple renditions so playback adapts to real network conditions).
- Vote for one song per round — the top 5 by vote split a USDC pool when
  the round closes.
- Deposit into that pool anytime (not gated on a round being open — crypto,
  card via Stripe, or Naira via Paystack), or unlock a Room.
- **Rooms**: pay to unlock an artist's unreleased track for a limited access
  window, in crypto, card, or Naira.

**Artists**
- Get a real on-chain wallet and a small USDC gas stipend automatically the
  moment they sign up (or upgrade from listener), enough to cover their
  first on-chain transaction.
- Upload songs (auto-transcoded to HLS), open Rooms, and collaborate with
  other artists on a track — payouts split automatically by an agreed
  basis-point share.
- Get paid in USDC whenever a round they win closes, or whenever a Room they
  opened gets unlocked.

**Admins**
- Explicitly open each voting round with a chosen duration (rounds don't
  auto-open) — it then closes and pays out automatically once that duration
  elapses, or an admin can close it early.
- See every round's vote/deposit counts, and manage rounds from
  `/dashboard/admin`.

**Under the hood**
- The Pool smart contract has no notion of "rounds" — it's just a running
  USDC balance with `deposit()`/`payout()`. "Rounds" are a purely
  backend/off-chain concept for periodically tallying votes and triggering
  a payout from that balance.
- Auth is via [Privy](https://privy.io) (login/session only). All on-chain
  signing — wallet creation, transfers, contract calls — goes through
  [Circle's developer-controlled wallets](https://developers.circle.com/w3s/programmable-wallets),
  not Privy's embedded wallet (Privy's app was blocked from signing on Arc).

## Repository layout

| Directory | What it is |
|---|---|
| `AudioBlock_Backend/` | Express + TypeORM/Postgres API, RabbitMQ workers (transcoding, AI song generation), all on-chain signing |
| `Audio-Frontend/` | Next.js 15 (App Router) web app — public site + authenticated dashboard |
| `audiobits/` | Solidity contracts (Hardhat) — `AudioBitsRegistry`, `RoyaltyPayout`, `Pool` — plus `circle-deploy/`, the scripts that deployed them via Circle wallets |

## Architecture

```
┌─────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│  Audio-Frontend  │──────▶│   AudioBlock_Backend   │──────▶│   Postgres +     │
│   (Next.js)      │  REST │  (Express + TypeORM)   │        │   Redis          │
└─────────────────┘        └──────────┬─────────────┘        └─────────────────┘
        │                              │
        │ Privy (login/session)        ├──▶ RabbitMQ ──▶ workers (HLS transcode,
        │                              │                  AI song generation)
        ▼                              ├──▶ S3 (audio, HLS segments, images —
┌─────────────────┐                    │     served via signed URLs)
│      Privy       │                    ├──▶ Circle Wallets API (all on-chain
└─────────────────┘                    │     signing — wallet creation, transfers,
                                        │     contract calls)
                                        ├──▶ Arc mainnet (chain id 5042) via
                                        │     the contracts below
                                        └──▶ Stripe / Paystack (fiat on-ramp,
                                              settled on-chain from the
                                              platform's own treasury wallet)
```

## Tech stack

**Backend** — Node/Express 5, TypeScript, TypeORM + Postgres, Redis, RabbitMQ
(`amqplib`), AWS S3 (`fluent-ffmpeg` for HLS transcoding), Privy server-auth,
Circle developer-controlled wallets SDK, `viem` (chain reads), Stripe +
Paystack, Replicate (AI song generation).

**Frontend** — Next.js 15 / React 19, Tailwind CSS 4, Radix UI primitives,
Privy React SDK, `hls.js`, `axios`, `framer-motion`, `sonner`.

**Contracts** — Solidity, Hardhat, deployed to Arc mainnet.

## Smart contracts

Deployed on **Arc mainnet** (chain id `5042`, RPC `rpc.mainnet.arc.io`,
explorer `explorer.arc.io`). Source in `audiobits/contracts/`, deploy
tooling in `audiobits/circle-deploy/`.

| Contract | Address | Purpose |
|---|---|---|
| `AudioBitsRegistry` | `0x5a6a7c9154a828f4f61c9e9e934051ab0b816ed8` | Artist + song registration |
| `RoyaltyPayout` | `0x479eb58acdf79bf5f2143a8941260e5cdcfef981` | Per-song royalty splits, pull-based withdrawal |
| `Pool` | `0xa21e78cc9158f9145f2de7c011801eebd677fd8f` | Community pool — `deposit()`/`payout()`, no on-chain concept of rounds |
| USDC (native) | `0x3600000000000000000000000000000000000000` | Arc's native gas token, exposed as a fixed-address ERC20 precompile — same address on testnet and mainnet, 6 decimals |

## Getting started

**Prerequisites:** Node 20+, Docker (for local Postgres/Redis/RabbitMQ), a
[Privy](https://dashboard.privy.io) app, and [Circle Console](https://console.circle.com)
API credentials (developer-controlled wallets, on Arc).

```bash
git clone <this repo>
cd Audioblocks-circle
```

**Backend**
```bash
cd AudioBlock_Backend
npm install
cp .env.example .env        # fill in the values — see below
docker compose up -d        # Postgres, Redis, RabbitMQ, pgAdmin
npm run dev                 # http://localhost:4000
```

**Frontend** (separate terminal)
```bash
cd Audio-Frontend
npm install
cp .env.example .env.local  # fill in the values — see below
npm run dev                 # http://localhost:3000
```

The frontend's `NEXT_PUBLIC_API_URL` must point at the backend, and both
apps' Privy app ID must match.

## Environment variables

Full details and comments live in each app's `.env.example` — this is the
category overview.

**Backend** (`AudioBlock_Backend/.env`)

| Category | Variables |
|---|---|
| Server | `PORT`, `NODE_ENV`, `PUBLIC_API_URL`, `FRONTEND_URL` |
| Database | `POSTGRES_HOST/PORT/USER/PASSWORD/DATABASE` |
| Redis | `REDIS_HOST/PORT/PASSWORD/USERNAME` |
| RabbitMQ | `RABBITMQ_URL` (+ `RABBITMQ_USER/PASS` if running it via docker-compose) |
| Auth | `PRIVY_APP_ID`, `PRIVY_APP_SECRET` |
| Circle wallets | `CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`, `CIRCLE_WALLET_SET_ID`, `CIRCLE_POOL_PAYOUT_WALLET_ADDRESS` |
| Chain | `ARC_RPC_URL` (optional override — defaults to Circle's public Arc endpoint), `TREASURY_WALLET_ADDRESS`, `ARTIST_SETUP_GAS_STIPEND`, `POOL_ROUND_DURATION_HOURS` |
| Storage | `AWS_ACCESS_KEY_ID/SECRET_ACCESS_KEY/REGION/BUCKET_NAME`, `SIGNED_URL_EXPIRES`, `MANIFEST_CACHE_TTL` |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYSTACK_SECRET_KEY`, `NGN_USD_EXCHANGE_RATE` |
| AI generation | `REPLICATE_API_TOKEN`, `REPLICATE_MUSICGEN_VERSION`, `NVIDIA_MODEL`, `AI_GENERATION_POLL_INTERVAL_MS/TIMEOUT_MS` |
| X (Twitter) connect | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, `TWITTER_REDIRECT_URI`, `TWITTER_SUCCESS_REDIRECT` |
| IPFS (song metadata) | `PINATA_JWT`, `PINATA_GATEWAY` |

**Frontend** (`Audio-Frontend/.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Must match the backend's `PRIVY_APP_ID` |

The Arc RPC endpoint (Circle's public one, used when `ARC_RPC_URL` is unset)
rate-limits under real traffic — see the retry configuration in
`AudioBlock_Backend/src/config/arc.ts`. A dedicated RPC provider (Alchemy,
Blockdaemon, dRPC, QuickNode all support Arc) removes that risk entirely for
a production deploy.

## Deployment

- **Backend** — Railway (Dockerfile-based). Health check at `/health`.
  Needs its own copy of every backend env var above — Railway's env store is
  separate from local `.env` files.
- **Frontend** — Vercel.
- **Circle** — wallet creation and every on-chain signing call go through
  Circle's API; a Gas Station policy must be active in Circle Console for
  a brand-new wallet's first transaction to be sponsored. Circle's API Logs
  (Console) are the most reliable way to debug a failed on-chain call —
  more specific than the SDK's own error wrapping.
- **Contracts** — already deployed to Arc mainnet (addresses above). Redeploy
  scripts live in `audiobits/circle-deploy/`; switching between mainnet and
  testnet is controlled by `ARC_NETWORK` in that directory's own `.env`.
