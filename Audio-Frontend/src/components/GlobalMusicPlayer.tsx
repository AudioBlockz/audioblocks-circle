import React from 'react';
import MusicPlayer from './MusicPlayer';
import { useMusicPlayer } from '../context/MusicPlayer';

const GlobalMusicPlayer: React.FC = () => {
  const {
    songs,
    currentSongIndex,
    isPlaying,
    playNextSong,
    playPreviousSong,
    togglePlayPause,
    handleSongEnd,
  } = useMusicPlayer();

  if (songs.length === 0) return localStorage.getItem('songs');


  return (
    <MusicPlayer
      songs={songs}
      currentSongIndex={currentSongIndex}
      isPlaying={isPlaying}
      onPlayPause={togglePlayPause}
      onNextSong={playNextSong}
      onPreviousSong={playPreviousSong}
      onSongEnd={handleSongEnd}
    />
  );
};

export default GlobalMusicPlayer;