import React from "react";
import SidebarItems from "./SidebarItems";
import {
	Upload,
	TrendingUp,
	Bolt,
	Settings,
	Star,
	CirclePlus,
	Music,
	FileMusic,
	Wallet,
	ArrowBigLeft,
	Mic,
	PowerIcon,
	User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDisconnect } from "wagmi";
import Cookies from "js-cookie";

const Sidebar = ({ isOpen, toggleClose }: any) => {
	const pathname = usePathname();
	const route = useRouter();
	const { disconnect } = useDisconnect();

	const disconnectWallet = () => {
		Cookies.remove("audioblocks_jwt");
		disconnect();
		route.push("/");
	};
	return (
		<>
			{isOpen && (
				<div
					onClick={toggleClose}
					className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
				></div>
			)}
			<div
        
				className={`bg-custom-gradient z-50 overflow-y-scroll  lg:translate-x-0 scrollbar-hide lg:block transform transition-transform duration-300  fixed h-screen ${

					isOpen ? "translate-x-0" : "-translate-x-96"
				} bg-black text-white text-base p-5`}
			>
				<div className="flex">
					<Link href="/" className="flex items-center space-x-3 mb-10">
					<img src="/images/logo1.png" height={30} width={30} alt="logo" className="rounded-full" />
						<h1 className="text-xl font-semibold text-pink-400">AudioBlocks</h1>
					</Link>

					<ArrowBigLeft
						onClick={toggleClose}
						className="lg:hidden ml-5 mt-3 block cursor-pointer"
						size={16}
					/>
				</div>

				<nav className="flex flex-col justify-between h-4/5">
					<div className="space-y-6 ">
						<div className=" text-white -mb-4">
							{/* <Bolt className="w-4 h-4" /> */}
							<span>Music</span>
						</div>
						<div className="border-t border-[#151515] pt-4">
							<SidebarItems
								icon={Bolt}
								label="Discover"
								to="/dashboard"
								isActive={pathname === "/dashboard"}
							/>
						</div>
						<SidebarItems
							icon={Wallet}
							label="Wallet"
							to="/dashboard/wallet"
							isActive={pathname === "/wallet"}
						/>
						<SidebarItems icon={Music} label="Playlist" to="#" />
						<SidebarItems
							icon={FileMusic}
							label="Artist"

							to="/dashboard/artist"
							isActive={pathname === "/dashboard/artist"}
						/>
						<div className="flex space-x-2">
							<SidebarItems
								icon={Mic}
								label="Subscription"
								to="#"
								isActive={pathname === "#"}
							/>
							<span className="bg-gray-400 text-gray-700 rounded-full text-xs px-1">
								soon
							</span>
						</div>
					</div>

					{/* <div className="pt-8 space-y-4">
						<h2 className="text-xs text-gray-500 mb-4">DISCOVERY</h2>
						<div className="space-y-6">
							<SidebarItems icon={TrendingUp} label="Trending" to="#" />
							<SidebarItems icon={Star} label="Popular" to="#" />
						</div>
					</div> */}

					{/* <div className="pt-8 space-y-3">
						<h2 className="text-xs text-gray-500 mb-4">MY PLAYLIST</h2>
						<SidebarItems icon={CirclePlus} label="Create New" />
						<ul className="space-y-5 mt-4 text-base text-gray-500">
							<li className="cursor-pointer hover:text-pink-500">Playlist 1</li>
							<li className="cursor-pointer hover:text-pink-500">Playlist 2</li>
							<li className="cursor-pointer hover:text-pink-500">Playlist 3</li>
						</ul>
					</div> */}

					<div className=" space-y-3 pt-32 text-base text-gray-500">
						<SidebarItems
							icon={User}
							label="Profile"
							to="/dashboard/profile"
							isActive={pathname === "/dashboard/profile"}
						/>
						<div onClick={disconnectWallet}>
							<SidebarItems icon={PowerIcon} label="Log Out" to="#" />
						</div>
					</div>
				</nav>
			</div>
		</>
	);
};

export default Sidebar;
