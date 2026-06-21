// "use client";
// import React, { useEffect, useState } from "react";
// import Image from "next/image";
// import { Check } from "lucide-react";
// import image from "/public/images/Ellipse.png";
// import { Album, Play } from "lucide-react";
// import Rectangle1 from "/public/images/Rectangle1.png";
// import { PlayingIndicator } from "@/components/PlayingIndicator";
// import { useMusicPlayer } from "@/context/MusicPlayer";

// const AlbumArt2 = () => {
// 	const { playSong, setSongs } = useMusicPlayer();

// 	useEffect(() => {
// 		setSongs(songs);
// 	}, []);
// 	const songs = [
// 		{
// 			id: "1",
// 			title: "Song 1",
// 			artist: "Artist 1",
// 			src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
// 			coverImage: Rectangle1,
// 			streams: 1000000,
// 			listeners: 500000,
// 			saves: 250000,
// 			released: "2024-01-01",
// 		},
// 		{
// 			id: "2",
// 			title: "Song 2",
// 			artist: "Artist ",
// 			src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
// 			coverImage: Rectangle1,
// 			streams: 1000000,
// 			listeners: 500000,
// 			saves: 250000,
// 			released: "2024-01-01",
// 		},
// 		{
// 			id: "3",
// 			title: "Song 3",
// 			artist: "Artist ",
// 			src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
// 			coverImage: Rectangle1,
// 			streams: 1000000,
// 			listeners: 500000,
// 			saves: 250000,
// 			released: "2024-01-01",
// 		},
// 		{
// 			id: "4",
// 			title: "Song 4",
// 			artist: "Artist ",
// 			src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
// 			coverImage: Rectangle1,
// 			streams: 1000000,
// 			listeners: 500000,
// 			saves: 250000,
// 			released: "2024-01-01",
// 		},
// 		{
// 			id: "5",
// 			title: "Song 5",
// 			artist: "Artist ",
// 			src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
// 			coverImage: Rectangle1,
// 			streams: 1000000,
// 			listeners: 500000,
// 			saves: 250000,
// 			released: "2024-01-01",
// 		},
// 	];

// 	const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
// 	const [isPlaying, setIsPlaying] = useState<boolean>(false);
// 	const [hoveredRow, setHoveredRow] = useState<number | null>(null);

// 	const handlePlaySong = (index: number) => {
// 		if (index === currentSongIndex && isPlaying) {
// 			setIsPlaying(false);
// 			playSong(index);
// 		} else {
// 			setCurrentSongIndex(index);
// 			setIsPlaying(true);
// 			playSong(index);
// 		}
// 	};


// 	const renderSongNumber = (index: number) => {
// 		if (hoveredRow === index) {
// 			return <Play size={15} className="text-white" />;
// 		}
// 		if (currentSongIndex === index && isPlaying) {
// 			return <PlayingIndicator />;
// 		}
// 		return index + 1;
// 	};
// 	return (
// 		<>
// 			<div className="w-11/12 m-auto text-white">
// 				<div className="relative bg-gradient-to-r items-center flex justify-between from-[#4B0B3E] to-[#274749] text-white p-8 rounded-lg mb-8">
// 					<div className="w-[288px]">
// 						<div className="flex items-center">
// 							<span className="h-4 w-4 rounded-full flex items-center justify-center bg-yellow-700 text-xs mr-2">
// 								<Check className="h-2 w-2" />
// 							</span>
// 							<span>Tip Artist</span>
// 						</div>
// 						<h1 className="text-5xl font-bold text-white mb-2">Artist Name</h1>
// 						<p className="text-base mb-4 text-[#91A2A4]">Artist Name</p>
// 					</div>

// 					<div className="absolute right-4 bottom-0 h-44 w-44 rounded-full border border-white overflow-hidden">
// 						<Image
// 							src={image}
// 							alt="Music"
// 							className="w-full h-full object-cover"
// 						/>
// 					</div>
// 				</div>

// 				<div className="mt-4 overflow-x-auto mb-40">
// 					<table className="min-w-full text-[#666C6C] border-separate border-spacing-y-2">
// 						<thead>
// 							<tr className="text-sm font-medium">
// 								<th className="p-3 text-left">#</th>
// 								<th className="p-3 text-left">Songs</th>
// 								<th className="p-3 text-center">Streams</th>
// 								<th className="p-3 text-center">Listeners</th>
// 								<th className="p-3 text-center">Saves</th>
// 								<th className="p-3 text-center">Released</th>
// 							</tr>
// 						</thead>
// 						<tbody>
// 							{songs.map((song, index) => (
// 								<tr
// 									key={song.id}
// 									className={`hover:bg-[#0E0B0E] cursor-pointer transition-colors ${
// 										currentSongIndex === index
// 											? "bg-[#0E0B0E] bg-opacity-50"
// 											: ""
// 									}`}
// 									onMouseEnter={() => setHoveredRow(index)}
// 									onMouseLeave={() => setHoveredRow(null)}
// 									onClick={() => handlePlaySong(index)}
// 								>
// 									<td className="p-3 w-10">
// 										<div className="flex items-center justify-center w-6">
// 											{renderSongNumber(index)}
// 										</div>
// 									</td>
// 									<td className="p-3 flex items-center">
// 										<div className="relative">
// 											<Image
// 												src={song.coverImage}
// 												alt={`${song.title} Cover`}
// 												width={48}
// 												height={48}
// 												className={`rounded-md mr-4 ${
// 													currentSongIndex === index && isPlaying
// 														? "animate-pulse"
// 														: ""
// 												}`}
// 											/>
// 										</div>
// 										<div>
// 											<p
// 												className={`font-medium text-sm ${
// 													currentSongIndex === index ? "text-red-500" : ""
// 												}`}
// 											>
// 												{song.title}
// 											</p>
// 											<p className="text-sm text-gray-400">{song.artist}</p>
// 										</div>
// 									</td>
// 									<td className="p-3 text-sm font-medium text-center">
// 										{song.streams.toLocaleString()}
// 									</td>
// 									<td className="p-3 text-sm font-medium text-center">
// 										{song.listeners.toLocaleString()}
// 									</td>
// 									<td className="p-3 text-sm font-medium text-center">
// 										{song.saves.toLocaleString()}
// 									</td>
// 									<td className="p-3 text-sm font-medium text-center">
// 										{song.released}
// 									</td>
// 								</tr>
// 							))}
// 						</tbody>
// 					</table>
// 				</div>
// 			</div>
// 		</>
// 	);
// };

// export default AlbumArt2;

"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import image from "/public/images/Ellipse.png";
import { Album, Play } from "lucide-react";
import Rectangle1 from "/public/images/Rectangle1.png";
import { PlayingIndicator } from "@/components/PlayingIndicator";
import { useMusicPlayer } from "@/context/MusicPlayer";

const AlbumArt2 = () => {
  const { playSong, setSongs } = useMusicPlayer();

  useEffect(() => {
    // setSongs(songs);
  }, []);

  const songs = [
    {
      id: "1",
      title: "Song 1",
      artist: "Artist 1",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
      coverImage: Rectangle1,
      streams: 1000000,
      listeners: 500000,
      saves: 250000,
      released: "2024-01-01",
    },
    // Add additional song data here...
  ];

  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Counter state
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCounter = () => {
    const startTime = Date.now() - elapsedTime;
    intervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);
  };

  const stopCounter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handlePlaySong = (index: number) => {
    if (index === currentSongIndex && isPlaying) {
      setIsPlaying(false);
      stopCounter();
    } else {
      if (intervalRef.current) stopCounter(); // Stop counter for the previous song
      setCurrentSongIndex(index);
      setIsPlaying(true);
      setElapsedTime(0); // Reset counter for the new song
      startCounter();
    }
    playSong(index);
  };

  const renderSongNumber = (index: number) => {
    if (hoveredRow === index) {
      return <Play size={15} className="text-white" />;
    }
    if (currentSongIndex === index && isPlaying) {
      return <PlayingIndicator />;
    }
    return index + 1;
  };

  useEffect(() => {
    return () => stopCounter(); // Cleanup on component unmount
  }, []);

  return (
    <div className="w-11/12 m-auto text-white">
      <div className="relative bg-gradient-to-r items-center flex justify-between from-[#4B0B3E] to-[#274749] text-white p-8 rounded-lg mb-8">
        <div className="w-[288px]">
          <div className="flex items-center">
            <span className="h-4 w-4 rounded-full flex items-center justify-center bg-yellow-700 text-xs mr-2">
              <Check className="h-2 w-2" />
            </span>
            <span>Tip Artist</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">Artist Name</h1>
          <p className="text-base mb-4 text-[#91A2A4]">Artist Name</p>
        </div>

        <div className="absolute right-4 bottom-0 h-44 w-44 rounded-full border border-white overflow-hidden">
          <Image
            src={image}
            alt="Music"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto mb-40">
        <table className="min-w-full text-[#666C6C] border-separate border-spacing-y-2">
          <thead>
            <tr className="text-sm font-medium">
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Songs</th>
              <th className="p-3 text-center">Streams</th>
              <th className="p-3 text-center">Listeners</th>
              <th className="p-3 text-center">Saves</th>
              <th className="p-3 text-center">Released</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song, index) => (
              <tr
                key={song.id}
                className={`hover:bg-[#0E0B0E] cursor-pointer transition-colors ${
                  currentSongIndex === index ? "bg-[#0E0B0E] bg-opacity-50" : ""
                }`}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => handlePlaySong(index)}
              >
                <td className="p-3 w-10">
                  <div className="flex items-center justify-center w-6">
                    {renderSongNumber(index)}
                  </div>
                </td>
                <td className="p-3 flex items-center">
                  <div className="relative">
                    <Image
                      src={song.coverImage}
                      alt={`${song.title} Cover`}
                      width={48}
                      height={48}
                      className={`rounded-md mr-4 ${
                        currentSongIndex === index && isPlaying
                          ? "animate-pulse"
                          : ""
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`font-medium text-sm ${
                        currentSongIndex === index ? "text-red-500" : ""
                      }`}
                    >
                      {song.title}
                    </p>
                    <p className="text-sm text-gray-400">{song.artist}</p>
                  </div>
                </td>
                <td className="p-3 text-sm font-medium text-center">
                  {song.streams.toLocaleString()}
                </td>
                <td className="p-3 text-sm font-medium text-center">
                  {song.listeners.toLocaleString()}
                </td>
                <td className="p-3 text-sm font-medium text-center">
                  {song.saves.toLocaleString()}
                </td>
                <td className="p-3 text-sm font-medium text-center">
                  {song.released}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isPlaying && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-md text-white">
          Elapsed Time: {(elapsedTime / 1000).toFixed(2)} seconds
        </div>
      )}
    </div>
  );
};

export default AlbumArt2;

