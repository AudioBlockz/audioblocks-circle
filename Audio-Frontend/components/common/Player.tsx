'use client';

import { useEffect, useRef, useState } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import Image from 'next/image';
import {
  Dot,
  Ellipsis,
  Heart,
  ListPlus,
  MessageSquare,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import CommentPanel from './dashboard/Comment';

const playlist = [
  {
    title: 'Relax and Unwind',
    artist: 'Rozé',
    cover: '/AFRO.jpg',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    title: 'Vibe Mix',
    artist: 'Yemi Sax',
    cover: '/AFRO.jpg',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    title: 'Cool Session',
    artist: 'Dunsin',
    cover: '/AFRO.jpg',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
];

export default function Player() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const currentTrack = playlist[currentIndex];
  const trackId = `track-${currentIndex}`;

  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current && isPlaying) {
        setProgress(audioRef.current.currentTime);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeToggle = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    if (audioRef.current) {
      audioRef.current.muted = newMuteState;
    }
  };

  const handleNext = () => {
    let nextIndex = currentIndex + 1;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else if (nextIndex >= playlist.length) {
      nextIndex = 0;
    }
    setCurrentIndex(nextIndex);
    setProgress(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (audioRef.current?.currentTime && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const toggleRepeat = () => setRepeat((prev) => !prev);
  const toggleShuffle = () => setShuffle((prev) => !prev);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#272727] px-8 py-3 shadow-lg z-50">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Left Controls */}
        <div className="flex items-center gap-3">
          <button onClick={toggleShuffle} className={`hover:text-gray-300 cursor-pointer text-white ${shuffle ? 'text-pink-500' : ''}`}>
            <Shuffle size={16} />
          </button>
          <button onClick={handlePrev} className="hover:text-gray-300 cursor-pointer text-white">
            <SkipBack size={16} />
          </button>
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-white flex items-center cursor-pointer justify-center"
          >
            {isPlaying ? (
              <FaPause size={14} className="text-gray-800" />
            ) : (
              <FaPlay size={14} className="text-gray-800" />
            )}
          </button>
          <button onClick={handleNext} className="hover:text-gray-300 text-white">
            <SkipForward size={15} />
          </button>
          <button onClick={toggleRepeat} className={`hover:text-gray-300 text-white ${repeat ? 'text-pink-500' : ''}`}>
            <Repeat size={16} />
          </button>
        </div>

        {/* Track Info */}
        <div className="h-12 w-12 relative">
          <Image src={currentTrack.cover} alt={currentTrack.title} fill className="rounded-md object-cover" />
        </div>
        <div className="flex items-center gap-4 w-2/5">
          <div className="flex-1">
            <div className="flex items-center justify-center mb-3">
              <div className="text-white font-medium mr-4 text-sm truncate">{currentTrack.title}</div>
              <div className="text-gray-400 flex items-center text-xs truncate">
                <Dot size={20} className="mr-4 text-white" /> {currentTrack.artist}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white w-8">{formatTime(progress)}</span>
              <input
                type="range"
                min={0}
                max={duration}
                step={1}
                value={progress}
                onChange={(e) => {
                  const newTime = Number(e.target.value);
                  if (audioRef.current) {
                    audioRef.current.currentTime = newTime;
                    setProgress(newTime);
                  }
                }}
                className="w-full h-1 bg-gray-600 rounded appearance-none cursor-pointer accent-[#D2045B]"
                style={{
                  background: `linear-gradient(to right, #B6195B 0%, #B6195B ${
                    (progress / duration) * 100
                  }%, rgb(82, 82, 82) ${(progress / duration) * 100}%, rgb(82, 82, 82) 100%)`,
                }}
              />
              <span className="text-xs text-white w-8 text-right">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center border-l-2 pl-4 gap-4 relative">
          <button
            className="hover:text-gray-300 cursor-pointer text-white "
            onClick={() => setShowComments(true)}
          >
            <MessageSquare size={16} />
          </button>
          <button className="hover:text-gray-300 cursor-pointer text-white">
            <ListPlus size={16} />
          </button>
          <button className="hover:text-gray-300 font-bold cursor-pointer text-white">
            <Heart size={16} />
          </button>
          <button className="hover:text-gray-300 cursor-pointer text-white">
            <Ellipsis size={16} />
          </button>
          <div className="relative group flex items-center justify-center">
            <button className="hover:text-gray-300 text-white" onClick={handleVolumeToggle}>
              {isMuted || volume === 0 ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
            </button>
            <div className="absolute bottom-16 p-4 rounded-md bg-[#161616] rotate-[-90deg] items-center justify-center hidden group-hover:flex">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (audioRef.current) {
                    audioRef.current.muted = false;
                  }
                  setIsMuted(false);
                }}
                className="w-24 h-1 bg-gray-300 rounded appearance-none cursor-pointer accent-[#D2045B]"
              />
            </div>
          </div>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={currentTrack.url}
          autoPlay
          onEnded={() => {
            if (repeat) {
              audioRef.current?.play();
            } else {
              handleNext();
            }
          }}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
      </div>

      {showComments && <CommentPanel onClose={() => setShowComments(false)} trackId={trackId} />}
    </div>
  );
}
