'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Auth } from '@/hooks/useAuth';

const Experience = () => {
  const { authenticated } = usePrivy();
  const route = useRouter();
  const { login, loginAsArtist, becomeArtist } = Auth();

  const handleStream = () => {
    if (!authenticated) {
      login();
    } else {
      route.push('/dashboard');
    }
  };

  const handleJoinAsArtist = async () => {
    if (!authenticated) {
      loginAsArtist();
      return;
    }
    const isArtist = await becomeArtist();
    if (isArtist) route.push('/artist-hub');
  };

  return (
    <section className="mb-15 w-4/5 m-auto">
      <div className="max-w-2xl px-4 md:px-0 text-center mx-auto mt-10">
        <h1 className="font-semibold text-[#A3A3A3] text-2xl mb-6 md:text-5xl leading-[100%] tracking-[0%] capitalize font-poppins">
          <span className="text-white">Upgrade</span> Your{' '}
          <span className="text-white">Experience </span>
          with Audioblocks
        </h1>
        <p className="text-[#A3A3A3] max-w-lg m-auto text-sm font-medium">
          No more passive listening, Stream and enjoy your music while earning on Audioblocks
        </p>
      </div>
      <div className="flex flex-col justify-center mt-6 md:flex-row gap-4">
        <button
          onClick={handleStream}
          className="bg-[#D2045B] cursor-pointer flex items-center hover:bg-[#6C022F] hover:text-black justify-between text-white font-medium px-5 py-2 rounded-full text-sm transition"
        >
          Stream Now
          <div className="bg-black rounded-full p-1 ml-2">
            <ArrowRight className="h-4 w-4 rotate-[300deg] text-white" />
          </div>
        </button>
        <button
          onClick={handleJoinAsArtist}
          className="border flex items-center hover:bg-[#885FA8] hover:text-black justify-between border-[#F2AFC9] text-white font-medium px-5 py-2 rounded-full text-sm transition"
        >
          Join as Artist
          <div className="bg-[#D2045B] rounded-full p-1 ml-2">
            <ArrowRight className="h-4 w-4 rotate-[300deg] text-white" />
          </div>
        </button>
      </div>
    </section>
  );
};

export default Experience;
