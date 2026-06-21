'use client';

import { ListFilter, UsersRound } from 'lucide-react';
import Image from 'next/image';
import { FiSearch } from 'react-icons/fi';

const dummyCollections = [
  {
    id: 1,
    image: '/AFRO.jpg',
    title: '#23 Echoes of the Soul',
    artist: 'Misty Brown',
    price: '0.005ETH',
  },
  {
    id: 2,
    image: '/tech.jpg',
    title: '#23 Echoes of the Soul',
    artist: 'Misty Brown',
    price: '0.005ETH',
  },
  {
    id: 3,
    image: '/audio.jpg',
    title: '#23 Echoes of the Soul',
    artist: 'Misty Brown',
    price: '0.005ETH',
  },
  {
    id: 4,
    image: '/cat.png',
    title: '#23 Echoes of the Soul',
    artist: 'Misty Brown',
    price: '0.005ETH',
  },
  {
    id: 5,
    image: '/image1.jpg',
    title: '#23 Echoes of the Soul',
    artist: 'Misty Brown',
    price: '0.005ETH',
  },
];

const CollectionsPage = () => {
  return (
    <div className="text-white min-h-screen">
      <div className="text-sm text-[#A3A3A3] mb-4">
        <span className="text-white">Profile</span> / Collections
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-[#1E1E1E] rounded-xl hover:border hover:border-[#3C3C3C] p-5 flex items-center">
          <div className="rounded-full p-3 mr-5 bg-[#3575ff27]">
            <UsersRound size={15} className="text-[#3575FF]" />
          </div>
          <div className="font-semibold">
            <p className="text-sm  text-[#A3A3A3]">Number Of Assets</p>
            <h2 className="text-xl text-white mt-2">50</h2>
          </div>
        </div>
        <div className="bg-[#1E1E1E] p-5 hover:border hover:border-[#3C3C3C] rounded-xl flex items-center">
          <div className="rounded-full p-3 mr-5 bg-[#35ff9725]">
            <UsersRound size={15} className="text-[#35FF97]" />
          </div>
          <div className="font-semibold">
            <p className="text-sm text-[#A3A3A3]">Assets Value</p>
            <h2 className="text-xl mt-2 text-white">$5,000.00</h2>
          </div>
        </div>
        <div className="bg-[#1E1E1E] p-5 hover:border hover:border-[#3C3C3C] rounded-xl flex items-center">
          <div className="rounded-full p-3 mr-5 bg-[#c6ff3531]">
            <UsersRound size={15} className="text-[#C6FF35]" />
          </div>
          <div className="font-semibold">
            <p className="text-sm text-[#A3A3A3]">Wallet Balance</p>
            <h2 className="text-xl mt-2 text-white">$50.00</h2>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl text-[#DACFD3] font-semibold">Collections</h2>
        <div className="flex gap-3 items-center w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3 top-3 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search collections"
              className="w-full pl-10 pr-4 py-2 rounded-full bg-[#1C1C1C] outline-none border border-[#2B2B2B] text-sm text-gray-200 placeholder:text-gray-500"
            />
          </div>
          <button className="flex items-center font-bold gap-1 px-4 py-2 rounded-full border border-[#2B2B2B] bg-[#1C1C1C] text-sm text-[#A3A3A3]">
            Filter
            <ListFilter  size={15} className='ml-2'/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {dummyCollections.map((item) => (
          <div key={item.id} className="hover:bg-[#161616] p-3 rounded-lg">
            <div className="w-full aspect-square rounded-md overflow-hidden mb-3">
              <Image
                src={item.image}
                alt={item.title}
                width={300}
                height={300}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="text-xs text-gray-400">{item.artist}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">{item.price}</span>
              <button className="px-3 py-1 text-xs bg-[#222] border border-[#2B2B2B] rounded-full hover:bg-[#333]">
                Sell Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CollectionsPage;
