import React from 'react'
import Image from 'next/image';
import { Check, CirclePlay, Headset, Music, Play, SearchIcon, Upload } from 'lucide-react';
import image from "/public/images/Ellipse.png"

 const Album = () => {
  return (
   <>
   
 
      <div className="w-11/12 m-auto text-white">
      <div className="grid grid-cols-12 gap-8">
        
        <div className="col-span-9">
          
          <div className="relative bg-gradient-to-r gap-x-9 items-center flex justify-between from-[#4B0B3E] to-[#274749] text-white p-8 h-[280px] rounded-lg mb-8">
            <div className='w-[288px]'>
            <div className='flex'><span className='h-4 w-4 rounded-full items-center justify-center flex bg-yellow-700 text-xs mr-2'><Check className='h-2 w-2'/></span> <span>Tip Artist</span></div>
            <h1 className="text-5xl font-bold text-white mb-2">Artist Name</h1>
            <p className="text-base mb-4 text-[#91A2A4]">
            Artist Name
            </p>
            </div>
           
            <div className="absolute right-4 -bottom-16">
              <Image src={image} alt="Music" width={260} height={228} />
            </div>
          </div>

         
          <div className="text-white h-[320px] overflow-y-scroll">
            <ul>
                <li></li>
                <li></li>
            </ul>
          </div>

        </div>

      
        <div className="bg-custom-gradient space-y-2 col-span-3 h-[400px] p-6 rounded-3xl">
          <h2 className="text-base">Welcome Back</h2>
          <h1 className="text-white font-bold text-5xl">Wini</h1>
          <div className="text-gray-400">
            <h3 className="font-semibold text-sm text-white mb-4">Your Music Milestones</h3>
            <ul className='text-sm space-y-2'>
              <li className="text-gray-500 space-x-3 flex items-center"><Play className="w-4 h-4" /> <div className="text-white flex flex-col"><span>Total Stream Count:</span> <span className='text-[#666C6C]'>56 hours</span> </div></li>
              <li className="text-gray-500 space-x-3 flex items-center"><Music className="w-4 h-4"/><div className="text-white flex flex-col">Songs Bought: </div> 12</li>
              <li className="text-gray-500 space-x-3 flex items-center"><CirclePlay className="w-4 h-4"/> <div className="text-white flex flex-col"><span>Albums Bought:</span> <span className='text-[#666C6C]'>3</span></div></li>
              <li className='text-gray-500 space-x-3 flex items-center'><Headset className="w-4 h-4"/> <div className="text-white flex flex-col"><span>Streaming Points:</span> <span className='text-[#666C6C]'>5200 points</span></div> </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

   </>
  )
}

export default Album;
