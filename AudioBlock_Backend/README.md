# Audioblocks Backend

Express + TypeORM/Postgres API — auth, song upload/streaming, the pool
voting/payout system, Rooms, collaborations, and all on-chain signing (via
Circle developer-controlled wallets, on Arc mainnet).

See the [root README](../README.md) for the full picture — architecture,
deployed contract addresses, and how this fits with `Audio-Frontend/`.

## Local setup

```bash
npm install
cp .env.example .env    # fill in the values — see the root README's
                         # Environment Variables section for what each does
docker compose up -d    # Postgres, Redis, RabbitMQ, pgAdmin (localhost:5050)
npm run dev              # http://localhost:4000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with hot reload (`ts-node-dev`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled build (`dist/index.js`) — what production uses |
| `npm run worker` | Run the song-processing worker standalone |
| `npm run seed:genres` | Seed the genre list |
