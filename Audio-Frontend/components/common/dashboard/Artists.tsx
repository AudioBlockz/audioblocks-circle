'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Slider from 'react-slick';
import { ArrowUpRight } from 'lucide-react';
import { NextArrow, PrevArrow } from './landing/NavigationArrow';
import Link from 'next/link';
import axios from 'axios';

interface ApiArtist {
  id: string;
  username: string | null;
  name: string | null;
  profileImage: string | null;
  bio: string | null;
}

const Artists = () => {
  const [artists, setArtists] = useState<ApiArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    axios
      .get(`${url}/api/pool/artists`)
      .then((res) => setArtists(res.data?.data ?? []))
      .catch(() => setArtists([]))
      .finally(() => setLoading(false));
  }, []);

  const collectiveSettings = {
    dots: false,
    infinite: artists.length > 4,
    speed: 500,
    slidesToShow: Math.min(4, artists.length) || 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(3, artists.length) || 1,
          slidesToScroll: 1,
          infinite: artists.length > 3,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: Math.min(2, artists.length) || 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  if (loading) {
    return <div className="h-64 rounded-lg bg-[#1A1A1A] animate-pulse mb-8" />;
  }

  if (artists.length === 0) {
    return null;
  }

  const displayName = (a: ApiArtist) => a.username || a.name || 'Unnamed Artist';

  return (
    <>
      <section className="">
        <div className="flex justify-between items-center pb-6 border-b">
          <h1 className="text-2xl font-semibold text-[#A3A3A3] font-poppins leading-tight tracking-tight">
            Artists
          </h1>
          <Link
            href="/dashboard/community"
            className="bg-[#1E181D] hover:bg-[#885FA8] text-[#A3A3A3] hover:text-[#1E181D] rounded-full p-3"
          >
            <ArrowUpRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="relative py-4">
          <Slider {...collectiveSettings}>
            {artists.map((artist) => (
              <div key={artist.id} className="px-4">
                <Link href={`/artist/${artist.id}`}>
                  <div className="w-full h-40 rounded-lg overflow-hidden mx-auto relative bg-[#1A1A1A]">
                    <Image
                      src={artist.profileImage || '/dashboard/profiledefault.png'}
                      alt={displayName(artist)}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="py-2 text-center md:text-left text-white">
                    <p className="text-sm font-bold">{displayName(artist)}</p>
                    {artist.bio && (
                      <p className="text-xs text-[#A3A3A3] font-normal line-clamp-2">{artist.bio}</p>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </Slider>
        </div>
      </section>
    </>
  );
};

export default Artists;
