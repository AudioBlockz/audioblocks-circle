// One-time migration: every account created before the mainnet cutover
// (commit 41eac3b) has a walletAddress that only exists on Arc Testnet,
// under Circle's old testnet wallet set — it doesn't exist on the live
// mainnet wallet set this backend now signs against at all, so any
// on-chain action for that account fails with Circle's "Cannot find
// target wallet in the system" error.
//
// This finds every user whose stored walletAddress isn't a real wallet on
// the CURRENT (live) Circle wallet set, provisions them a real mainnet
// wallet, updates their row, and — for artists — re-runs the on-chain
// setup (gas stipend + registerArtist) that never happened for them under
// mainnet.
//
// Defaults to a dry run (lists what it would do, changes nothing). Pass
// MIGRATE=true to actually apply it:
//
//   npx ts-node src/scripts/migrateTestnetWallets.ts          # dry run
//   MIGRATE=true npx ts-node src/scripts/migrateTestnetWallets.ts

import dotenv from "dotenv";
dotenv.config();
import AppDataSource from "../config/db";
import { User, UserRole } from "../entities/User";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createCircleArcWallet } from "../utils/circleWallet";
import { ArtistService } from "../services/Artist/ArtistService";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const DRY_RUN = process.env.MIGRATE !== "true";

async function existsOnLiveWalletSet(address: string): Promise<boolean> {
  const result = await client.listWallets({ address, blockchain: "ARC" });
  return (result.data?.wallets?.length ?? 0) > 0;
}

async function main() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const artistService = new ArtistService();

  const allUsers = await userRepo.find();
  console.log(`Checking ${allUsers.length} account(s) against the live Circle wallet set...`);
  console.log(DRY_RUN ? "DRY RUN — no changes will be made.\n" : "LIVE RUN — this will create wallets and write to the database.\n");

  const affected: User[] = [];
  for (const user of allUsers) {
    const onLive = await existsOnLiveWalletSet(user.walletAddress);
    if (!onLive) affected.push(user);
  }

  console.log(`Found ${affected.length} account(s) with a dead (pre-mainnet) wallet address.\n`);

  for (const user of affected) {
    const label = user.email ?? user.username ?? user.id;
    console.log(`- ${label} (role=${user.role}) — ${user.walletAddress}`);
  }

  if (DRY_RUN) {
    console.log("\nDry run complete. Re-run with MIGRATE=true to apply.");
    await AppDataSource.destroy();
    return;
  }

  console.log("");
  for (const user of affected) {
    const label = user.email ?? user.username ?? user.id;
    const oldAddress = user.walletAddress;
    console.log(`Migrating ${label}...`);

    try {
      const newWallet = await createCircleArcWallet(process.env.CIRCLE_WALLET_SET_ID!);
      user.walletAddress = newWallet.address;
      await userRepo.save(user);
      console.log(`  wallet: ${oldAddress} -> ${newWallet.address}`);

      if (user.role === UserRole.ARTIST) {
        const artistName = user.username || user.name || `Artist ${newWallet.address.slice(0, 8)}`;
        try {
          const tx = await artistService.setupArtistAccountOnChain(newWallet.address, artistName);
          console.log(`  artist on-chain setup: ${tx}`);
        } catch (err) {
          console.error(`  artist on-chain setup FAILED (wallet was still swapped) —`, err);
        }
      }
    } catch (err) {
      console.error(`  FAILED to migrate ${label} —`, err);
    }
  }

  console.log("\nDone.");
  await AppDataSource.destroy();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
