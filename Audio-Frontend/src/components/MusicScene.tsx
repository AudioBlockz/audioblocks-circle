import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";
import Ellipse from "/public/images/Ellipse.png";
import Ellipse4 from "/public/images/Ellipse4.png";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { fetchArtist } from "@/hooks/fetchArtist";


const MusicScene = () => {
    const { artists, isLoading } = fetchArtist();
    const router = useRouter();
  
    const handleClick = (artistId: string) => {
      router.push(`/dashboard/artist/${artistId}`);
    };



  return (
    <div className=" text-white w-11/12 m-auto py-16 md:px-8 mx-3">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="md:text-4xl text-5xl font-bold mb-2">Explore the Music Scene</h1>
        <p className="text-gray-400 md:w-1/2 w-11/12  m-auto">
          Browse our extensive catalog, search for specific genres or moods, and follow your
          favorite creators to stay updated on their latest releases.
        </p>

        <Link
						// href="/dashboard/marketplace"
            href="/"
						className=" w-44 my-6 px-2 m-auto md:hidden  flex text-white border rounded-full border-[#B81A3C52]  text-sm"
					>
						Go to Marketplace 
            <ArrowRight className="h-4 w-7"/>
					</Link>
      </div>

      {/* Artist Profile Section */}

    
      {!isLoading &&
			<div>
				<div className="flex w-11/12 m-auto items-center justify-center md:justify-between flex-wrap">
					{artists?.slice(1,5).map((artist, index) => (
						<div
							key={index}
							onClick={() => handleClick(artist?.id)}
							className=" cursor-pointer p-2 "
						>
							<div className=" rounded-lg shadow-lg flex items-center flex-col overflow-hidden">
								<div className="rounded-full w-48 h-48 border-4 border-pink-500 p-1">
									<img
										src={artist?.profilePicture?.replace(
											"ipfs://",
											`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
										)}
										alt={artist.fullName}
										className="w-full rounded-full h-full object-cover"
									/>
								</div>
								<div className="p-4 pt-2 md:text-center  text-left">
									<p className="text-lg text-white">{artist?.fullName}</p>
								</div>
							</div>
						</div>
					))}
			</div>
			</div>}


    </div>
  );
};

export default MusicScene;
