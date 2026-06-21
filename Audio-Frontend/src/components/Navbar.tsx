
"use client";
import { ArrowLeftToLine, Menu, Search, Upload, X } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import AvatarDropdown from "./Dropdown";
import SearchBar from "./SearchBar";



const Navbar = ({ toggleLeftBar, toggleOpen }: any) => {
	const [search, setSearch] = useState("");
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const handleSearch = () => {
		console.log("Searching for:", search);
	};

	const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
	};

	const handleSearchIconClick = () => {
		setIsSearchOpen(true);
	};

	const handleCloseSearch = () => {
		setIsSearchOpen(false);
	};

	return (
		<>
			<div className="w-full z-10 sticky top-10 bg-[#0A0507]">
				<nav className="items-center font-roboto w-11/12 m-auto text-white py-7 flex justify-between">
					<div>
						<ul className="flex gap-9 font-medium text-sm text-gray-400">
							<div>
								<Menu
									className="md:hidden block"
									onClick={toggleOpen}
									size={16}
								/>
							</div>
							{/* <Link href="/" className="hover:text-white">
								<li>Home</li>
							</Link>
							<Link href="/" className="hover:text-white md:block hidden">
								<li>Artist hub</li>
							</Link>
							<Link href="/dashboard/marketplace" className="hover:text-white">
								<li>Marketplace</li>
							</Link> */}
						</ul>
					
					</div>
					{/* <div className=" md:hidden block">
						{!isSearchOpen && (
							<Search
								onClick={handleSearchIconClick}
								className="text-gray-500 mr-2 md:hidden block"
								size={16}
							/>
						)}
						{isSearchOpen && (
							<X
								onClick={handleCloseSearch}
								className="text-gray-500 mr-2 md:hidden block"
								size={16}
							/>
						)}
					</div> */}
					<div className="w-3/4 md:block ">
					<SearchBar/>
					</div>
					<AvatarDropdown />
					<div className="md:hidden block">
						<ArrowLeftToLine
							className="-mr-10"
							onClick={toggleLeftBar}
							size={16}
						/>
					</div>
				</nav>
				{/* {isSearchOpen && (
					<div className="w-full mb-3 ">
						<div className="flex items-center bg-[#1D1F1F] rounded-full px-3 py-2">
							<Search className="text-gray-500 mr-2" size={16} />
							<input
								type="text"
								placeholder="Search by artists, songs or albums"
								className="w-full rounded-full  px-3 border-none focus:outline-none  bg-[#1D1F1F] text-white placeholder-gray-400"
							/>
						</div>
					</div>
				)} */}
			</div>
		</>
	);
};

export default Navbar;