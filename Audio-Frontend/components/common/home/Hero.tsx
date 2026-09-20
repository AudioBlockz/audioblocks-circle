'use client';

import { usePrivy } from '@privy-io/react-auth';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Auth } from '@/hooks/useAuth';
import FullScreenLoader from './FullScreenLoader';

const ROTATING_WORDS = [
  'Talent',
  'Artists',
  'Sounds',
  'People',
  'Voices',
  'Creator',
  'Melody',
  'Sonics',
  'Groove',
];

// Reserves layout space so "Today" never shifts as words rotate through.
// NOT picked by character count — "Creator" and "Artists" are both 7
// letters, but "Creator" renders visibly wider in this italic font and
// crowded "Today" when the sizer was sized off "Artists" instead. Verified
// directly by rendering each candidate rather than trusting .length.
const LONGEST_WORD = 'Creator';

const Hero = () => {
  const { authenticated } = usePrivy();
  const route = useRouter();
  const { login, loginAsArtist, loading } = Auth();

  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const handleStream = () => {
    if (!authenticated) {
      login();
    } else {
      route.push('/dashboard');
    }
  };

  const handleJoinAsArtist = () => {
    if (!authenticated) {
      loginAsArtist();
    } else {
      route.push('/artist-hub');
    }
  };
  return (
    <section className="relative h-screen text-white py-35 overflow-hidden">
      <div className="absolute right-40 top-2 bg-[#490D3E80] rounded-full w-100 h-100 blur-[100px]" />
      <div className="w-4/5 mx-auto flex flex-col-reverse md:flex-row items-center justify-between">
        <div className="">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">
            Discover Tomorrow’s <br className="hidden md:block" />{' '}
            <span className="relative inline-block align-top capitalize italic pr-4 [perspective:400px]">
              {/* Invisible sizer: reserves the width of the longest word (plus
                  the pr-4 gap above) so "Today" never shifts as shorter or
                  longer words rotate through, and never crowds it either. */}
              <span className="invisible" aria-hidden="true">
                {LONGEST_WORD}
              </span>
              <span key={wordIndex} className="hero-flip-word absolute inset-0 left-0 text-gray-600">
                {ROTATING_WORDS[wordIndex]}
              </span>
            </span>
            Today
          </h1>
          <p className="text-[#DACFD3] font-normal text-base md:text-lg leading-[1.6] mb-8">
            Stream authentic, ad-free music from emerging voices. <br className="hidden md:block" />
            Built for listeners who care and artists who dare.
          </p>
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={handleStream}
              className="bg-[#D2045B] cursor-pointer flex items-center justify-between text-white font-medium px-6 py-2 rounded-full text-sm hover:bg-[#6C022F] hover:text-black transition"
            >
              Stream Now
              <div className="bg-black rounded-full p-1 ml-2">
                <ArrowRight className="h-4 w-4 rotate-[300deg] text-white" />
              </div>
            </button>
            <button
              onClick={handleJoinAsArtist}
              className="border flex items-center justify-between border-[#F2AFC9] text-white font-medium px-6 py-2 rounded-full text-sm hover:bg-[#885FA8] hover:text-black transition"
            >
              Join as Artist
              <div className="bg-[#D2045B] rounded-full p-1 ml-2">
                <ArrowRight className="h-4 w-4 rotate-[300deg] text-white" />
              </div>
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative w-[250px] h-[250px] z-20 rounded-2xl overflow-hidden border border-[#D9D9D9]">
            <Image
              src="/home/frame1.jpg"
              alt="Main Artist"
              fill
              className="rounded-2xl object-cover"
            />
          </div>

          <div className="absolute -top-15 -left-14 scale-x-[-1]  w-[250px] h-[250px] z-10 border border-[#885FA833] rounded-2xl overflow-hidden">
            <Image
              src="/home/frame2.jpg"
              alt="Secondary Artist"
              fill
              className="rounded-2xl object-cover opacity-90"
            />
          </div>
        </div>
      </div>

      <div className="bottom-0 left-0 w-full">
        <Image
          src="/home/hero2.svg"
          alt="Waveform"
          width={1600}
          height={100}
          className="w-full h-auto"
        />
      </div>

      {loading && <FullScreenLoader />}

      <style jsx>{`
        @keyframes heroFlipWord {
          0% {
            transform: rotateX(90deg);
            opacity: 0;
          }
          60% {
            transform: rotateX(0deg);
            opacity: 1;
          }
          100% {
            transform: rotateX(0deg);
            opacity: 1;
          }
        }
        .hero-flip-word {
          animation: heroFlipWord 450ms ease-out;
          transform-origin: 50% 50%;
          backface-visibility: hidden;
        }
      `}</style>
    </section>


  );
};

export default Hero;
