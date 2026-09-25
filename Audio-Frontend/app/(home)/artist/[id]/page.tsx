'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { Play, Pause, Instagram, Heart } from 'lucide-react';
import { usePlayerContext } from '@/context/PlayerContext';

interface ArtistProfile {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  profileImage: string | null;
  pageCover: string | null;
  instagram: string | null;
  walletAddress: string;
}

interface ApiSong {
  id: string;
  title: string;
  genre: string;
  coverArtPath: string;
  plays?: number;
  likeCount?: number;
  isLiked?: boolean;
  artist: { id?: string; name: string | null; walletAddress?: string };
}

export default function ArtistPage() {
  const params = useParams<{ id: string }>();
  const artistId = params?.id;
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [songs, setSongs] = useState<ApiSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { currentTrack, isPlaying, playTrack, setIsPlaying } = usePlayerContext();

  useEffect(() => {
    if (!artistId) return;
    const url = process.env.NEXT_PUBLIC_API_URL;

    Promise.all([
      axios.get(`${url}/api/artist/${artistId}`),
      axios.get(`${url}/api/song`, { params: { artistId } }),
    ])
      .then(([artistRes, songsRes]) => {
        setArtist(artistRes.data?.data ?? null);
        setSongs(songsRes.data?.data ?? []);
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [artistId]);

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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="h-48 rounded-lg bg-[#1A1A1A] animate-pulse mb-8" />
        <div className="h-24 rounded-lg bg-[#1A1A1A] animate-pulse" />
      </div>
    );
  }

  if (notFound || !artist) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <p className="text-white text-lg font-medium">Artist not found</p>
        <p className="text-[#A3A3A3] text-sm mt-2">
          This profile doesn&apos;t exist or is no longer available.
        </p>
      </div>
    );
  }

  const displayName = artist.username || artist.name || 'Unnamed Artist';
  const totalStreams = songs.reduce((sum, s) => sum + (s.plays || 0), 0);

  return (
    <div className="pb-28">
      <div className="relative w-full h-56 md:h-72 bg-[#1A1A1A]">
        {artist.pageCover && (
          <Image src={artist.pageCover} alt="" fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end gap-5 -mt-16 relative">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-black bg-[#242424] shrink-0">
            {artist.profileImage ? (
              <Image src={artist.profileImage} alt={displayName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-white/40">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="pb-2">
            <h1 className="text-white text-2xl md:text-3xl font-semibold">{displayName}</h1>
            <p className="text-[#A3A3A3] text-sm">
              {totalStreams.toLocaleString()} {totalStreams === 1 ? 'stream' : 'streams'}
            </p>
          </div>
        </div>

        {artist.bio && (
          <p className="text-[#D4D4D4] text-sm mt-6 max-w-2xl whitespace-pre-line">{artist.bio}</p>
        )}

        {artist.instagram && (
          <a
            href={`https://instagram.com/${artist.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white mt-3"
          >
            <Instagram size={14} />
            @{artist.instagram}
          </a>
        )}

        <div className="mt-10">
          <p className="text-xs font-medium text-left text-white mb-3">Catalogue</p>
          {songs.length === 0 ? (
            <p className="text-[#A3A3A3] text-sm">No songs published yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {songs.map((song) => {
                const isCurrentlyPlaying = currentTrack?.id === song.id && isPlaying;
                return (
                  <button
                    key={song.id}
                    onClick={() => handlePlayClick(song)}
                    className="group relative bg-[#1A1A1A] rounded-lg p-3 text-left hover:bg-[#242424] transition cursor-pointer"
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[#A3A3A3] text-xs truncate">{song.genre || ''}</p>
                      <span className="flex items-center gap-1 text-[#A3A3A3] text-xs shrink-0">
                        <Heart
                          size={12}
                          className={song.isLiked ? 'fill-[#D2045B] text-[#D2045B]' : ''}
                        />
                        {song.likeCount ?? 0}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
