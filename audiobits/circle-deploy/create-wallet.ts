import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { getBlockchain } from "./network";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const blockchain = getBlockchain();
console.log(`Creating wallet set + wallet on ${blockchain}...`);

const walletSetResponse = await client.createWalletSet({
  name: blockchain === "ARC" ? "AudioBits Wallet Set (Mainnet)" : "AudioBits Wallet Set",
});

const walletsResponse = await client.createWallets({
  blockchains: [blockchain],
  count: 1,
  walletSetId: walletSetResponse.data?.walletSet?.id ?? "",
  accountType: "SCA",
});

console.log(JSON.stringify(walletsResponse.data, null, 2));
console.log(
  "\nCopy the wallet's id and address into .env as WALLET_ID and WALLET_ADDRESS before running the deploy scripts."
);
