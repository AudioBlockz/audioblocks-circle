"use client"
import {useState} from 'react'
import Image from 'next/image';
import {X} from 'lucide-react';
import image from "/public/images/Group1.png"
import Artist from '@/components/Artist';
import Trending from '@/components/Trending';



 const Stream = () => {
  const [close, setClose ]= useState(true);

  const Close =()=>{
    setClose(false);
  }
  return (
    <>
      <div className="w-11/12 m-auto text-white">
      <div className="grid grid-cols-12">
        
        <div className="col-span-12">
          
          {close && <div className="relative bg-gradient-to-r gap-x-9 items-center flex justify-between from-[#4B0B3E] to-[#274749] text-white p-8 h-[280px] rounded-lg mb-8">
            <span
              className="absolute top-3 right-4 cursor-pointer border rounded-full p-1 text-white hover:text-gray-300"
              onClick={Close}
            >
              <X  className='h-4 w-4'/>
            </span>
            <div className='w-[288px]'>
            <h1 className="text-2xl font-bold text-white mb-2">Unlock Exclusive Music NFTs</h1>
            <p className="text-base mb-4 text-[#91A2A4]">
              Explore our NFT marketplace. Support your favorite artists while owning a piece of music history.
            </p>
            </div>

            <div className="">
              <Image src={image} alt="Music" width={260} height={228} />
            </div>
          </div>}
         
          <div className="text-white">
            <h2 className="text-base font-bold mb-4">Category</h2>
            <div className="flex justify-between text-sm flex-wrap">
              <button className="border border-gray-800 hover:bg-pink-600 text-white px-4 py-2 rounded-full">All</button>
              <button className="border border-gray-800 hover:bg-pink-600 text-white px-4 py-2 rounded-full">Pop music</button>
              <button className="border border-gray-800 hover:bg-pink-600 text-white px-4 py-2 rounded-full">Christian</button>
              <button className="border border-gray-800 hover:bg-pink-600 text-white px-4 py-2 rounded-full">Hip Hop music</button>
              <button className="border border-gray-800 hover:bg-pink-600 text-white px-4 py-2 rounded-full">Rock music</button>
              <button className="border border-gray-800 hover:bg-pink-600 text-white px-4 py-2 rounded-full">R&B music</button>
              <button className="border border-gray-800 hover:bg-pink-600 text-white px-4 py-2 rounded-full">Electronic music</button>
              <button className="border border-gray-800 hover:bg-pink-600 text-white px-4 py-2 rounded-full">Country music</button>
            </div>
          </div>
          
          <Artist/>
          
          <Trending/>
        </div>

      
      </div>
    </div>
 
   </>
  )
}

export default Stream;
