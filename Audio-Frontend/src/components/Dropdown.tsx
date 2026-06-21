"use client";
import { useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { useAccount, useBalance } from "wagmi";
import { useDisconnect } from "wagmi";
import Link from "next/link";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { uploadProfileDetails } from "@/hooks/uploadProfileDetails";

const truncateAddress = (address: any) =>
	`${address.slice(0, 6)}...${address.slice(-4)}`;

export default function AvatarDropdown() {
	const { address, isConnected } = useAccount();
	const { disconnect } = useDisconnect();
	const { data: balance } = useBalance({ address });
	const [isCopied, setIsCopied] = useState(false);
	const route = useRouter();
	const { artistProfileDetails } = uploadProfileDetails();

	const disconnectWallet = () => {
		Cookies.remove("audioblocks_jwt");
		disconnect();
		route.push("/");
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(address || "");
		setIsCopied(true);

		setTimeout(() => {
			setIsCopied(false);
		}, 3000);
	};

	// Generate a random avatar based on the address (or use a placeholder if not connected)
	const avatarUrl = isConnected
		? artistProfileDetails?.profilePicture
			? artistProfileDetails?.profilePicture?.replace(
					"ipfs://",
					`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
			  )
			: `https://api.dicebear.com/6.x/pixel-art/svg?seed=${address}`
		: "https://via.placeholder.com/40";

	return (
		<div className="relative font-roboto">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button className="flex items-center gap-2 rounded-full">
						<img
							src={avatarUrl}
							alt="Avatar"
							className="w-9 h-9 rounded-full border p-1 border-pink-600"
						/>
					</button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					className="w-48 bg-gradient-to-r from-black to-[#791f69] border rounded-lg shadow-lg p-2"
					align="end"
				>
					<div className="px-4 py-2">
						{isConnected && (
							<Tooltip.Provider>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<div className="flex items-center gap-2">
											<img
												src={avatarUrl}
												alt="Address Avatar"
												className="w-6 h-6 rounded-full"
											/>
											<p
												className="text-sm  overflow-hidden text-white cursor-pointer"
												onClick={handleCopy}
											>
												{truncateAddress(address)}
											</p>
										</div>
									</Tooltip.Trigger>
									<Tooltip.Portal>
										<Tooltip.Content
											className="px-3 py-1.5 text-sm text-white bg-black rounded-md shadow-lg border border-gray-900"
											sideOffset={5}
										>
											{isCopied ? "Copied!" : "Copy Address"}
											<Tooltip.Arrow className="fill-black" />
										</Tooltip.Content>
									</Tooltip.Portal>
								</Tooltip.Root>
							</Tooltip.Provider>
						)}
					</div>

					<p className="text-sm px-4 py-2 text-white">
						Balance:{" "}
						<span className="font-semibold text-pink-600">
							{balance?.formatted.slice(0, 6)} {balance?.symbol}
						</span>
					</p>

					<Link href="/dashboard">
						<DropdownMenuItem className="px-4 py-1 outline-none border-none font-medium hover:text-pink-600  cursor-pointer text-white">
							Dashboard
						</DropdownMenuItem>
					</Link>

					<Link href="/dashboard/profile">
						<DropdownMenuItem className="px-4 py-1 outline-none border-none font-medium hover:text-pink-600  cursor-pointer text-white">
							My profile
						</DropdownMenuItem>
					</Link>

					<DropdownMenuItem
						onClick={disconnectWallet}
						className="px-4 py-1 border-none outline-none font-medium hover:text-pink-600 cursor-pointer text-white"
					>
						Logout
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
