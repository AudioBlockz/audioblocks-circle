import { Heart } from 'lucide-react';
import Image from 'next/image';

const AudioCard = ({ imageSrc, title, artist, price }:any) => {
  return (
    <div className="bg-gradient-to-b font-roboto rounded-xl w-11/12 m-auto from-[#FFFFFF1A] to-[#FFFFFF0D] my-5 text-white p-5">
      <div className="relative">
        <Image
          src={imageSrc}
          alt={title}
          objectFit="cover"
          className="w-full h-[200px] object-cover rounded-xl"
        />
        <div className="absolute top-0 bg-gradient-to-r rounded-tr-xl rounded-bl-xl from-[#FFFFFF1A] to-[#FFFFFF0D] right-0 p-2 text-white">
          <span className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-white" />
            <span>341</span>
          </span>
        </div>
      </div>

      <div className=" py-4">
        <div className='flex justify-between'>
          <div className=''>
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="text-xs text-gray-400">by {artist}</p>
          </div>
          <p className="mt-2 text-sm font-semibold">{price} ETH</p>
        </div>
        <button className="w-full text-sm mt-4 h-[50px] bg-gradient-to-r from-[#561445] to-[#621022] text-white font-bold rounded-md">
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default AudioCard;
