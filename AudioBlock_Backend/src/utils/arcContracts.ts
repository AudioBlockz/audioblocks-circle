// Deployed on Circle's Arc Testnet (chain id 5042002). See audiobits/circle-deploy
// for deployment scripts and audiobits/contracts for the Solidity source.
export const ArcContractAddress = {
  Registry: "0xa0243ed2e3e16df1f8218dc1cd0f8e0809eb1028",
  // Note: RoyaltyPayout was deployed against the old MockERC20 (see below)
  // and hasn't been re-pointed at real USDC — it's not wired into any
  // active backend code yet, so left as-is for now.
  RoyaltyPayout: "0x4792b9dc1c6a27322d3489f4d091b1679257afe7",
  // Arc Testnet's real, native-currency-backed USDC — a precompile that
  // exposes the chain's native balance (the same asset gas is paid in)
  // through the standard ERC20 interface. Verified on-chain: balanceOf,
  // approve, and transferFrom all work against real balances. Replaces the
  // custom MockERC20 ("mUSD", 18 decimals) previously used here — this is
  // 6 decimals, see PoolService.ts's TOKEN_DECIMALS.
  PaymentToken: "0x3600000000000000000000000000000000000000",
  // payoutAuthority is a Circle developer-controlled wallet (see
  // utils/circleWallet.ts) — replaces both the original Privy-managed
  // wallet (blocked from signing on Arc Testnet: "App is not authorized to
  // transact on chain eip155:5042002", unresolved) and the interim
  // raw-private-key testnet workaround.
  Pool: "0x982b6000e1b5722d8e7b5e4164d411607b3b242d",
} as const;
