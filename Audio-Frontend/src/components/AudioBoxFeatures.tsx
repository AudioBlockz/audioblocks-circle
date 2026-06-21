import {
	CircleDollarSign,
	CirclePlay,
	Headset,
	Home,
	Music,
} from "lucide-react";
import React from "react";

const AudioBoxFeatures = () => {
	return (
		<div className="bg-[#0E070C] font-roboto w-11/12 mx-auto rounded-xl text-white py-16 md:my-7 px-8">
			<div className="text-center mb-12">
				<h1 className="text-4xl font-bold mb-2">A New Way to Listen</h1>
				<p className="text-gray-400">
					From discovering new tracks to supporting your favorite artists.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
				<div className="border border-[#1B1B1B] p-6 rounded-lg hover:bg-[#FFFFFF08] hover:scale-105 transition-all duration-300">
					<div className="flex items-center mb-4">
						<div className="border-[#3B3B3B] border-2 p-1 rounded-full">
							<span aria-label="music-experience" className="text-[#3B3B3B]">
								<CirclePlay />
							</span>
						</div>
						<h2 className="ml-4 text-xl font-semibold">
							Seamless Music Experience
						</h2>
					</div>
					<p className="text-gray-400">
						Enjoy uninterrupted, high-quality streaming with a user-friendly
						interface.
					</p>
				</div>

				{/* Card 2 */}
				<div className="border border-[#1B1B1B] p-6 rounded-lg hover:bg-[#FFFFFF08] hover:scale-105 transition-all duration-300">
					<div className="flex items-center mb-4">
						<div className="border-[#3B3B3B] border-2 p-1 rounded-full">
							<span aria-label="music-experience" className="text-[#3B3B3B]">
								<CirclePlay />
							</span>
						</div>
						<h2 className="ml-4 text-xl font-semibold">Ad-Free Listening</h2>
					</div>
					<p className="text-gray-400">
						Enjoy uninterrupted listening with an ad-free environment.
					</p>
				</div>

				{/* Card 3 */}
				<div className="border border-[#1B1B1B] p-6 rounded-lg hover:bg-[#FFFFFF08] hover:scale-105 transition-all duration-300">
					<div className="flex items-center mb-4">
						<div className="border-[#3B3B3B] border-2 p-1 rounded-full">
							<span aria-label="music-experience" className="text-[#3B3B3B]">
								<CirclePlay />
							</span>
						</div>
						<h2 className="ml-4 text-xl font-semibold">
							NFT Music Marketplace
						</h2>
					</div>
					<p className="text-gray-400">
						Explore and purchase music NFTs in an ad-free environment.
					</p>
				</div>

				{/* Card 4 */}
				<div className="border border-[#1B1B1B] p-6 rounded-lg hover:bg-[#FFFFFF08] hover:scale-105 transition-all duration-300">
					<div className="flex items-center mb-4">
						<div className="border-[#3B3B3B] border-2 p-1 rounded-full">
							<span aria-label="music-experience" className="text-[#3B3B3B]">
								<CircleDollarSign />
							</span>
						</div>
						<h2 className="ml-4 text-xl font-semibold">Stream and Earn</h2>
					</div>
					<p className="text-gray-400">
						Enjoy uninterrupted listening while earning through streaming.
					</p>
				</div>
			</div>
		</div>
	);
};

export default AudioBoxFeatures;
