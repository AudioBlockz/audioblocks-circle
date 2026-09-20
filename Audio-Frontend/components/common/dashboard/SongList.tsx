'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, Heart } from 'lucide-react';
import axios from 'axios';
import { usePlayerContext } from '@/context/PlayerContext';

interface ApiSong {
  id: string;
  title: string;
  genre: string;
  coverArtPath: string;
  likeCount?: number;
  isLiked?: boolean;
  artist: { id?: string; name: string | null; walletAddress?: string };
}

const SongList = () => {
  const [songs, setSongs] = useState<ApiSong[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, playTrack, setIsPlaying } = usePlayerContext();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    axios
      .get(`${url}/api/song`)
      .then((res) => setSongs(res.data?.data ?? []))
      .catch(() => setSongs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-24 animate-pulse rounded-lg bg-[#1A1A1A] mb-8" />;
  }

  if (songs.length === 0) {
    return null;
  }

  const toTrack = (song: ApiSong) => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    return {
      id: song.id,
      title: song.title,
      artist: song.artist.name || 'Unknown Artist',
      cover: song.coverArtPath || '/AFRO.jpg',
      streamUrl: `${url}/api/song/stream/${song.id}`,
      likeCount: song.likeCount ?? 0,
      liked: song.isLiked ?? false,
    };
  };

  const handlePlayClick = (song: ApiSong) => {
    if (currentTrack?.id === song.id) {
      setIsPlaying(!isPlaying);
      return;
    }
    playTrack(toTrack(song), songs.map(toTrack));
  };

  return (
    <div className="mb-8">
      <p className="text-xs font-medium text-left text-white mb-2">Tracks</p>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {songs.map((song) => {
          const isCurrentlyPlaying = currentTrack?.id === song.id && isPlaying;
          return (
            <div
              key={song.id}
              className="group relative bg-[#1A1A1A] rounded-lg p-3 text-left hover:bg-[#242424] transition"
            >
              <button
                onClick={() => handlePlayClick(song)}
                className="block w-full text-left cursor-pointer"
              >
                <div className="relative w-full aspect-square mb-3 rounded-md overflow-hidden">
                  <Image
                    src={song.coverArtPath || '/AFRO.jpg'}
                    alt={song.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    {isCurrentlyPlaying ? (
                      <Pause className="text-white" size={28} />
                    ) : (
                      <Play className="text-white" size={28} />
                    )}
                  </div>
                </div>
                <p className="text-white text-sm font-medium truncate">{song.title}</p>
              </button>
              <div className="flex items-center justify-between gap-2">
                {song.artist.id ? (
                  <Link
                    href={`/artist/${song.artist.id}`}
                    className="text-[#A3A3A3] text-xs truncate hover:text-white hover:underline block"
                  >
                    {song.artist.name || 'Unknown Artist'}
                  </Link>
                ) : (
                  <p className="text-[#A3A3A3] text-xs truncate">{song.artist.name || 'Unknown Artist'}</p>
                )}
                <span className="flex items-center gap-1 text-[#A3A3A3] text-xs shrink-0">
                  <Heart
                    size={12}
                    className={song.isLiked ? 'fill-[#D2045B] text-[#D2045B]' : ''}
                  />
                  {song.likeCount ?? 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SongList;
