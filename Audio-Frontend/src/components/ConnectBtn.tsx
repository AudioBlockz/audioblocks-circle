// import { ConnectButton } from "@rainbow-me/rainbowkit";

// export const ConnectBtn = () => {
//   return (
//     <ConnectButton.Custom >
//       {({
//         account,
//         chain,
//         openAccountModal,
//         openChainModal,
//         openConnectModal,
//         authenticationStatus,
//         mounted,
//       }) => {
//         const ready = mounted && authenticationStatus !== "loading";
//         const connected =
//           ready &&
//           account &&
//           chain &&
//           (!authenticationStatus || authenticationStatus === "authenticated");
//         return (
//           <div
//             {...(!ready && {
//               "aria-hidden": true,
//               style: {
//                 opacity: 0,
//                 pointerEvents: "none",
//                 userSelect: "none",
//               },
//             })}
//           >
//             {(() => {
//               if (!connected) {
//                 return (
//                   <button
//                     onClick={openConnectModal}
//                     className="w-full bg-gradient-to-r from-[#B51960] to-[#B81A3F] text-white  py-2 md:px-7 px-3 md:text-sm text-xs rounded-full"
//                   >
//                     Connect Wallet
//                   </button>
//                 );
//               }
//               if (chain.unsupported) {
//                 return (
//                   <button onClick={openChainModal} type="button">
//                     Wrong network
//                   </button>
//                 );
//               }
//               return (
//                 <div style={{ display: "flex", gap: 12 }}>
//                   <button
//                     onClick={openChainModal}
//                     style={{ display: "flex", alignItems: "center" }}
//                     type="button"
//                   >
//                     {chain.hasIcon && (
//                       <div
//                         style={{
//                           background: chain.iconBackground,
//                           width: 12,
//                           height: 12,
//                           borderRadius: 999,
//                           overflow: "hidden",
//                           marginRight: 4,
//                         }}
//                       >
//                         {chain.iconUrl && (
//                           <img
//                             alt={chain.name ?? "Chain icon"}
//                             src={chain.iconUrl}
//                             style={{ width: 12, height: 12 }}
//                           />
//                         )}
//                       </div>
//                     )}
//                     {chain.name}
//                   </button>
//                   <button onClick={openAccountModal} type="button">
//                     {account.displayName}
//                     {/* {account.displayBalance
//                       ? ` (${account.displayBalance})`
//                       : ""} */}
//                   </button>
//                 </div>
//               );
//             })()}
//           </div>
//         );
//       }}
//     </ConnectButton.Custom>
//   );
// };


import { useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useSignMessage, useAccount, useConnect } from "wagmi";
import { toast } from "react-toastify";
import axios from "axios";
import AvatarDropdown from "./Dropdown";
import Cookies from "js-cookie";

export const ConnectBtn = () => {
	const { open } = useAppKit();
	const { address, isConnected } = useAccount();
	const { signMessageAsync } = useSignMessage();

	const [isLoadingConnect, setIsLoadingConnect] = useState(false);
	const [isLoadingSign, setIsLoadingSign] = useState(false);
	const jwt= Cookies.get("audioblocks_jwt");

	const handleConnect = async () => {
		setIsLoadingConnect(true);
		try {
			if (!isConnected) {
				await open();
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to connect wallet");
		} finally {
			setIsLoadingConnect(false);
		}
	};

	const handleSignMessage = async () => {
		setIsLoadingSign(true);
		try {
			const messageToSign = `Welcome to AudioBlocks! Sign this message to verify your wallet and unlock a world of decentralized music. Timestamp: ${new Date().toISOString()}`;

			// Sign message
			const signature = await signMessageAsync({ message: messageToSign });

			// Authenticate user
			const token = await authenticateUser(
				address,
				signature,
				messageToSign,
				"listener",
			);
			window.location.reload();
		} catch (error: any) {
			toast.error(error.message || "SignIn failed");
		} finally {
			setIsLoadingSign(false);
		}
	};

	const authenticateUser = async (
		address: any,
		signature: string,
		message: string,
		role: string,
	) => {
		const url = process.env.NEXT_PUBLIC_API_URL;

		try {
			const response = await axios.post(`${url}/wallet/auth/verify_signature`, {
				address,
				signature,
				message,
				role,
			});
			const token = response.data.token;
			Cookies.set("audioblocks_jwt", token);
			return token;
		} catch (error: any) {
			console.error(error.response?.data?.message);
			toast.error(error.response?.data?.message || "Authentication failed");
			
		}
	};

	return (
		<>
			{!isConnected && !jwt && (
				<button
					onClick={handleConnect}
					className="w-full bg-gradient-to-r from-[#B51960] to-[#B81A3F] text-white py-2 px-7 text-sm rounded-full hover:brightness-110 transition-all duration-300"
					disabled={isLoadingConnect}
				>
					{isLoadingConnect ? (
						<div className="relative w-5 h-5 m-auto">
							<div className="absolute inset-0 border-2 border-blue-100 rounded-full animate-spin-slow"></div>
							<div className="absolute inset-0 border-2 border-pink-900 border-t-transparent rounded-full animate-spin"></div>
						</div>
					) : (
						"Connect Wallet"
					)}
				</button>
			)}

			{isConnected && !jwt && (
				<button
					onClick={handleSignMessage}
					className="w-full bg-gradient-to-r from-[#B51960] to-[#B81A3F] text-white py-2 px-7 text-sm rounded-full hover:brightness-110 transition-all duration-300"
					disabled={isLoadingSign}
				>
					{isLoadingSign ? (
						<div className="relative w-5 h-5 m-auto">
							<div className="absolute inset-0 border-2 border-blue-100 rounded-full animate-spin-slow"></div>
							<div className="absolute inset-0 border-2 border-pink-900 border-t-transparent rounded-full animate-spin"></div>
						</div>
					) : (
						"Sign In"
					)}
				</button>
			)}

			{jwt && <AvatarDropdown />}
		</>
	);
};

export default ConnectBtn;
