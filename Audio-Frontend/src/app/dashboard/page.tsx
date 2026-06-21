"use client";
import Image from "next/image";
import image from "/public/images/Group1.png";
import Artist from "@/components/Artist";
import Trending from "@/components/Trending";
import { useEffect } from "react";
import { uploadProfileDetails } from "@/hooks/uploadProfileDetails";
import { useRouter } from "next/navigation";

const Dashboard = () => {
	const route = useRouter();
  const { artistProfileDetails, isLoading } = uploadProfileDetails();

	useEffect(() => {
		if (!isLoading && !artistProfileDetails) {
			route.push("/dashboard/profile");
		}
	}, [artistProfileDetails, isLoading, route]);

	return (
		<>
			<div className="w-11/12 m-auto mt-4 text-white">
				<div className="grid grid-cols-12">
					<div className="col-span-12">
						<div className="relative bg-gradient-to-r gap-x-9 items-center flex md:flex-row flex-col justify-between from-[#4B0B3E] to-[#274749] text-white p-8 md:h-[280px] h-auto rounded-lg mb-8">
							<div className="w-[288px]">
								<h1 className="text-2xl font-bold text-white mb-2">
									Unlock Exclusive Music NFTs
								</h1>
								<p className="text-base mb-4 text-[#91A2A4]">
									Explore our NFT marketplace. Support your favorite artists
									while owning a piece of music history.
								</p>
							</div>

							<div className="">
								<Image src={image} alt="Music" width={260} height={228} />
							</div>
						</div>

						<Artist />
						<Trending />
					</div>
				</div>
			</div>
		</>
	);
};

export default Dashboard;
