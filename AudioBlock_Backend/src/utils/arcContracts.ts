// Deployed on Arc mainnet (chain id 5042). See audiobits/circle-deploy for
// deployment scripts and audiobits/contracts for the Solidity source.
export const ArcContractAddress = {
  Registry: "0x5a6a7c9154a828f4f61c9e9e934051ab0b816ed8",
  RoyaltyPayout: "0x479eb58acdf79bf5f2143a8941260e5cdcfef981",
  // Arc's real, native-currency-backed USDC — a precompile that exposes the
  // chain's native balance (the same asset gas is paid in) through the
  // standard ERC20 interface. Same fixed address on testnet and mainnet.
  // 6 decimals — see PoolService.ts's TOKEN_DECIMALS.
  PaymentToken: "0x3600000000000000000000000000000000000000",
  // payoutAuthority is a Circle developer-controlled wallet (see
  // utils/circleWallet.ts), immutable once set at deploy — must match
  // CIRCLE_POOL_PAYOUT_WALLET_ADDRESS.
  Pool: "0xa21e78cc9158f9145f2de7c011801eebd677fd8f",
} as const;
