"use client";
import Slider from "react-slick";
// import { useRouter } from "next/navigation";
import { fetchAllSongs } from "@/hooks/fetchAllSongs";
import { useMusicPlayer } from "@/context/MusicPlayer";
// import { PlayingIndicator } from "./PlayingIndicator";
import { Play } from "lucide-react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Skeleton for when no songs are found
const SkeletonCard = () => (
	<div className="flex flex-col items-center">
		<div className="w-40 h-40 rounded-full bg-gray-700 animate-pulse mb-4"></div>
		<div className="h-4 w-28 bg-gray-700 animate-pulse rounded mb-2"></div>
	</div>
);

const Trending = () => {
	const { musics, isLoading } = fetchAllSongs();

	const { playSong, setSongs } = useMusicPlayer();
	const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);


	const handlePlaySong = (index: number) => {
		if (index === currentSongIndex && isPlaying) {
			setIsPlaying(false);
			setSongs(musics);
			playSong(index);
		} else {
			setCurrentSongIndex(index);
			setIsPlaying(true);
			setSongs(musics);
			playSong(index);
		}
	};

	const settings = {
		dots: true,
		infinite: true,
		speed: 500,
		slidesToShow: 4,
		slidesToScroll: 1,
		responsive: [
			{
				breakpoint: 1024,
				settings: {
					slidesToShow: 3,
					slidesToScroll: 1,
					infinite: true,
				},
			},
			{
				breakpoint: 768,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1,
				},
			},
			{
				breakpoint: 480,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1,
				},
			},
		],
	};

	return (
		<div className="text-white border-b border-[#151515] pb-5 font-roboto pt-6">
			<h2 className="text-base font-bold mb-4">Trending</h2>
			{isLoading ? (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
					{[...Array(4)].map((_, index) => (
						<SkeletonCard key={index} />
					))}
				</div>
			) : musics.length > 0 ? (
				<Slider {...settings}>
					{musics.map((music, index) => (
						<div
							key={music.id}
							className={`group cursor-pointer transition-colors ${
								currentSongIndex === index ? "bg-[#0E0B0E] bg-opacity-50" : ""
							}`}
							onClick={() => handlePlaySong(index)}
						>
							<div className="rounded-lg shadow-lg overflow-hidden flex items-center flex-col ">
								{/* Image */}
								<div className="rounded-full relative">
									<img
										src={music.image.replace(
											"ipfs://",
											`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
										)}
										width={180}
										height={200}
										alt={music.fullName}
										className="w-40 rounded-full relative h-40 object-cover group-hover:shadow-xl group-hover:shadow-black transition-all"
									/>
									<div className="absolute inset-0 w-10 h-10 border shadow-md rounded-full bg-gray-400 m-auto flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
										<Play size={20} color="#0E0B0E" />
									</div>
								</div>

								{/* Text Content */}

								<div className="p-4 pt-2 md:text-center text-left">
									<p className="text-sm text-gray-400">
										{music.name.replace(/_/g, " ")}
									</p>
								</div>
							</div>
						</div>
					))}
				</Slider>
			) : (
				<div className="text-center lg:p-10">
					<h1 className="text-4xl lg:text-6xl font-bold text-gray-900">
						AudioBlocks
					</h1>
				</div>

			)}
		</div>
	);
};

export default Trending;
