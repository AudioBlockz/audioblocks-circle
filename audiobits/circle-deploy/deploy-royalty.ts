import fs from "fs";
import path from "path";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";

const artifact = JSON.parse(
  fs.readFileSync(path.resolve("../artifacts/contracts/RoyaltyPayout.sol/RoyaltyPayout.json"), "utf-8")
);

if (!process.env.REGISTRY_CONTRACT_ADDRESS || !process.env.PAYMENT_TOKEN_CONTRACT_ADDRESS) {
  throw new Error(
    "Set REGISTRY_CONTRACT_ADDRESS and PAYMENT_TOKEN_CONTRACT_ADDRESS in .env before deploying RoyaltyPayout."
  );
}

const client = initiateSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const response = await client.deployContract({
  name: "RoyaltyPayout",
  description: "Splits royalty payments for registered songs among payees",
  blockchain: "ARC-TESTNET",
  walletId: process.env.WALLET_ID!,
  abiJson: JSON.stringify(artifact.abi),
  bytecode: artifact.bytecode,
  constructorParameters: [process.env.REGISTRY_CONTRACT_ADDRESS, process.env.PAYMENT_TOKEN_CONTRACT_ADDRESS],
  fee: { type: "level", config: { feeLevel: "MEDIUM" } },
});

console.log(JSON.stringify(response.data, null, 2));
console.log(
  "\nCopy contractId into .env as ROYALTY_CONTRACT_ID, then confirm via check-transaction/get-contract."
);
