'use client';

import { useRouter } from 'next/navigation';
import { Headphones, History } from 'lucide-react';
import Image from 'next/image';

const ProfilePage = () => {
  const router = useRouter();

  const handleEditClick = () => {
    router.push('/dashboard/profile/edit');
  };

  return (
    <div className="font-inter">
      <p className="text-xs font-medium text-left text-white mb-2">Profile</p>

      <div className="bg-[#1E1F23] p-8 py-13 rounded-lg text-white flex justify-between">
        <div className="flex items-center w-3/5">
          <div className="mr-3">
            <Image
              src="/AFRO.jpg"
              alt="profile"
              width={300}
              height={300}
              className="w-26 h-26 m-auto object-cover rounded-lg"
            />
          </div>
          <div className="flex-1 gap-2">
            <h1 className="md:text-6xl text-3xl mb-2 text-white font-extrabold">Rick Shawn</h1>
            <div className="flex justify-between">
              <div className="flex">
                <History size={15} className="mr-2" />
                <p className="font-semibold text-xs">Joined May 2024</p>
              </div>
              <div className="flex">
                <History size={15} className="mr-2" />
                <p className="font-semibold text-xs">Minutes Listened: 12,450 mins</p>
              </div>
              <div className="flex">
                <Headphones size={15} className="mr-2" />
                <p className="font-semibold text-xs">Casual Listener</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={handleEditClick}
            className="bg-[#B81A3C] text-white cursor-pointer text-sm font-semibold px-4 py-2 rounded-full"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
