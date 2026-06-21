# circle-deploy

Deploys `AudioBitsRegistry.sol` and `RoyaltyPayout.sol` (compiled by the Hardhat
project one level up) to Circle's Arc Testnet, using Circle's Smart Contract
Platform custom-bytecode deployment (not the pre-built template flow).

## Prerequisites

1. A Circle Developer account at [console.circle.com](https://console.circle.com/).
2. An API key: Console → **Keys → Create a key → API key → Standard Key**.
3. A registered Entity Secret: see
   [Register your Entity Secret](https://developers.circle.com/wallets/dev-controlled/register-entity-secret).
4. From the audiobits root: `npm run compile` (so `../artifacts/...` exists).

## Setup

```bash
cp .env.example .env
# edit .env and fill in CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET
npm install
```

## Run in order

1. `npm run create-wallet` — creates a wallet set + SCA wallet on Arc Testnet.
   Copy the printed `id`/`address` into `.env` as `WALLET_ID`/`WALLET_ADDRESS`.
2. `npm run deploy-registry` — deploys `AudioBitsRegistry`.
3. `npm run deploy-payment-token` — deploys `MockERC20` to use as the royalty
   payment token on testnet.
4. After each deploy step: set `TRANSACTION_ID` in `.env` and run
   `npm run check-transaction` until `state` is `COMPLETE`. Then set
   `CONTRACT_ID` and run `npm run get-contract` to get the deployed address.
   Save each address into `.env` (`REGISTRY_CONTRACT_ADDRESS`,
   `PAYMENT_TOKEN_CONTRACT_ADDRESS`).
5. `npm run deploy-royalty` — deploys `RoyaltyPayout`, wired to the registry
   and payment token addresses from step 4.

Contracts are also visible in the
[Circle Developer Console](https://console.circle.com/smart-contracts/contracts)
and on the [Arc Testnet Explorer](https://testnet.arcscan.app/).
