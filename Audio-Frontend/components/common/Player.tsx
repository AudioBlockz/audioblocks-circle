'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import axios from 'axios';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import Image from 'next/image';
import Hls from 'hls.js';
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
import { usePlayerContext } from '@/context/PlayerContext';

// Shown until a real song is picked from a song list, so the player isn't
// empty. Plain mp3s — no HLS/hls.js involved for these.
const placeholderPlaylist = [
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
  const { currentTrack, isPlaying, queue, playNext, playPrevious, setIsPlaying } = usePlayerContext();
  const pathname = usePathname();
  const { authenticated, getAccessToken } = usePrivy();
  // The full control bar (progress, comments, like, etc.) is a dashboard
  // fixture. Everywhere else, a minimal hover-reveal dock takes over
  // instead of the same heavy bar following you around the whole site.
  const isDashboard = pathname?.startsWith('/dashboard') ?? false;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [dockHovered, setDockHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);

  // A real, explicitly-selected track takes over the player entirely; the
  // demo placeholist has no relation to it (no shared "queue"), so next/prev/
  // shuffle only make sense while nothing real has been picked yet.
  const isRealTrack = currentTrack !== null;
  const track = currentTrack ?? {
    id: `placeholder-${placeholderIndex}`,
    title: placeholderPlaylist[placeholderIndex].title,
    artist: placeholderPlaylist[placeholderIndex].artist,
    cover: placeholderPlaylist[placeholderIndex].cover,
    streamUrl: placeholderPlaylist[placeholderIndex].url,
  };
  const currentQueueIndex = isRealTrack ? queue.findIndex((t) => t.id === track.id) : -1;
  const hasNextInQueue = isRealTrack && currentQueueIndex !== -1 && currentQueueIndex < queue.length - 1;

  // Local like state mirrors whatever the track was queued with (see
  // toTrack() in SongList/artist page, which reads it off GET /api/song).
  // Re-synced whenever the track itself changes rather than kept forever,
  // so switching tracks doesn't drag along the previous song's like state.
  useEffect(() => {
    setLiked(currentTrack?.liked ?? false);
    setLikeCount(currentTrack?.likeCount ?? 0);
    // Deliberately keyed on id alone — re-running this on every likeCount/
    // liked change would stomp the optimistic update in handleToggleLike.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  const handleToggleLike = async () => {
    if (!isRealTrack || likeBusy) return;
    if (!authenticated) {
      toast.error('Log in to like songs');
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;
    setLiked(!previousLiked);
    setLikeCount(previousCount + (previousLiked ? -1 : 1));
    setLikeBusy(true);

    try {
      const url = process.env.NEXT_PUBLIC_API_URL;
      const accessToken = await getAccessToken();
      const res = await axios.post(
        `${url}/api/song/${track.id}/like`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setLiked(res.data?.data?.liked ?? !previousLiked);
      setLikeCount(res.data?.data?.likeCount ?? previousCount);
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error('Could not update like — try again');
    } finally {
      setLikeBusy(false);
    }
  };

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

  // Loads whatever `track.streamUrl` currently is. Real tracks are HLS
  // manifests served by our backend (GET /api/song/stream/:id) — Safari can
  // play those natively, everyone else needs hls.js. Placeholder tracks are
  // plain mp3 files that just go straight into `src`.
  //
  // The manifest request carries an Authorization header whenever we're
  // logged in, even though most tracks don't need one: a Room's unreleased
  // track (see AudioBlock_Backend's Song.unreleased) gates that same
  // endpoint on a paid RoomTicket, and hls.js has no way to attach that
  // header after the fact — only via xhrSetup on the manifest fetch itself.
  // Safari's native HLS path can't attach custom headers at all, so an
  // unreleased track won't play there; that's a known gap, not a bug.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;
    setProgress(0);

    let cancelled = false;

    const setup = async () => {
      if (isRealTrack) {
        // hls.js first: Chrome/Firefox/Edge all report canPlayType('...mpegurl')
        // as "maybe" — a generic, non-committal guess, not a real promise
        // they can parse .m3u8 — so checking that first would wrongly skip
        // hls.js everywhere except genuine Safari, where Hls.isSupported()
        // is false because Safari lacks the MediaSource Extensions API
        // hls.js needs (and has real native HLS instead, used as fallback).
        if (Hls.isSupported()) {
          const accessToken = authenticated ? await getAccessToken().catch(() => null) : null;
          if (cancelled) return;

          const hls = new Hls({
            xhrSetup: (xhr) => {
              if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
            },
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            console.error('[hls.js] ERROR', data.type, data.details, data.fatal, data);
          });
          hls.loadSource(track.streamUrl);
          hls.attachMedia(audio);
          hlsRef.current = hls;
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
          audio.src = track.streamUrl;
        }
      } else {
        audio.src = track.streamUrl;
      }

      if (isPlaying) {
        audio.play().catch(() => {});
      }
    };
    setup();

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.streamUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleVolumeToggle = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    if (audioRef.current) {
      audioRef.current.muted = newMuteState;
    }
  };

  const handleNext = () => {
    if (isRealTrack) {
      playNext();
      return;
    }
    let nextIndex = placeholderIndex + 1;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * placeholderPlaylist.length);
    } else if (nextIndex >= placeholderPlaylist.length) {
      nextIndex = 0;
    }
    setPlaceholderIndex(nextIndex);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (audioRef.current?.currentTime && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    if (isRealTrack) {
      playPrevious();
      return;
    }
    const prevIndex = placeholderIndex === 0 ? placeholderPlaylist.length - 1 : placeholderIndex - 1;
    setPlaceholderIndex(prevIndex);
    setIsPlaying(true);
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
    <>
      {/* Full control bar — dashboard only. Elsewhere, the audio keeps
          playing (see the always-mounted <audio> below) but this heavy bar
          doesn't follow you around the rest of the site. */}
      {isDashboard && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#272727] px-8 py-3 shadow-lg z-50">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
            {/* Left Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleShuffle}
                disabled={isRealTrack}
                className={`hover:text-gray-300 cursor-pointer text-white disabled:opacity-30 disabled:cursor-not-allowed ${shuffle ? 'text-pink-500' : ''}`}
              >
                <Shuffle size={16} />
              </button>
              <button
                onClick={handlePrev}
                className="hover:text-gray-300 cursor-pointer text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
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
              <button
                onClick={handleNext}
                disabled={isRealTrack && !hasNextInQueue}
                className="hover:text-gray-300 text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <SkipForward size={15} />
              </button>
              <button onClick={toggleRepeat} className={`hover:text-gray-300 text-white ${repeat ? 'text-pink-500' : ''}`}>
                <Repeat size={16} />
              </button>
            </div>

            {/* Track Info */}
            <div className="h-12 w-12 relative">
              <Image src={track.cover} alt={track.title} fill className="rounded-md object-cover" />
            </div>
            <div className="flex items-center gap-4 w-2/5">
              <div className="flex-1">
                <div className="flex items-center justify-center mb-3">
                  <div className="text-white font-medium mr-4 text-sm truncate">{track.title}</div>
                  <div className="text-gray-400 flex items-center text-xs truncate">
                    <Dot size={20} className="mr-4 text-white" /> {track.artist}
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
                className="hover:text-gray-300 cursor-pointer text-white disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={() => setShowComments(true)}
                disabled={!isRealTrack}
              >
                <MessageSquare size={16} />
              </button>
              <button className="hover:text-gray-300 cursor-pointer text-white">
                <ListPlus size={16} />
              </button>
              <button
                className="hover:text-gray-300 font-bold cursor-pointer text-white flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={handleToggleLike}
                disabled={!isRealTrack}
              >
                <Heart size={16} className={liked ? 'fill-[#D2045B] text-[#D2045B]' : ''} />
                {isRealTrack && likeCount > 0 && (
                  <span className="text-xs text-white">{likeCount}</span>
                )}
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
          </div>

          {showComments && isRealTrack && (
            <CommentPanel onClose={() => setShowComments(false)} songId={track.id} />
          )}
        </div>
      )}

      {/* Minimal hover-reveal dock — every other page, and only while a
          real track is actually playing. Sits flush with the bottom of the
          viewport (over the footer, on pages that have one): hovering
          anywhere in that bottom strip slides it up; moving away slides it
          back down. Deliberately pared down to transport + volume only. */}
      {!isDashboard && isRealTrack && isPlaying && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 h-24 flex items-end justify-center"
          onMouseEnter={() => setDockHovered(true)}
          onMouseLeave={() => setDockHovered(false)}
        >
          <div
            className={`mb-3 flex items-center gap-5 rounded-full px-6 py-3 bg-gradient-to-r from-[#D2045B] to-[#885FA8] shadow-[0_0_30px_rgba(210,4,91,0.55)] backdrop-blur-md transition-transform duration-300 ease-out ${
              dockHovered ? 'translate-y-0' : 'translate-y-[150%]'
            }`}
          >
            <button
              onClick={handlePrev}
              className="text-white/90 hover:text-white cursor-pointer transition"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-white flex items-center justify-center cursor-pointer"
            >
              {isPlaying ? (
                <FaPause size={12} className="text-[#D2045B]" />
              ) : (
                <FaPlay size={12} className="text-[#D2045B]" />
              )}
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNextInQueue}
              className="text-white/90 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
            >
              <SkipForward size={16} />
            </button>
            <div className="w-px h-5 bg-white/30" />
            <div className="relative group flex items-center justify-center">
              <button onClick={handleVolumeToggle} className="text-white/90 hover:text-white cursor-pointer transition">
                {isMuted || volume === 0 ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
              </button>
              <div className="absolute bottom-10 p-3 rounded-md bg-[#1a1a1a] rotate-[-90deg] items-center justify-center hidden group-hover:flex">
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
                  className="w-20 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Always mounted, on every route, regardless of which UI (or
          neither) is currently shown above — this is what lets playback
          survive navigating away from the dashboard at all. */}
      <audio
        ref={audioRef}
        onEnded={() => {
          if (repeat) {
            audioRef.current?.play();
          } else {
            handleNext();
          }
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
    </>
  );
}
