// import React from 'react'
// import Rectangle1 from "/public/images/Rectangle1.png";
// import Rectangle2 from "/public/images/Rectangle2.png";
// import Rectangle3 from "/public/images/Rectangle3.png";
// import Rectangle4 from "/public/images/Rectangle4.png";
// import Image from 'next/image';

// const SearchArtist = () => {
//     const recentlyPlayedData = [
//         { title: "Good Day", artist: "Taya Bloom", year: 2024, imageUrl: Rectangle1 },
//         { title: "Good Day", artist: "Taya Bloom", year: 2024, imageUrl: Rectangle2 },
//         { title: "Good Day", artist: "Taya Bloom", year: 2024, imageUrl: Rectangle3},
//         { title: "Good Day", artist: "Taya Bloom", year: 2024, imageUrl: Rectangle4 },
//       ];
//   return (
//     <>
//     <div className="grid grid-cols-4 gap-6">
//     {recentlyPlayedData.map((item, index) => (
//           <div key={index} className=' cursor-pointer '>
//             <div className=" rounded-lg shadow-lg overflow-hidden">
//               <div className='rounded-full'> 

//               <Image
//                 src={item.imageUrl}
//                 alt={item.title}
//                 width={180}
//                 height={200}
//                 className="w-40 rounded-full h-40 object-cover"
//               />
//               </div>
//               <div className="p-4 pt-2 text-center">
//                 <h3 className="text-lg font-semibold">{item.title}</h3>
//                 <p className="text-sm text-gray-400">{item.artist}</p>
//                 <p className="text-sm text-gray-400">{item.year}</p>
//               </div>
//             </div>
//           </div>
//         ))}
//     </div>
//     </>
//   )
// }

// export default SearchArtist


import React from "react";
import Image from "next/image";

interface Artist {
  title: string;
  artist: string;
  year: number;
  imageUrl: string;
}

const SearchArtist: React.FC<{ data: Artist[] }> = ({ data }) => {
  return (
    <div className="grid grid-cols-4 gap-6">
      {data.length > 0 ? (
        data.map((item, index) => (
          <div key={index} className="cursor-pointer">
            <div className="rounded-lg shadow-lg overflow-hidden">
              <div className="rounded-full">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={180}
                  height={200}
                  className="w-40 rounded-full h-40 object-cover"
                />
              </div>
              <div className="p-4 pt-2 text-center">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.artist}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-400 text-center col-span-4">
          No results found.
        </p>
      )}
    </div>
  );
};

export default SearchArtist;
