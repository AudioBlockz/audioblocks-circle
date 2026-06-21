// "use client"
// import React from 'react'
// import {
//     RainbowKitProvider, darkTheme
//   } from '@rainbow-me/rainbowkit';
//   import { WagmiProvider } from 'wagmi';
  
//   import {
//     QueryClientProvider,
//     QueryClient,
//   } from "@tanstack/react-query";
//   import { config } from "@/config/config";

// const Providers = ({children}: {children: React.ReactNode}) => {
//   // const myCustomTheme: Theme = {
//   //   blurs: {
//   //     modalOverlay: '...',
//   //   },
//   //   colors: {
//   //     accentColor: 'white',
//   //     accentColorForeground: 'white',
//   //     actionButtonBorder: '...',
//   //     actionButtonBorderMobile: '...',
//   //     actionButtonSecondaryBackground: '...',
//   //     closeButton: '...',
//   //     closeButtonBackground: '...',
//   //     connectButtonBackground: '...',
//   //     connectButtonBackgroundError: '...',
//   //     connectButtonInnerBackground: '...',
//   //     connectButtonText: '...',
//   //     connectButtonTextError: '...',
//   //     connectionIndicator: '...',
//   //     downloadBottomCardBackground: '...',
//   //     downloadTopCardBackground: '...',
//   //     error: '...',
//   //     generalBorder: '...',
//   //     generalBorderDim: '...',
//   //     menuItemBackground: '...',
//   //     modalBackdrop: '...',
//   //     modalBackground: 'black',
//   //     modalBorder: '...',
//   //     modalText: '',
//   //     modalTextDim: '...',
//   //     modalTextSecondary: '...',
//   //     profileAction: '...',
//   //     profileActionHover: '...',
//   //     profileForeground: '...',
//   //     selectedOptionBorder: '...',
//   //     standby: '...',
//   //   },
//   //   fonts: {
//   //     body: '...',
//   //   },
//   //   radii: {
//   //     actionButton: '...',
//   //     connectButton: '...',
//   //     menuButton: '...',
//   //     modal: '...',
//   //     modalMobile: '...',
//   //   },
//   //   shadows: {
//   //     connectButton: '...',
//   //     dialog: '...',
//   //     profileDetailsAction: '...',
//   //     selectedOption: '...',
//   //     selectedWallet: '...',
//   //     walletLogo: '...',
//   //   },
//   // };
//     const queryClient = new QueryClient();
//   return (
//     <div> <WagmiProvider config={config}>
//     <QueryClientProvider client={queryClient}>
//       <RainbowKitProvider modalSize="compact" theme={darkTheme()} >
//         {children}
//       </RainbowKitProvider>
//     </QueryClientProvider>
//   </WagmiProvider></div>
//   )
// }

// export default Providers;

'use client'

import { wagmiAdapter, projectId } from '@/config/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react' 
import { liskSepolia, mainnet, sepolia } from '@reown/appkit/networks'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()


if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'appkit-example',
  description: 'AppKit Example',
  url: 'https://appkitexampleapp.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}



// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, liskSepolia, sepolia],
  projectId,
  allowUnsupportedChain: false,
  allWallets: "SHOW",
  defaultNetwork: liskSepolia,
  enableEIP6963: true,
  metadata: metadata,
  features: {
    analytics: true,
    email:true,
    socials:false,
    history:true
},
themeMode: 'dark',
})


function Provider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default Provider;