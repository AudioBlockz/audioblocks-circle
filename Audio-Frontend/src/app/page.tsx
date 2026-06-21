"use client";
import AudioBoxFeatures from "@/components/AudioBoxFeatures";
import AudioCardItem from "@/components/AudioCardItem";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar2 from "@/components/Navbar2";
import Image from "next/image";
import headset from "/public/images/img.png";
import { uploadProfileDetails } from "@/hooks/uploadProfileDetails";
import { useAccount } from "wagmi";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

import Faq from "@/components/Faq";
import MusicScene from "@/components/MusicScene";


export default function Home() {
	const { artistProfileDetails } = uploadProfileDetails();
	const { isConnected } = useAccount();
	const token = Cookies.get("audioblocks_jwt");

	const getStarted = async () => {
		try {
			if (token && token.trim() !== "") {
				const redirectPath = artistProfileDetails ? "/dashboard" : "/dashboard/profile";
				// router.push(redirectPath);
				window.open(redirectPath, "_blank");
			} else {
				// Handle missing wallet connection or token
				if (!isConnected) {
					toast.error("Please connect your wallet");
				} else if (isConnected && !token) {
					toast.error("Please sign the Authentication message");
				}
			}
		} catch (error: any) {
			toast.error(error);
		}

	};


	return (
		<>
			<Navbar2 />
			<Hero />
			<AudioBoxFeatures />

			<MusicScene />
			<AudioCardItem />

			<Faq />
			<div className="bg-gradient-to-r border m-auto w-11/12 rounded-xl mb-9 border-[#1B1B1B] text-white py-6">

				<div className="grid w-11/12 m-auto items-center md:grid-cols-5 grid-cols-12 gap-6">
					<div className="md:col-span-2 col-span-12 md:text-left text-center md:pl-16 space-y-5">
						<h1 className="text-3xl md:text-5xl font-bold leading-tight">
							Stream,Support, and Own it!
						</h1>
						<p className="text-lg md:text-xl text-white">
							Join a community where your support makes a real difference, and
							every play, tip, or purchase helps artists thrive.
						</p>
						<div>
							<button
								onClick={getStarted}

								className="bg-gradient-to-r from-[#B1198E] to-[#B81A3F] text-white text-sm px-6 py-3 rounded-full"

							>
								Get Started
							</button>
						</div>
					</div>
					<div className="md:col-span-3 col-span-12">
						<Image
							className="w-full md:w-96 mx-auto"
							src={headset}
							alt="Headphone"
						/>
					</div>
				</div>
			</div>
			<div className="bg-[#471439] text-white py-4">
				<div className="container mx-auto flex items-center justify-center space-x-2">
					<span className="text-sm font-bold">Powered by</span>
					<img src="/images/lisk.png" alt="Lisk Logo" className="h-12" />
					<span className="text-sm font-bold">Lisk</span>
				</div>
			</div>
			<Footer />
		</>
	);
}