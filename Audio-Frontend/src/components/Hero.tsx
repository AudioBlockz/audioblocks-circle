import React, { useState } from "react";
import bottom from "/public/images/bottoms.svg";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import EmailVerificationModal from "./VerificationModal";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { useAccount } from "wagmi";

import { uploadProfileDetails } from "@/hooks/uploadProfileDetails";
const Hero = () => {
	const [email, setEmail] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const url = "https://theaudiobox-backend.onrender.com";
	const token = Cookies.get("audioblocks_jwt");

	const { artistProfileDetails } = uploadProfileDetails();
	const {isConnected} = useAccount();
	

	const getStarted = async() => {
		try {
			if (token && token.trim() !== "") {
				const redirectPath = artistProfileDetails ? "/dashboard" : "/dashboard/profile";

				// router.push(redirectPath);
				window.open(redirectPath, "_blank");

			} else {
				// Handle missing wallet connection or token
				if (!isConnected) {
					toast.error("Please connect your wallet");
				} else if(isConnected && !token){
					toast.error("Please sign the Authentication message");
				}
			}
		} catch (error:any) {
			toast.error(error);
		}
		
	};
	
	const JoinWaitlist = () => {
		setIsModalOpen(true);
	};

	const verifyEmail = async () => {
		setLoading(true);
		try {
			const response = await axios.post(`${url}/waitlist/join`, { email });
			toast.success(response.data.message || "Your email has been Added!");
		} catch (error: any) {
			toast.error(
				error?.response.data.message ||
					"There was an error joining the waitlist. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className=" bg-gradient-to-br flex flex-col md:pt-36 font-roboto md:-mt-24 md:mb-0 -mb-24 from-[#1d02185c] to-transparent h-screen  justify-center items-center">
				<div className="text-center w-11/12 m-auto">
					<h1
						className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-[#B11993] to-[#50F3FF] text-transparent bg-clip-text"
						style={{
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
						}}
					>
						Stream Music <br /> Own the Experience
					</h1>
					<p className="text-lg md:text-xl text-white mt-5">
						Own the music, earn tokens, revolutionize the industry
					</p>
					<div className="md:flex md:justify-center items-center md:gap-5 gap-0">
						<div className="mt-10 flex justify-center md:justify-start gap-5">
							<button
								onClick={getStarted}
								className="bg-gradient-to-r from-[#B1198E] to-[#B81A3F] text-white text-sm px-5 md:py-4 py-3 rounded-3xl w-full text-center md:w-[196px] h-auto md:h-[50px]"
							>
								Start Listening
							</button>

							
							<div className="p-[2px] bg-gradient-to-r from-[#B1198E] to-[#B81A3F] rounded-3xl w-full md:w-[196px]">
								<button
									onClick={() => window.open("https://audioblocks-artist.vercel.app/", "_blank")}
									className="bg-black text-white text-sm px-5 md:py-4 py-3 rounded-3xl w-full h-auto md:h-[50px]"
								>
									Artist Hub
								</button>
							</div>
						</div>
					</div>


						{/* <div className="flex md:w-1/3 w-full justify-between relative items-center border-2 md:p-2 p-1 border-pink-500 mt-10 rounded-full overflow-hidden">
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="name@domain.com"
								className="text-white bg-transparent px-4 py-1 focus:outline-none placeholder-gray-400"
							/>

							<button
								onClick={JoinWaitlist}
								disabled={loading}
								className="bg-pink-600 absolute right-1 md:text-base text-xs text-white font-medium md:px-6 px-3 py-2 rounded-full focus:outline-none hover:bg-pink-700 transition"
							>
								Join the Waitlist
							</button>
						</div> */}
					</div>

					<div className="md:h-32 h-44 my-7">
						<Image
							src={bottom}
							alt=""
							className="md:h-32 h-44 rounded-full object-cover"
						/>
					</div>
				</div>

			<EmailVerificationModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onVerify={verifyEmail}
				loading={loading}
				setEmail={setEmail}
				email={email}
			/>
		</>
	);
};

export default Hero;
