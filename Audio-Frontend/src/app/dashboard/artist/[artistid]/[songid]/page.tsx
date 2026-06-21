"use client";
import { Heart, MessageCircle, Play, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { contractAddress, abi } from "@/config/abi";
import { useReadContract } from "wagmi";
import axios from "axios";
import Cookies from "js-cookie";
import { FaHeart } from "react-icons/fa";
import { useMusicPlayer } from "@/context/MusicPlayer";
import CommentSection from "@/components/Comment";
import {SongLikes} from "@/hooks/songLikes";

const SongDetails = () => {
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);
	const [songData, setSongData] = useState<any>([]);
	const [likedSongs, setLikedSongs] = useState<{ [key: number]: boolean }>({});
	const url = process.env.NEXT_PUBLIC_API_URL;
	const jwt = Cookies.get("audioblocks_jwt");
	const uid = searchParams.get("id");
	const id = Number(uid);
	const { fetchLikes, likes } = SongLikes();

	const { playSong, setSongs } = useMusicPlayer();
	const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);

	const handlePlaySong = (index: any) => {
		if (index === currentSongIndex && isPlaying) {
			setIsPlaying(false);
			setSongs([songData]);
			playSong(index);
		} else {
			setCurrentSongIndex(index);
			setIsPlaying(true);
			setSongs([songData]);
			playSong(index);
		}
	};

	const { data, isSuccess: success }: any = useReadContract({
		abi: abi,
		address: contractAddress,
		functionName: "getSongById",
		args: [id],
	});

	const fetchSong = async (songData: any) => {
		try {
			setIsLoading(true);
			const gateway = songData.songCID.replace(
				"ipfs://",
				`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
			);
			const response = await axios.get(gateway, {
				headers: {
					"Content-Type": "application/json",
				},
			});
			const artistSong = {
				...response.data,
				songId: Number(songData.songId),
			};
			setSongData(artistSong);

			setIsLoading(false);
		} catch (error: any) {
			setIsLoading(false);
			console.error("Error fetching song details:", error.message);
		}
	};

	useEffect(() => {
		if (success && data) {
			fetchSong(data);
		}
	}, [data]);

	const toggleLike = async (index: number) => {
		const isLiked = likedSongs[index] || false;

		try {
			if (isLiked) {
				// Unlike the song
				await axios.post(
					`${url}/song/unlike`,
					{ songId: index },
					{
						headers: {
							Authorization: `Bearer ${jwt}`,
						},
					},
				);
			} else {
				// Like the song
				await axios.post(
					`${url}/song/like`,
					{ songId: index },
					{
						headers: {
							Authorization: `Bearer ${jwt}`,
						},
					},
				);
			}

			// Update local like state
			setLikedSongs((prev) => ({
				...prev,
				[index]: !(prev[index] || false),
			}));
		} catch (error: any) {
			console.error("Error toggling like:", error.message);
		}
	};

	useEffect(() => {
		fetchLikes(id);
		const fetchLikedStatus = async () => {
			try {
				const response = await axios.get(`${url}/song/isLiked/${id}`, {
					headers: {
						Authorization: `Bearer ${jwt}`,
					},
				});
				const likedData = response.data;
				if (likedData.isLiked) {
					setLikedSongs((prev) => ({
						...prev,
						[id]: likedData.isLiked,
					}));
				}
			} catch (error: any) {
				console.error("Error fetching liked status:", error.message);
			}
		};

		fetchLikedStatus();
	}, [jwt]);

	return (
		<>
			<div className="bg-gradient-to-r from-[#4B0B3E] to-[#274749] p-8 rounded-lg text-white flex md:flex-row flex-col items-center justify-between">
				<div className="flex-1 gap-2" >
					<div className="flex space-x-3 items-center">
						<div
							onClick={() => handlePlaySong(id)}
							className="w-10 h-10 cursor-pointer flex justify-center items-center rounded-full bg-[#0E0B0E]"
						>
							<Play size={20} />
						</div>
						<h1 className="md:text-6xl text-3xl font-bold">{songData?.name}</h1>
					</div>
					<div className="flex">
						<p className="text-sm mt-2 text-white">{songData?.artistName}</p>
					</div>

					<div className=" grid grid-flow-col gap-2 w-2/5 mt-3">
						<span className="flex gap-2 text-xs">
							<MessageCircle size={15} /> 1020{" "}
						</span>
						<span className="flex gap-2 text-xs">
							<Users size={15} /> 1020
						</span>
						<span
							onClick={() => toggleLike(id)}
							className="flex gap-2 text-xs cursor-pointer "
						>
							{likedSongs[id] ? (
								<div className="flex gap-2 text-xs cursor-pointer ">
									<FaHeart
										size={15}
										className="hover:scale-125 hover:-translate-y-1 transition-transform duration-200"
										color={"#B6195B"}
									/>
									<span>{likes}</span>
								</div>
							) : (
                                <div className="flex gap-2 text-xs cursor-pointer ">
								<Heart
									size={15}
									className="hover:scale-125 hover:-translate-y-1 transition-transform duration-200"
									color={"white"}
								/>
                                <span>{likes}</span>
								</div>
							)}
						</span>
					</div>
				</div>
				<div className="flex-shrink-0 md:order-2 order-1">
					<img
						src={songData?.image?.replace(
							"ipfs://",
							`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
						)}
						alt="Artist"
						className="md:w-40 md:h-40 w-20 h-20 rounded-3xl object-cover"
					/>
				</div>
			</div>
			<CommentSection songid={id} />
		</>
	);
};

export default SongDetails;
