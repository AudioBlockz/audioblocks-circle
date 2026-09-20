# audiobits

On-chain artist and song registry, written in Solidity and built with Hardhat.

## Contracts

- `contracts/AudioBitsRegistry.sol` lets a wallet register itself as an artist and
  then register songs under a title and content hash (`bytes32`), with duplicate-hash
  protection across all artists.
- `contracts/RoyaltyPayout.sol` collects ERC-20 royalty payments for a song and
  splits them among payees according to per-song basis-point shares (set by the
  song's artist via `setSplit`). If no split is set, 100% goes to the song's
  registered artist. Funds accumulate as a pull-based balance withdrawn via
  `withdraw()`.
- `contracts/Pool.sol` holds a community-funded ERC-20 pool — anyone can
  `deposit()` any amount, and the designated `payoutAuthority` address can
  `payout()` the current balance to a set of winner addresses in one call.
  "Rounds" (who won, when to pay out) are tracked off-chain by the backend;
  this contract is just the deposit/payout mechanism.

## Usage

```bash
npm install
npm run compile
npm test
```
