# audiobits

On-chain artist and song registry, written in Solidity and built with Hardhat.

## Contract

`contracts/AudioBitsRegistry.sol` lets a wallet register itself as an artist and then
register songs under a title and content hash (`bytes32`), with duplicate-hash
protection across all artists.

## Usage

```bash
npm install
npm run compile
npm test
```
