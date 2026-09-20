"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  // A GET /api/song/stream/:id URL — our backend always returns an HLS
  // (.m3u8) manifest from that endpoint.
  streamUrl: string;
  // Snapshot taken when the track was queued (e.g. from GET /api/song) —
  // absent for the placeholder demo playlist, which has no backing song.
  likeCount?: number;
  liked?: boolean;
}

interface PlayerContextValue {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  // `queue` is optional so a lone song (e.g. shared link, single result)
  // still works — it just becomes a one-track queue with nothing to
  // auto-advance to.
  playTrack: (track: Track, queue?: Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  setIsPlaying: (playing: boolean) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

// Mounted once at the root (see context/provider.tsx) so any page can select
// a song (e.g. a song-list item) and have it play in the single persistent
// <Player /> mounted in the dashboard layout, without those two components
// needing a direct relationship.
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = (track: Track, trackQueue?: Track[]) => {
    setCurrentTrack(track);
    setQueue(trackQueue && trackQueue.length > 0 ? trackQueue : [track]);
    setIsPlaying(true);
  };

  // Both walk the queue the currently playing track was started from — the
  // list the listener was actually browsing (a song list, an artist's
  // catalogue, a mood-match result), not some separately maintained
  // "up next" queue.
  const playNext = () => {
    if (!currentTrack) return;
    const index = queue.findIndex((t) => t.id === currentTrack.id);
    if (index === -1 || index >= queue.length - 1) {
      setIsPlaying(false); // end of queue — stop rather than loop silently
      return;
    }
    setCurrentTrack(queue[index + 1]);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (!currentTrack) return;
    const index = queue.findIndex((t) => t.id === currentTrack.id);
    if (index <= 0) return;
    setCurrentTrack(queue[index - 1]);
    setIsPlaying(true);
  };

  return (
    <PlayerContext.Provider
      value={{ currentTrack, isPlaying, queue, playTrack, playNext, playPrevious, setIsPlaying }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayerContext() must be used within <PlayerProvider>");
  }
  return ctx;
}
