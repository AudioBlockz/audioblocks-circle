import React from 'react';

const Playlist = () => {
  return (
    <div className="font-inter ">
      <p className="text-xs font-medium text-left text-white mb-2">My Playlist</p>

      <div className="bg-gradient-to-r from-[#6E0596] to-[#580577] p-8 py-12 rounded-lg text-white flex items-center justify-between">
        <div className="flex-1 gap-2">
          <h1 className="md:text-6xl text-3xl mb-2 font-extrabold">My Playlist</h1>
          <p className='font-semibold text-base'>1000 Songs Added</p>
        </div>
      </div>
    </div>
  );
};

export default Playlist;
