// import "@rainbow-me/rainbowkit/styles.css";
// import { createConfig, http } from "wagmi";
// import { injected, metaMask, safe } from "wagmi/connectors";
// import { mainnet, polygon, optimism, lisk, liskSepolia } from "wagmi/chains";

// declare module "wagmi" {
// 	interface Register {
// 		config: typeof config;
// 	}
// }

// export const config = createConfig({
// 	chains: [liskSepolia, lisk, mainnet, polygon, optimism],
// 	connectors: [injected()],
// 	transports: {
// 		[lisk.id]: http(),
// 		[mainnet.id]: http(),
// 		[polygon.id]: http(),
// 		[optimism.id]: http(),
// 		[liskSepolia.id]: http(),
// 	},
// 	ssr: true,
// });

import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia, liskSepolia } from '@reown/appkit/networks'


export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('Project ID is not defined')
}

const networks = [mainnet, liskSepolia, sepolia];


export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig;
