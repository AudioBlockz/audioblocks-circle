import React, { useState, useRef, useEffect } from "react";
import {
	Play,
	Redo,
	Pause,
	SkipForward,
	SkipBack,
	Volume2,
	EllipsisVertical,
	Volume1,
	VolumeX,
	Volume,
	Shuffle,
	Repeat,

	Heart,
} from "lucide-react";
import Cookies from "js-cookie";
import axios from "axios";
import { FaHeart } from "react-icons/fa";


export interface Song {
	id: string;
	name: string;
	artistName: string;
	animation_url: string;
	image: any;
	songId: any;

	// streams: number;
	// listeners: number;
	// saves: number;
	released: string;
}
interface MusicPlayerProps {
	songs: Song[];
	currentSongIndex: number;
	isPlaying: boolean;
	onPlayPause: () => void;
	onNextSong: () => void;
	onPreviousSong: () => void;
	onSongEnd: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
	songs,
	currentSongIndex,
	isPlaying,
	onPlayPause,
	onPreviousSong,
	onNextSong,
	onSongEnd,
}) => {
	const [currentTime, setCurrentTime] = useState<number>(0);
	const [duration, setDuration] = useState<number>(0);
	const [volume, setVolume] = useState<number>(1);
	const [isVolumeHovered, setIsVolumeHovered] = useState<boolean>(false);
	const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
	const [isShuffleOn, setIsShuffleOn] = useState<boolean>(false);
	const [shuffledQueue, setShuffledQueue] = useState<number[]>([]);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const volumeTimeout = useRef<NodeJS.Timeout>();
	const url = process.env.NEXT_PUBLIC_API_URL;
	const jwt = Cookies.get("audioblocks_jwt");
	const [likedSongs, setLikedSongs] = useState<{ [key: number]: boolean }>({});


	// Initialize shuffle queue
	useEffect(() => {
		if (isShuffleOn && shuffledQueue.length === 0) {
			const newQueue = Array.from({ length: songs.length }, (_, i) => i).filter(
				(i) => i !== currentSongIndex,
			);
			for (let i = newQueue.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
			}
			newQueue.unshift(currentSongIndex);
			setShuffledQueue(newQueue);
		}
	}, [isShuffleOn, songs.length, currentSongIndex]);

	const updateProgress = () => {
		if (audioRef.current) {
			setCurrentTime(audioRef.current.currentTime);
			setDuration(audioRef.current.duration);
		}
	};

	const handleProgressBarChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const newTime = parseFloat(event.target.value);
		setCurrentTime(newTime);
		if (audioRef.current) {
			audioRef.current.currentTime = newTime;
		}
	};

	const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(event.target.value);
		setVolume(newVolume);
		if (audioRef.current) {
			audioRef.current.volume = newVolume;
		}
	};

	const handleSongEnd = () => {
		if (repeatMode === "one") {
			if (audioRef.current) {
				audioRef.current.currentTime = 0;
				audioRef.current.play();
			}
		} else {
			const nextIndex = getNextSongIndex();
			if (nextIndex !== -1) {
				onNextSong();
			} else if (repeatMode === "all") {
				if (isShuffleOn) {
					setShuffledQueue([]); // Trigger new shuffle
				}
				onNextSong();
			} else {
				onSongEnd();
			}
		}
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

	const fetchLikedStatus = async () => {
		try {
			songs?.map(async (song) => {
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

	useEffect(() => {

		fetchLikedStatus();
	}, [songs]);


	const getNextSongIndex = (): number => {
		if (isShuffleOn) {
			const currentQueueIndex = shuffledQueue.indexOf(currentSongIndex);
			return currentQueueIndex < shuffledQueue.length - 1
				? shuffledQueue[currentQueueIndex + 1]
				: -1;
		}
		return currentSongIndex < songs.length - 1 ? currentSongIndex + 1 : -1;
	};

	const toggleRepeat = () => {
		setRepeatMode((current) => {
			switch (current) {
				case "off":
					return "all";
				case "all":
					return "one";
				case "one":
					return "off";
			}
		});
	};

	const toggleShuffle = () => {
		setIsShuffleOn((current) => !current);
		if (!isShuffleOn) {
			setShuffledQueue([]); // Trigger new shuffle
		}
	};

	const getVolumeIcon = () => {
		if (volume === 0) return <VolumeX />;
		if (volume < 0.3) return <Volume />;
		if (volume < 0.7) return <Volume1 />;
		return <Volume2 />;
	};

	const formatTime = (time: number): string => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
	};

	useEffect(() => {
		if (isPlaying && songs[currentSongIndex]) {

			audioRef.current?.play();
		} else {
			audioRef.current?.pause();
		}

	}, [isPlaying, currentSongIndex, songs]);


	const handleVolumeEnter = () => {
		if (volumeTimeout.current) {
			clearTimeout(volumeTimeout.current);
		}
		setIsVolumeHovered(true);
	};

	const handleVolumeLeave = () => {
		volumeTimeout.current = setTimeout(() => {
			setIsVolumeHovered(false);
		}, 300);
	};

	return (
		<div className="fixed grid grid-cols-1 z-30 md:grid-cols-4 gap-4 md:left-64 left-0 bottom-0 items-center justify-between w-full bg-gradient-to-b from-neutral-900 to-black text-white p-4 rounded-t-lg shadow-lg max-w-3xl mx-auto border-t border-neutral-800">

			<audio
				ref={audioRef}
				src={songs[currentSongIndex]?.animation_url?.replace(
					"ipfs://",
					`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
				)}
				onTimeUpdate={updateProgress}
				onEnded={handleSongEnd}
			/>

			<div className="flex col-span-1 items-center space-x-4 cursor-pointer">

				<img
					width={100}
					height={100}
					src={songs[currentSongIndex]?.image?.replace(
						"ipfs://",
						`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
					)}
					alt="Album Cover"
					className="md:w-12 md:h-12 w-8 h-8 rounded object-cover shadow-lg"
				/>
				<div className="overflow-hidden">
					<h3 className="text-white font-medium text-sm truncate hover:text-[#B6195B] transition-colors">

						{songs[currentSongIndex]?.name}
					</h3>
					<p className="text-neutral-400 text-xs truncate hover:text-white transition-colors">
						{songs[currentSongIndex]?.artistName}
					</p>
				</div>
			</div>

			<div className="flex col-span-2 space-y-2 flex-col">
				<div className="flex items-center justify-center space-x-4">

					<div
						onClick={() => toggleLike(songs[currentSongIndex]?.songId)}
						style={{ cursor: "pointer" }}
					>
						{likedSongs[songs[currentSongIndex]?.songId] ? (
							<FaHeart
								size={15}
								className="hover:scale-125 hover:-translate-y-1 transition-transform duration-200"
								color={"#B6195B"}
							/>
						) : (
							<Heart
								size={15}
								className="hover:scale-125 hover:-translate-y-1 transition-transform duration-200"
								color={"white"}
							/>
						)}
					</div>
					<button
						onClick={toggleShuffle}
						className={`text-neutral-400 hover:text-white transition-colors p-1 ${
							isShuffleOn ? "text-[#B6195B]" : ""

						}`}
					>
						<Shuffle className="w-4 h-4" />
					</button>
					<button
						onClick={onPreviousSong}
						className="text-neutral-400 hover:text-white transition-colors p-1"
					>
						<SkipBack className="w-5 h-5" />
					</button>
					<button
						onClick={onPlayPause}
						className="bg-white text-black p-2 rounded-full hover:bg-neutral-200 transition-colors"
					>
						{isPlaying ? (
							<Pause className="w-5 h-5" />
						) : (
							<Play className="w-5 h-5" />
						)}
					</button>
					<button
						onClick={onNextSong}
						className="text-neutral-400 hover:text-white transition-colors p-1"
					>
						<SkipForward className="w-5 h-5" />
					</button>
					<button
						onClick={toggleRepeat}
						className={`text-neutral-400 hover:text-white transition-colors p-1 relative ${

							repeatMode !== "off" ? "text-[#B6195B]" : ""

						}`}
					>
						<Repeat className="w-4 h-4" />
						{repeatMode === "one" && (
							<span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs">
								1
							</span>
						)}
					</button>
					<div
						className="relative group"
						onMouseEnter={handleVolumeEnter}
						onMouseLeave={handleVolumeLeave}
					>
						<button className="text-neutral-400 hover:text-white transition-colors p-1">
							{getVolumeIcon()}
						</button>
						<div
							className={`absolute left-1/2 -translate-x-1/2 bottom-full bg-neutral-800 rounded-lg px-3 py-1 transition-opacity duration-200 ${
								isVolumeHovered
									? "opacity-100"
									: "opacity-0 pointer-events-none"
							}`}
						>
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								value={volume}
								onChange={handleVolumeChange}
								className="w-20 h-1 appearance-none bg-neutral-600 rounded-lg cursor-pointer accent-[#B6195B] hover:accent-[#B6195B]"
								style={{
									background: `linear-gradient(to right, #B6195B 0%, #B6195B ${

										volume * 100
									}%, rgb(82, 82, 82) ${volume * 100}%, rgb(82, 82, 82) 100%)`,
								}}
							/>
						</div>
					</div>
				</div>

				<div className="flex items-center space-x-2 w-full">
					<span className="text-xs text-neutral-400">
						{formatTime(currentTime)}
					</span>
					<div className="relative w-full group">
						<input
							type="range"
							min="0"
							max={duration}
							step="0.1"
							value={currentTime}
							onChange={handleProgressBarChange}
							className="w-full h-1 appearance-none bg-neutral-600 rounded-full cursor-pointer accent-[#B6195B] hover:accent-[#B6195B]"
							style={{
								background: `linear-gradient(to right, #B6195B 0%, #B6195B ${

									(currentTime / duration) * 100
								}%, rgb(82, 82, 82) ${
									(currentTime / duration) * 100
								}%, rgb(82, 82, 82) 100%)`,
							}}
						/>
					</div>
					<span className="text-xs text-neutral-400">
						{duration ? formatTime(duration): "0:00"}
					</span>
				</div>
			</div>

			<button className="text-neutral-400 md:block hidden col-span-1 hover:text-white transition-colors justify-self-end p-1">
				<EllipsisVertical className="w-5 h-5" />
			</button>
		</div>
	);
};

export default MusicPlayer;
