"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EllipsisVertical, Heart, MessageCircle, Users } from "lucide-react";
import { Play } from "lucide-react";
import { PlayingIndicator } from "@/components/PlayingIndicator";
import { useMusicPlayer } from "@/context/MusicPlayer";
import * as Tabs from "@radix-ui/react-tabs";
import CommentSection from "@/components/Comment";

import { FaHeart } from "react-icons/fa";
import { contractAddress, abi } from "@/config/abi";
import { useReadContract, useReadContracts } from "wagmi";
import { useAccount } from "wagmi";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { ArtistCardSkeleton } from "@/components/ArtistCardSkeleton";
import { SongLikes } from "@/hooks/songLikes";


const ArtistId = () => {
	const { playSong, setSongs } = useMusicPlayer();
	const [songs, setSongsData] = useState<any[]>([]);
	const { address } = useAccount();
	const [artist, setArtist] = useState<any>();
	const params = useParams();

	const [likedSongs, setLikedSongs] = useState<{ [key: number]: boolean }>({});

	const [isLoading, setIsLoading] = useState(false);
	const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [hoveredRow, setHoveredRow] = useState<number | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);

	const url = process.env.NEXT_PUBLIC_API_URL;
	const jwt = Cookies.get("audioblocks_jwt");
	const router = useRouter();
	const { fetchLikes, likes } = SongLikes();

	const toggleBio = () => {
		setIsExpanded(!isExpanded);
	};


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
	const { data: artistId, isSuccess }: any = useReadContract({
		address: contractAddress,
		abi: abi,
		functionName: "getArtistById",
		args: [params.artistid],
		account: address,
	});
	// console.log(artistId.artistAddress);

	const fetchProfileDetails = useCallback(async (profileDataArray: any) => {

		setIsLoading(true);
		try {
			const gateway = profileDataArray.artistCid.replace(
				"ipfs://",
				`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
			);
			const response = await axios.get(gateway, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			const profile = response.data;
			setArtist(profile);
			setIsLoading(false);
		} catch (error: any) {
			setIsLoading(false);
			console.error("Error fetching profile details:", error.message);
		}
	}, []);


	useEffect(() => {
		if (artistId && isSuccess) {
			fetchProfileDetails(artistId);
		}
	}, [artistId, isSuccess]);

	// getallSongs

	const { data: songIds, isSuccess: issuccess }: any = useReadContract({
		address: contractAddress,
		abi: abi,
		functionName: "getArtistSongs",
		args: [artistId?.artistAddress],
		account: address,
	});

	const { data, isSuccess: success }: any = useReadContracts({
		contracts:
			songIds?.map((songid: any) => ({
				abi: abi,
				address: contractAddress,
				functionName: "getSongById",
				args: [songid],
				account: address,
			})) || [],
	});

	const fetchSong = async (songDataArray: any[]) => {
		try {
			const songs = [];
			setIsLoading(true);
			for (const songData of songDataArray) {
				const gateway = songData.result.songCID.replace(
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
					songId: Number(songData.result.songId),

					artistAddress: songData.result.artistAddress,

				};

				songs.push(artistSong);
				setSongsData(songs);

			}
			setIsLoading(false);
		} catch (error: any) {
			setIsLoading(false);
			console.error("Error fetching song details:", error.message);
		}
	};


	useEffect(() => {
		const fetchLikedStatus = async () => {
			try {
				const songIds = songs.map(async (song) => {
					fetchLikes(song.songId);
					const response = await axios.get(
						`${url}/song/isLiked/${song.songId}`,
						{
							headers: {
								Authorization: `Bearer ${jwt}`,
							},
						},
					);
					const likedData = response.data;
					if (likedData.isLiked) {
						setLikedSongs((prev) => ({
							...prev,
							[song.songId]: !(prev[song.songId] || false),
						}));
					}
				});
				// console.log(songIds);
			} catch (error: any) {
				console.error("Error fetching liked status:", error.message);
			}
		};


		fetchLikedStatus();
	}, [jwt, songs]);

	const isFetched = useRef(false);
	if (data && success && !isFetched.current) {
		isFetched.current = true; // Set the flag
		fetchSong(data); // Call your function only once
	}

	const handlePlaySong = (index: number) => {
		if (index === currentSongIndex && isPlaying) {
			setIsPlaying(false);
			setSongs(songs);

			playSong(index);
		} else {
			setCurrentSongIndex(index);
			setIsPlaying(true);
			setSongs(songs);

			playSong(index);
		}
	};


	const songDetails = (id: any, title: any) => {
		const formattedTitle = title.replace(/\s+/g, "-").toLowerCase();

		router.push(
			`/dashboard/artist/${params.artistid}/${formattedTitle}?id=${id}`,
		);
	};

	const renderSongNumber = (index: number) => {
		if (hoveredRow === index) {
			return <Play size={15} className="text-[#B6195B]" />;

		}
		if (currentSongIndex === index && isPlaying) {
			return <PlayingIndicator />;
		}
		return index + 1;
	};
	return (
		<>
			<div className="w-11/12 m-auto text-white">
				{isLoading ? (
					<ArtistCardSkeleton />
				) : (
					<div className="bg-gradient-to-r from-[#4B0B3E] to-[#274749] p-8 rounded-lg text-white flex items-center justify-between">
						<div className="flex-1 gap-2">
							<h1 className="md:text-6xl text-3xl font-bold">
								{artist?.fullName}
							</h1>
							<div className="flex  cursor-pointer">
								<p className="text-sm text-ellipsis" onClick={toggleBio}>
									{isExpanded ? artist?.bio : `${artist?.bio.slice(0, 53)}...`}
								</p>
							</div>


							{/* <div className=" grid grid-flow-col gap-2 w-2/5 mt-3">


								<span className="flex gap-2 text-xs">
									<MessageCircle size={15} /> 1020{" "}
								</span>
								<span className="flex gap-2 text-xs">
									<Users size={15} /> 1020
								</span>
								<span className="flex gap-2 text-xs ">
									<Heart size={15} /> 1,020
								</span>

							</div> */}

						</div>
						<div className="flex-shrink-0">
							<img
								src={artist?.profilePicture?.replace(
									"ipfs://",
									`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
								)}
								alt="Artist"
								className="md:w-40 md:h-40 w-20 h-20 rounded-3xl object-cover"

							/>
						</div>
					</div>
				)}
				<Tabs.Root defaultValue="songs">
					<Tabs.List className="flex space-x-4 my-8">
						<Tabs.Trigger
							value="songs"
							className="px-5 py-1 border font-semibold border-[#666C6C] text-[#666C6C] rounded-full data-[state=active]:bg-[#B6195B] data-[state=active]:border-none data-[state=active]:text-white hover:text-white  hover:bg-[#B6195B] text-sm"
						>
							Songs ({songs?.length})
						</Tabs.Trigger>
						<Tabs.Trigger
							value="album"
							className="px-5 py-1 border font-semibold border-[#666C6C] text-[#666C6C] rounded-full hover:bg-[#B6195B] data-[state=active]:bg-[#B6195B] data-[state=active]:border-none data-[state=active]:text-white hover:text-white text-sm"
						>
							Album
						</Tabs.Trigger>
						<Tabs.Trigger
							value="playlist"
							className="px-5 py-1 border font-semibold border-[#666C6C] text-[#666C6C] rounded-full hover:bg-[#B6195B] data-[state=active]:bg-[#B6195B] data-[state=active]:border-none data-[state=active]:text-white hover:text-white text-sm"
						>
							Playlist
						</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="songs">
						{/* <div className="overflow-x-auto mb-8"> */}
						<table className="min-w-full overflow-x-auto mb-8 text-[#666C6C] border-separate border-spacing-y-2">
							<thead>
								<tr className="text-sm hidden font-medium">
									<th className="p-3 text-left"></th>
									<th className="p-3 text-left"></th>
									<th className="p-3 text-left"></th>
									<th className="p-3 text-left"></th>
									<th className="p-3 text-left"></th>
									<th className="p-3 text-left"></th>
								</tr>
							</thead>
							{isLoading ? (
								<tbody>
									{Array.from({ length: 4 }).map((_, index) => (
										<tr
											key={index}
											className="animate-pulse bg-[#0E0B0E] bg-opacity-50 text-sm"
										>
											{/* Skeleton for song number */}
											<td className="p-3 w-10">
												<div className="h-4 w-6 bg-gray-700 rounded"></div>
											</td>

											{/* Skeleton for song image and name */}
											<td className="p-3 flex gap-1 items-center">
												<div className="relative">
													<div className="w-12 h-12 bg-gray-700 rounded-md"></div>
												</div>
												<div>
													<div className="h-4 bg-gray-700 rounded w-28 mb-2"></div>
													<div className="h-4 bg-gray-600 rounded w-20"></div>
												</div>
											</td>

											{/* Skeleton for artist name */}
											<td className="p-3 font-medium hidden md:table-cell text-left">
												<div className="h-4 bg-gray-700 rounded w-24"></div>
											</td>

											{/* Skeleton for song duration */}
											<td className="p-3 hidden md:table-cell font-medium text-left">
												<div className="h-4 bg-gray-700 rounded w-16"></div>
											</td>

											{/* Skeleton for like button */}
											<td className="p-3 font-medium text-center hidden md:table-cell">
												<div className="w-6 h-6 bg-gray-700 rounded-full"></div>
											</td>

											{/* Skeleton for options button */}
											<td className="p-3 font-medium text-center">
												<div className="w-6 h-6 bg-gray-700 rounded-full"></div>
											</td>
										</tr>
									))}
								</tbody>

							) : songs?.length > 0 ? (
								<tbody>
									{songs?.map((song: any, index: any) => (
										<tr
											key={index}
											className={`hover:bg-[#0E0B0E] text-sm cursor-pointer transition-colors ${
												currentSongIndex === index
													? "bg-[#0E0B0E] bg-opacity-50"
													: ""
											}`}
											onMouseEnter={() => setHoveredRow(index)}
											onMouseLeave={() => setHoveredRow(null)}
										>
											<td
												onClick={() => handlePlaySong(index)}
												className="p-3 w-10"
											>
												<div className="flex items-center justify-center w-6">
													{renderSongNumber(index)}
												</div>
											</td>
											<td className="p-3 flex gap-1 items-center">

												<div className="relative">
													<img
														src={song?.image.replace(
															"ipfs://",
															`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
														)}
														alt={`${song?.name} Cover`}
														width={48}
														height={48}
														className={`rounded-md mr-4 ${
															currentSongIndex === index && isPlaying
																? "animate-pulse"
																: ""
														}`}
													/>
												</div>

												<div
													onClick={() => songDetails(song?.songId, song?.name)}
												>
													<p
														className={`font-medium text-left text-sm ${
															currentSongIndex === index ? "text-[#B6195B]" : ""

														}`}
													>
														{song?.name}
													</p>

												</div>
											</td>
											<td className="p-3 font-medium hidden md:table-cell text-left">
												{artist?.fullName}
											</td>
											<td className="p-3 hidden md:table-cell font-medium text-left">
												{song.duration}
											</td>
											<td

												className="p-3 font-medium cursor-pointer text-center hidden md:table-cell"
												onClick={() => toggleLike(song?.songId)}
												style={{ cursor: "pointer" }}
											>
												{likedSongs[song?.songId] ? (
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

											</td>
											<td className="p-3 font-medium text-center ">
												<EllipsisVertical size={20} />
											</td>
										</tr>
									))}
								</tbody>
							) : (
								<div className="flex flex-col items-center justify-center h-full">
									<p className="text-lg font-medium text-gray-600">
										No songs available for this artist.
									</p>
								</div>
							)}
						</table>
						{/* </div> */}
					</Tabs.Content>
					<Tabs.Content value="album">
						<div className="h-64 text-center">No Album created</div>
					</Tabs.Content>
					<Tabs.Content value="playlist">
						<div className="h-64 text-center">No Playlist created</div>
					</Tabs.Content>
				</Tabs.Root>
				{/* <CommentSection /> */}

			</div>
		</>
	);
};

export default ArtistId;
