import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";

const client = initiateSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

if (!process.env.CONTRACT_ID) throw new Error("Set CONTRACT_ID in .env first.");

const response = await client.getContract({ id: process.env.CONTRACT_ID });

console.log(JSON.stringify(response.data, null, 2));
