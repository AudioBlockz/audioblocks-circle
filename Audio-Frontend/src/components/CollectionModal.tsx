import React from 'react'

import { Input } from './ui/input'

const CollectionModal = () => {
  return (
    <>     
        <form>
          <div className="space-y-4 mb-6">
            
            
            <div className="relative">
              <label className="text-white text-sm mb-2 block">Album Title *</label>
              <input
                className="w-full bg-[#1C1C1F] border border-pink-600 rounded-full py-2 px-4 text-white focus:outline-none"
                type="text"
                placeholder="Song Title"
                required
              />
            </div>
  
           
            <div className="relative">
              <label className="text-white text-sm mb-2 block">Description *</label>
              <input
                className="w-full bg-[#1C1C1F] border border-pink-600 rounded-full py-2 px-4 text-white focus:outline-none"
                type="text"
                placeholder="Description of music"
                required
              />
            </div>
  
            
            <div className="grid grid-cols-2 gap-7">
              <div className='col-span-1'>
                <label className="text-white text-sm mb-2 block">Genre *</label>
                <select className="w-full bg-[#1C1C1F] border border-pink-600 rounded-full py-2 px-4 text-white focus:outline-none">
                  <option>Choose Genre</option>
                </select>
              </div>
              <div className='col-span-1'>
                <label className="text-white text-sm mb-2 block">Release Date *</label>
                <input
                  className="w-full bg-[#1C1C1F] border border-pink-600 rounded-full py-2 px-4 text-white focus:outline-none"
                  type="text"
                  placeholder="DDMMYYYY"
                  required
                />
              </div>
            </div>
  
            
            <div className="grid grid-cols-2 gap-7">
              <div className='col-span-1'>
                <label className="text-white text-sm mb-2 block">Purchase Price *</label>
                <input
                  className="w-full bg-[#1C1C1F] border border-pink-600 rounded-full py-2 px-4 text-white focus:outline-none"
                  type="text"
                  placeholder="Enter Purchase Price"
                  required
                />
              </div>
              <div className='col-span-1'>
                <label className="text-white text-sm mb-2 block">Royalty *</label>
                <input
                  className="w-full bg-[#1C1C1F] border border-pink-600 rounded-full py-2 px-4 text-white focus:outline-none"
                  type="text"
                  placeholder="Enter Royalty"
                  required
                />
              </div>
            </div>
  
            
            <div className="grid grid-cols-2 gap-7">
              <div className='col-span-1'>
                <label className="text-white text-sm mb-2 block">Price per Stream *</label>
                <input
                  className="w-full bg-[#1C1C1F] border border-pink-600 rounded-full py-2 px-4 text-white focus:outline-none"
                  type="text"
                  placeholder="Enter Price per Stream"
                  required
                />
              </div>
              <div className='col-span-1'>
                <label className="text-white text-sm mb-2 block">Album Cover Art *</label>
                <div className="w-full bg-[#1C1C1F] border border-dashed border-pink-600 rounded-lg py-2 text-white text-center cursor-pointer">
                  Select a file
                </div>
              </div>
            </div>
          </div>
          <hr />
         
          <div className="grid grid-cols-2 gap-12 mt-8">
            <button className="bg-gradient-to-r col-span-1 from-pink-600 to-pink-400 text-white py-2 px-6 rounded-full">Mint as NFT</button>
            <button className="border border-pink-600 col-span-1 text-white py-2 px-6 rounded-full">Publish</button>
          </div>
        </form>
  </>
  )
}

export default CollectionModal