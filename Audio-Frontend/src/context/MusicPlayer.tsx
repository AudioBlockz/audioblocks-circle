// import React, {
// 	createContext,
// 	useContext,
// 	useState,
// 	useCallback,
// 	useEffect,
// 	useRef,
// } from "react";
// import { Song } from "../components/MusicPlayer";
// import Cookies from "js-cookie";
// import axios from "axios";
// import { abi, contractAddress } from "@/config/abi";
// import { useAccount, useReadContract } from "wagmi";

// interface MusicPlayerContextType {
// 	songs: Song[];
// 	currentSongIndex: number;
// 	isPlaying: boolean;
// 	setSongs: (songs: any) => void;
// 	playSong: (index: number) => void;
// 	playNextSong: () => void;
// 	playPreviousSong: () => void;
// 	togglePlayPause: () => void;
// 	handleSongEnd: () => void;
// }

// const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
// 	undefined,
// );

// export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({
// 	children,
// }) => {
// 	// const [songs, setSongs] = useState<Song[]>([]);
// 	const [songs, setSongs] = useState<Song[]>(() => {
// 		const savedSongs = localStorage.getItem("songs");
// 		return savedSongs ? JSON.parse(savedSongs) : [];
// 	});

// 	const [currentSongIndex, setCurrentSongIndex] = useState(() => {
// 		const savedIndex = localStorage.getItem("currentSongIndex");
// 		return savedIndex ? Number(savedIndex) : 0;
// 	});

// 	const [isPlaying, setIsPlaying] = useState(() => {
// 		const savedPlaying = localStorage.getItem("isPlaying");
// 		return savedPlaying === "true";
// 	});
// 	const url = process.env.NEXT_PUBLIC_API_URL;
// 	const jwt = Cookies.get("audioblocks_jwt");
// 	const { address } = useAccount();

// 	const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);

// 	const startSongSession = async (
// 		userAddress: any,
// 		artistAddress: any,
// 		songId: number,
// 	) => {
// 		try {
// 			const startTime = new Date().toISOString(); // Current timestamp

// 			const response = await axios.post(
// 				`${url}/song/start-song-session`,
// 				{
// 					userAddress,
// 					artistAddress,
// 					songId,
// 					startTime,
// 				},
// 				{
// 					headers: {
// 						"Content-Type": "application/json",
// 						Authorization: `Bearer ${jwt}`,
// 					},
// 				},
// 			);

// 			if (response) {
// 				const data = await response;
// 				setCurrentStreamId(data.data._id);
// 			} else {
// 				console.error("Failed to start song session");
// 			}
// 		} catch (error) {
// 			console.error("Error starting song session:", error);
// 		}
// 	};

// 	const endSongSession = async (artistAddress: string) => {
// 		if (!currentStreamId) return; // If no active stream, skip ending session

// 		try {
// 			const endTime = new Date().toISOString(); // Current timestamp
// 			const response = await axios.post(
// 				`${url}/song/end-song-session`,
// 				{
// 					streamId: currentStreamId,
// 					endTime,
// 					artistAddress,
// 				},
// 				{
// 					headers: {
// 						"Content-Type": "application/json",
// 						Authorization: `Bearer ${jwt}`,
// 					},
// 				},
// 			);

// 			if (response) {
// 				const data = await response;
// 				console.log("Song session ended:", data);
// 			} else {
// 				console.error("Failed to end song session");
// 			}
// 		} catch (error) {
// 			console.error("Error ending song session:", error);
// 		}
// 	};

// 	useEffect(() => {
// 		localStorage.setItem(
// 			"songs",
// 			JSON.stringify(songs, (key, value) =>
// 				typeof value === "bigint" ? value.toString() : value,
// 			),
// 		);
// 	}, [songs]);

// 	useEffect(() => {
// 		localStorage.setItem("currentSongIndex", currentSongIndex.toString());
// 	}, [currentSongIndex]);

// 	useEffect(() => {
// 		localStorage.setItem("isPlaying", isPlaying.toString());
// 	}, [isPlaying]);

// 	const playSong = useCallback(async (index: number) => {
// 		const { songId, artistAddress }: any = songs[index];

// 		await startSongSession(address, artistAddress, songId);

// 		setCurrentSongIndex(index);
// 		setIsPlaying(true);
// 	}, []);

// 	const playNextSong = useCallback(() => {
// 		if (currentSongIndex < songs.length - 1) {
// 			setCurrentSongIndex((prev) => prev + 1);
// 			setIsPlaying(true);
// 		}
// 	}, [currentSongIndex, songs.length]);

// 	const playPreviousSong = useCallback(() => {
// 		if (currentSongIndex > 0) {
// 			setCurrentSongIndex((prev) => prev - 1);
// 			setIsPlaying(true);
// 		}
// 	}, [currentSongIndex]);

// 	const togglePlayPause = useCallback(() => {
// 		setIsPlaying((prev) => !prev);
// 	}, []);

// 	const handleSongEnd = useCallback(() => {
// 		console.log(songs.length);
// 		const { artistAddress }: any = songs[currentSongIndex];
// 		endSongSession(artistAddress);

// 		if (currentSongIndex < songs.length - 1) {
// 			playNextSong();
// 		} else {
// 			setIsPlaying(false);
// 			setCurrentSongIndex(0);
// 		}
// 	}, [currentSongIndex, songs.length, playNextSong]);

// 	return (
// 		<MusicPlayerContext.Provider
// 			value={{
// 				songs,
// 				currentSongIndex,
// 				isPlaying,
// 				setSongs,
// 				playSong,
// 				playNextSong,
// 				playPreviousSong,
// 				togglePlayPause,
// 				handleSongEnd,
// 			}}
// 		>
// 			{children}
// 		</MusicPlayerContext.Provider>
// 	);
// };

// export const useMusicPlayer = () => {
// 	const context = useContext(MusicPlayerContext);
// 	if (context === undefined) {
// 		throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
// 	}
// 	return context;
// };

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	useRef,
} from "react";
import { Song } from "../components/MusicPlayer";
import Cookies from "js-cookie";
import axios from "axios";
import { abi, contractAddress } from "@/config/abi";
import { useAccount, useReadContract } from "wagmi";

interface MusicPlayerContextType {
	songs: Song[];
	currentSongIndex: number;
	isPlaying: boolean;
	setSongs: (songs: Song[]) => void; // Fixed type
	playSong: (index: number) => void;
	playNextSong: () => void;
	playPreviousSong: () => void;
	togglePlayPause: () => void;
	handleSongEnd: () => void;
}

interface SessionData {
	streamId: string;
	startTime: string;
	artistAddress: string;
	userAddress: string;
}
const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
	undefined,
);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [songs, setSongs] = useState<Song[]>(() => {
		try {
			const savedSongs = localStorage.getItem("songs");
			return savedSongs ? JSON.parse(savedSongs) : [];
		} catch (error) {
			console.error("Error loading songs from localStorage:", error);
			return [];
		}
	});

	const [currentSongIndex, setCurrentSongIndex] = useState(() => {
		const savedIndex = localStorage.getItem("currentSongIndex");
		return savedIndex ? Number(savedIndex) : 0;
	});

	const [isPlaying, setIsPlaying] = useState(() => {
		const savedPlaying = localStorage.getItem("isPlaying");
		return savedPlaying === "true";
	});

	const url = process.env.NEXT_PUBLIC_API_URL;
	const jwt = Cookies.get("audioblocks_jwt");
	const { address } = useAccount();

	const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
	const currentSessionRef = useRef<SessionData | null>(null);

	const startSongSession = async (
		userAddress: string,
		artistAddress: string,
		songId: number,
	): Promise<void> => {
		try {
			if (!jwt) {
				console.error("No JWT token found");
				throw new Error("Authentication token missing");
			}

			const startTime = new Date().toISOString();

			const response = await axios.post(
				`${url}/song/start-song-session`,
				{
					userAddress,
					artistAddress,
					songId,
					startTime,
				},
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${jwt}`,
					},
				},
			);

			// Log the exact response structure
			console.log("Raw API Response:", {
				status: response.status,
				headers: response.headers,
				data: response.data,
			});

			// Try to find the ID field (it might be named differently)
			const streamId = response.data.data._id;

			if (!streamId) {
				throw new Error(
					`No stream ID found in response. Available fields: ${Object.keys(
						response.data,
					).join(", ")}`,
				);
			}

			// Store session data
			setCurrentStreamId(streamId);
			currentSessionRef.current = {
				streamId,
				startTime,
				artistAddress,
				userAddress,
			};

			console.log("Session successfully started:", {
				streamId,
				currentSession: currentSessionRef.current,
			});
		} catch (error: any) {
			console.error("Detailed start session error:", error.message);

			// Clear any partial session data
			setCurrentStreamId(null);
			currentSessionRef.current = null;

			throw error;
		}
	};

	const endSongSession = async (artistAddress: string): Promise<void> => {
		try {
			// Check if there's an active session
			if (!currentStreamId || !currentSessionRef.current) {
				console.log("No active session to end");
				return;
			}

			if (!address) {
				console.error("User address not available");
				return;
			}

			const endTime = new Date().toISOString();

			const requestBody = {
				streamId: currentStreamId,
				endTime,
				artistAddress,
				userAddress: address,
			};

			const response = await axios.post(
				`${url}/song/end-song-session`,
				requestBody,
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${jwt}`,
					},
				},
			);

			// Clear session data
			currentSessionRef.current = null;
			setCurrentStreamId(null);
		} catch (error: any) {
			console.error("End session error:", error.message);
		}
	};

	// Persist state to localStorage
	useEffect(() => {
		try {
			localStorage.setItem(
				"songs",
				JSON.stringify(songs, (key, value) =>
					typeof value === "bigint" ? value.toString() : value,
				),
			);
		} catch (error) {
			console.error("Error saving songs to localStorage:", error);
		}
	}, [songs]);
	

	useEffect(() => {
		localStorage.setItem("currentSongIndex", currentSongIndex.toString());
	}, [currentSongIndex]);

	useEffect(() => {
		localStorage.setItem("isPlaying", isPlaying.toString());
	}, [isPlaying]);

	// Cleanup effect for ending sessions
	useEffect(() => {
		return () => {
			// Cleanup on unmount
			if (currentSessionRef.current) {
				const { artistAddress } = currentSessionRef.current;
				endSongSession(artistAddress);
			}
		};
	}, []);

	const playSong = useCallback(
		async (index: number) => {
			if (index < 0 || index >= songs.length) return;

			try {
				const { songId, artistAddress }: any = songs[index];

				// End current session if it exists
				if (currentStreamId && currentSessionRef.current) {
					await endSongSession(currentSessionRef.current.artistAddress);
				}

				// Start new session
				await startSongSession(address!, artistAddress, songId);

				setCurrentSongIndex(index);
				setIsPlaying(true);
			} catch (error) {
				console.error("Error in playSong:", error);
				setIsPlaying(false);
			}
		},
		[songs, currentSongIndex, address, currentStreamId],
	);

	const playNextSong = useCallback(async () => {
		if (currentSongIndex < songs.length - 1) {
			await playSong(currentSongIndex + 1);
		}
	}, [currentSongIndex, songs.length, playSong]);

	const playPreviousSong = useCallback(async () => {
		if (currentSongIndex > 0) {
			await playSong(currentSongIndex - 1);
		}
	}, [currentSongIndex, playSong]);

	const togglePlayPause = useCallback(() => {
		setIsPlaying((prev) => !prev);
	}, []);

	const handleSongEnd = useCallback(async () => {
		const { artistAddress }: any = songs[currentSongIndex] || {};
		if (artistAddress) {
			await endSongSession(artistAddress);
		}

		if (currentSongIndex < songs.length - 1) {
			await playNextSong();
		} else {
			setIsPlaying(false);
			setCurrentSongIndex(0);
		}
	}, [currentSongIndex, songs, playNextSong]);

	return (
		<MusicPlayerContext.Provider
			value={{
				songs,
				currentSongIndex,
				isPlaying,
				setSongs,
				playSong,
				playNextSong,
				playPreviousSong,
				togglePlayPause,
				handleSongEnd,
			}}
		>
			{children}
		</MusicPlayerContext.Provider>
	);
};

export const useMusicPlayer = () => {
	const context = useContext(MusicPlayerContext);
	if (context === undefined) {
		throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
	}
	return context;
};
