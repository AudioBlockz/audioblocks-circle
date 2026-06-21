import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

if (!process.env.TRANSACTION_ID) throw new Error("Set TRANSACTION_ID in .env first.");

const response = await client.getTransaction({ id: process.env.TRANSACTION_ID });

console.log(JSON.stringify(response.data, null, 2));
