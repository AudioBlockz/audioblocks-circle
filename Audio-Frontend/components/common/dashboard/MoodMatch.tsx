'use client';

import { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'sonner';
import { Play, Pause, Sparkles } from 'lucide-react';
import { usePlayerContext } from '@/context/PlayerContext';

interface MoodMatchSong {
  id: string;
  title: string;
  genre: string | null;
  mood: string[] | null;
  coverArtPath: string | null;
  artist: { id: string; name: string | null };
  reason: string;
}

const QUICK_MOODS = ['Happy and upbeat', 'Sad and reflective', 'Need energy', 'Want to chill', 'Feeling romantic'];

const MoodMatch = () => {
  const { currentTrack, isPlaying, playTrack, setIsPlaying } = usePlayerContext();
  const [moodText, setMoodText] = useState('');
  const [matches, setMatches] = useState<MoodMatchSong[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMatch = async (text?: string) => {
    const mood = (text ?? moodText).trim();
    if (!mood) {
      toast.error('Tell us how you feel first');
      return;
    }
    setLoading(true);
    try {
      const url = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.post(`${url}/api/song/mood-match`, { mood });
      const results: MoodMatchSong[] = res.data?.data ?? [];
      setMatches(results);
      if (results.length === 0) {
        toast.info("Couldn't find a match for that — try describing it differently.");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Mood match failed');
    } finally {
      setLoading(false);
    }
  };

  const toTrack = (song: MoodMatchSong) => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    return {
      id: song.id,
      title: song.title,
      artist: song.artist.name || 'Unknown Artist',
      cover: song.coverArtPath || '/AFRO.jpg',
      streamUrl: `${url}/api/song/stream/${song.id}`,
    };
  };

  const handlePlayClick = (song: MoodMatchSong) => {
    if (currentTrack?.id === song.id) {
      setIsPlaying(!isPlaying);
      return;
    }
    playTrack(toTrack(song), (matches ?? []).map(toTrack));
  };

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-[#885FA8]" />
        <p className="text-xs font-medium text-left text-white">Mood Match</p>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl p-5">
        <p className="text-white text-sm font-semibold mb-1">How are you feeling right now?</p>
        <p className="text-[#A3A3A3] text-xs mb-4">
          Describe your mood and we'll find songs that fit it.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            value={moodText}
            onChange={(e) => setMoodText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleMatch()}
            placeholder="e.g. tired but hopeful, ready to dance, missing someone…"
            className="flex-1 bg-[#242424] text-white rounded-lg px-4 py-2 text-sm placeholder:text-[#4B4B4B] focus:outline-none"
          />
          <button
            onClick={() => handleMatch()}
            disabled={loading}
            className="bg-[#D2045B] hover:bg-pink-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap"
          >
            {loading ? 'Finding…' : 'Find my vibe'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_MOODS.map((m) => (
            <button
              key={m}
              onClick={() => {
                setMoodText(m);
                handleMatch(m);
              }}
              disabled={loading}
              className="text-xs bg-[#242424] hover:bg-[#2E2E2E] text-[#A3A3A3] px-3 py-1.5 rounded-full cursor-pointer disabled:opacity-50"
            >
              {m}
            </button>
          ))}
        </div>

        {matches && matches.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {matches.map((song) => {
              const isCurrentlyPlaying = currentTrack?.id === song.id && isPlaying;
              return (
                <div key={song.id} className="group relative bg-[#111] rounded-lg p-3 text-left">
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
                          <Pause className="text-white" size={24} />
                        ) : (
                          <Play className="text-white" size={24} />
                        )}
                      </div>
                    </div>
                    <p className="text-white text-sm font-medium truncate">{song.title}</p>
                    <p className="text-[#A3A3A3] text-xs truncate">{song.artist.name || 'Unknown Artist'}</p>
                  </button>
                  <p className="text-[#666C6C] text-[11px] mt-1 line-clamp-2">{song.reason}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default MoodMatch;
