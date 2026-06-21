import fs from "fs";
import path from "path";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";

const artifact = JSON.parse(
  fs.readFileSync(path.resolve("../artifacts/contracts/mocks/MockERC20.sol/MockERC20.json"), "utf-8")
);

const client = initiateSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const response = await client.deployContract({
  name: "AudioBitsMockUSD",
  description: "Mintable test ERC-20 used as the royalty payment token on testnet",
  blockchain: "ARC-TESTNET",
  walletId: process.env.WALLET_ID!,
  abiJson: JSON.stringify(artifact.abi),
  bytecode: artifact.bytecode,
  constructorParameters: [],
  fee: { type: "level", config: { feeLevel: "MEDIUM" } },
});

console.log(JSON.stringify(response.data, null, 2));
console.log(
  "\nCopy contractId into .env as PAYMENT_TOKEN_CONTRACT_ID, confirm via check-transaction/get-contract, " +
    "then set PAYMENT_TOKEN_CONTRACT_ADDRESS before running deploy-royalty."
);
