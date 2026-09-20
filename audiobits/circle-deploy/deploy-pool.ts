import fs from "fs";
import path from "path";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";

const artifact = JSON.parse(
  fs.readFileSync(path.resolve("../artifacts/contracts/Pool.sol/Pool.json"), "utf-8")
);

if (!process.env.PAYMENT_TOKEN_CONTRACT_ADDRESS || !process.env.POOL_PAYOUT_AUTHORITY_ADDRESS) {
  throw new Error(
    "Set PAYMENT_TOKEN_CONTRACT_ADDRESS and POOL_PAYOUT_AUTHORITY_ADDRESS in .env before deploying Pool."
  );
}

const client = initiateSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const response = await client.deployContract({
  name: "Pool",
  description: "Community funded pool with deposits and admin triggered payout to top voted artists",
  blockchain: "ARC-TESTNET",
  walletId: process.env.WALLET_ID!,
  abiJson: JSON.stringify(artifact.abi),
  bytecode: artifact.bytecode,
  constructorParameters: [process.env.PAYMENT_TOKEN_CONTRACT_ADDRESS, process.env.POOL_PAYOUT_AUTHORITY_ADDRESS],
  fee: { type: "level", config: { feeLevel: "MEDIUM" } },
});

console.log(JSON.stringify(response.data, null, 2));
console.log(
  "\nCopy contractId into .env as POOL_CONTRACT_ID, then confirm via check-transaction/get-contract."
);
